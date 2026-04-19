import { layout } from '$lib/stores/layout.svelte'
import { participants } from '$lib/stores/participants.svelte'

const SAMPLE_INTERVAL = 100
const SPEAKING_THRESHOLD = 15
const SPEAKING_FRAMES_REQUIRED = 3
const SILENCE_FRAMES_REQUIRED = 5

type AudioTracker = {
  context: AudioContext
  source: MediaStreamAudioSourceNode
  analyser: AnalyserNode
  data: Uint8Array<ArrayBuffer>
  speakingFrames: number
  silenceFrames: number
  isSpeaking: boolean
}

const trackers = new Map<string, AudioTracker>()
let pollTimer: ReturnType<typeof setInterval> | null = null
let localId: string | null = null
let localSpeaking = $state(false)

function createAudioTracker(stream: MediaStream): AudioTracker | null {
  try {
    const context = new AudioContext()
    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)

    return {
      context,
      source,
      analyser,
      data: new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>,
      speakingFrames: 0,
      silenceFrames: 0,
      isSpeaking: false
    }
  } catch {
    return null
  }
}

function sampleAll() {
  let highestLevel = 0
  let highestId: string | null = null

  for (const [id, tracker] of trackers) {
    tracker.analyser.getByteFrequencyData(tracker.data)
    const avg = tracker.data.reduce((a, b) => a + b, 0) / tracker.data.length

    if (avg > SPEAKING_THRESHOLD) {
      tracker.speakingFrames += 1
      tracker.silenceFrames = 0
    } else {
      tracker.silenceFrames += 1
      tracker.speakingFrames = 0
    }

    const wasSpeaking = tracker.isSpeaking

    if (
      !tracker.isSpeaking &&
      tracker.speakingFrames >= SPEAKING_FRAMES_REQUIRED
    ) {
      tracker.isSpeaking = true
    } else if (
      tracker.isSpeaking &&
      tracker.silenceFrames >= SILENCE_FRAMES_REQUIRED
    ) {
      tracker.isSpeaking = false
    }

    if (tracker.isSpeaking !== wasSpeaking) {
      if (id === localId) {
        localSpeaking = tracker.isSpeaking
      } else {
        participants.setSpeaking(id, tracker.isSpeaking, avg)
      }
    }

    if (tracker.isSpeaking && avg > highestLevel) {
      highestLevel = avg
      highestId = id
    }
  }

  if (highestId && highestId !== localId) {
    layout.setActiveSpeaker(highestId)
  }
}

export const audioLevels = {
  get localSpeaking() {
    return localSpeaking
  },
  start(userId: string) {
    localId = userId
    if (!pollTimer) {
      pollTimer = setInterval(sampleAll, SAMPLE_INTERVAL)
    }
  },
  stop() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }

    for (const [, tracker] of trackers) {
      tracker.source.disconnect()
      void tracker.context.close()
    }

    trackers.clear()
    localId = null
    localSpeaking = false
  },
  track(id: string, stream: MediaStream) {
    audioLevels.untrack(id)

    if (stream.getAudioTracks().length === 0) {
      return
    }

    const tracker = createAudioTracker(stream)
    if (!tracker) {
      return
    }

    trackers.set(id, tracker)
  },
  untrack(id: string) {
    const tracker = trackers.get(id)
    if (!tracker) {
      return
    }

    tracker.source.disconnect()
    void tracker.context.close()
    trackers.delete(id)
  }
}
