import { participants } from '$lib/stores/participants.svelte'
import type { NetworkQuality } from '$lib/types/connection'
import { bestEffort } from '$lib/utils'
import { peerConnections } from '$lib/webrtc/shared'

const POLL_INTERVAL = 5000
const DOWNGRADE_THRESHOLD = 3
const UPGRADE_THRESHOLD = 5

type QualityProfile = {
  maxBitrate: number
  maxFramerate: number
  scaleResolutionDownBy: number
}

const QUALITY_PROFILES: Record<NetworkQuality, QualityProfile> = {
  good: { maxBitrate: 1_500_000, maxFramerate: 30, scaleResolutionDownBy: 1 },
  fair: { maxBitrate: 750_000, maxFramerate: 24, scaleResolutionDownBy: 1.5 },
  poor: { maxBitrate: 400_000, maxFramerate: 15, scaleResolutionDownBy: 2 },
  unknown: { maxBitrate: 1_500_000, maxFramerate: 30, scaleResolutionDownBy: 1 }
}

const QUALITY_ORDER: NetworkQuality[] = ['good', 'fair', 'poor']

type PeerQualityState = {
  currentQuality: NetworkQuality
  consecutiveBetter: number
  consecutiveWorse: number
  lastBytesSent: number
  lastBytesReceived: number
  lastPacketsLost: number
  lastPacketsSent: number
  lastTimestamp: number
}

const peerStates = new Map<string, PeerQualityState>()
let pollTimer: ReturnType<typeof setInterval> | null = null

export function startQualityMonitor() {
  if (!pollTimer) {
    pollTimer = setInterval(pollStats, POLL_INTERVAL)
  }
}

export function stopQualityMonitor() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  peerStates.clear()
}

function computeQuality(rtt: number, packetLossRate: number): NetworkQuality {
  if (rtt < 0.1 && packetLossRate < 0.02) {
    return 'good'
  }
  if (rtt < 0.3 && packetLossRate < 0.05) {
    return 'fair'
  }
  return 'poor'
}

async function pollStats() {
  for (const [peerId, pc] of peerConnections) {
    if (pc.connectionState !== 'connected') {
      continue
    }

    const stats = await bestEffort(pc.getStats())
    if (!stats) {
      continue
    }

    let rtt = 0
    let packetsLost = 0
    let packetsSent = 0
    let bytesSent = 0
    let bytesReceived = 0

    stats.forEach((report) => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rtt = report.currentRoundTripTime ?? rtt
      }
      if (report.type === 'outbound-rtp' && report.kind === 'video') {
        bytesSent = report.bytesSent ?? bytesSent
        packetsSent = report.packetsSent ?? packetsSent
      }
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        bytesReceived = report.bytesReceived ?? bytesReceived
      }
      if (report.type === 'remote-inbound-rtp' && report.kind === 'video') {
        packetsLost = report.packetsLost ?? packetsLost
      }
    })

    let state = peerStates.get(peerId)
    if (!state) {
      peerStates.set(peerId, {
        currentQuality: 'unknown',
        consecutiveBetter: 0,
        consecutiveWorse: 0,
        lastBytesSent: bytesSent,
        lastBytesReceived: bytesReceived,
        lastPacketsLost: packetsLost,
        lastPacketsSent: packetsSent,
        lastTimestamp: Date.now()
      })
      continue
    }

    const deltaPacketsLost = packetsLost - state.lastPacketsLost
    const deltaPacketsSent = packetsSent - state.lastPacketsSent
    const lossRate =
      deltaPacketsSent > 0 ? deltaPacketsLost / deltaPacketsSent : 0

    const measuredQuality = computeQuality(rtt, lossRate)
    const currentIdx = QUALITY_ORDER.indexOf(
      state.currentQuality === 'unknown' ? 'good' : state.currentQuality
    )
    const measuredIdx = QUALITY_ORDER.indexOf(measuredQuality)

    if (measuredIdx > currentIdx) {
      state.consecutiveWorse++
      state.consecutiveBetter = 0
      if (state.consecutiveWorse >= DOWNGRADE_THRESHOLD) {
        state.currentQuality = measuredQuality
        state.consecutiveWorse = 0
        participants.setNetworkQuality(peerId, measuredQuality)
        void applyQualityProfile(pc, measuredQuality)
      }
    } else if (measuredIdx < currentIdx) {
      state.consecutiveBetter++
      state.consecutiveWorse = 0
      if (state.consecutiveBetter >= UPGRADE_THRESHOLD) {
        state.currentQuality = measuredQuality
        state.consecutiveBetter = 0
        participants.setNetworkQuality(peerId, measuredQuality)
        void applyQualityProfile(pc, measuredQuality)
      }
    } else {
      state.consecutiveBetter = 0
      state.consecutiveWorse = 0
      if (state.currentQuality === 'unknown') {
        state.currentQuality = measuredQuality
        participants.setNetworkQuality(peerId, measuredQuality)
      }
    }

    state.lastBytesSent = bytesSent
    state.lastBytesReceived = bytesReceived
    state.lastPacketsLost = packetsLost
    state.lastPacketsSent = packetsSent
    state.lastTimestamp = Date.now()
  }
}

async function applyQualityProfile(
  pc: RTCPeerConnection,
  quality: NetworkQuality
) {
  const profile = QUALITY_PROFILES[quality]

  for (const sender of pc.getSenders()) {
    if (sender.track?.kind !== 'video') {
      continue
    }

    const params = sender.getParameters()
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}]
    }

    for (const encoding of params.encodings) {
      encoding.maxBitrate = profile.maxBitrate
      encoding.maxFramerate = profile.maxFramerate
      encoding.scaleResolutionDownBy = profile.scaleResolutionDownBy
    }

    if ((await bestEffort(sender.setParameters(params))) === null) {
      continue
    }
  }
}
