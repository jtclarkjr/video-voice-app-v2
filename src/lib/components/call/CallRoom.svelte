<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { tick } from 'svelte';
	import CallControls from '$lib/components/call/CallControls.svelte';
	import LayoutContainer from '$lib/components/layouts/LayoutContainer.svelte';
	import ChatPanel from '$lib/components/other/ChatPanel.svelte';
	import ConnectionBanner from '$lib/components/other/ConnectionBanner.svelte';
	import ParticipantRoster from '$lib/components/other/ParticipantRoster.svelte';
	import { localSpeaking, startAudioLevels, stopAudioLevels, trackStream, untrackStream } from '$lib/audio-levels';
	import { startQualityMonitor, stopQualityMonitor } from '$lib/quality-monitor';
	import { connect, disconnect, sendMediaState } from '$lib/signaling/connection';
	import { clearParticipants, participants, addParticipant, removeParticipant, setParticipantMediaState, setParticipantScreenSharing } from '$lib/stores/participants';
	import { clearUnread, resetChat } from '$lib/stores/chat';
	import { connection, setConnected, setConnectionPhase, setDisconnected } from '$lib/stores/connection';
	import { layout, resetLayout } from '$lib/stores/layout';
	import { enumerateDevices, media, resetMedia, setCameraEnabled, setLocalStream, setMicEnabled } from '$lib/stores/media';
	import { resetScreenShare, screenShare } from '$lib/stores/screen-share';
	import { closeAll, closePeerConnection } from '$lib/webrtc/cleanup';
	import { createOffer, handleAnswer, handleIceCandidate, handleOffer } from '$lib/webrtc/negotiation';
	import { markPeerScreenSharing } from '$lib/webrtc/screen-share-tracks';
	import { getUserMedia } from '$lib/webrtc/shared';
	import type { SignalHandlers } from '$lib/signaling/types';

	let {
		roomId,
		displayName = 'Guest',
		initialMicOn = true,
		initialCameraOn = true
	} = $props<{
		roomId: string;
		displayName?: string;
		initialMicOn?: boolean;
		initialCameraOn?: boolean;
	}>();

	let error = $state<string | null>(null);
	let layoutHost = $state<HTMLDivElement | null>(null);
	let sidePanelHeight = $state<number | null>(null);

	onMount(() => {
		let destroyed = false;

		const init = async () => {
			setConnectionPhase('connecting');
			setMicEnabled(initialMicOn);
			setCameraEnabled(initialCameraOn);

			try {
				const stream = await getUserMedia();
				setLocalStream(stream);
				await enumerateDevices();
			} catch {
				error = 'Could not access camera or microphone. Please check permissions.';
				return;
			}

			if (destroyed) {
				return;
			}

			const handlers: SignalHandlers = {
				onJoined(userId, joinedRoomId, peers) {
					setConnected(userId, joinedRoomId);
					startAudioLevels(userId);
					startQualityMonitor();

					for (const peer of peers) {
						addParticipant(peer.id, peer.displayName);
						setParticipantMediaState(peer.id, {
							audioEnabled: peer.audioEnabled,
							videoEnabled: peer.videoEnabled
						});
						void createOffer(peer.id);
					}
				},
				onPeerJoined(peerId, peerDisplayName, audioEnabled, videoEnabled) {
					addParticipant(peerId, peerDisplayName);
					setParticipantMediaState(peerId, { audioEnabled, videoEnabled });
				},
				onPeerMediaState(peerId, audioEnabled, videoEnabled) {
					setParticipantMediaState(peerId, { audioEnabled, videoEnabled });
				},
				onPeerLeft(peerId) {
					closePeerConnection(peerId);
					removeParticipant(peerId);
					untrackStream(peerId);
				},
				onOffer(fromId, sdp) {
					void handleOffer(fromId, sdp);
				},
				onAnswer(fromId, sdp) {
					void handleAnswer(fromId, sdp);
				},
				onIceCandidate(fromId, candidate) {
					void handleIceCandidate(fromId, candidate);
				},
				onScreenShareStart(peerId) {
					markPeerScreenSharing(peerId, true);
					setParticipantScreenSharing(peerId, true);
				},
				onScreenShareStop(peerId) {
					markPeerScreenSharing(peerId, false);
					setParticipantScreenSharing(peerId, false);
				},
				onError(message) {
					error = message;
				},
				onReconnected() {
					setConnectionPhase('connected');
				}
			};

			connect(roomId, displayName, handlers);
		};

		void init();

		return () => {
			destroyed = true;
			disconnect();
			closeAll();
			stopAudioLevels();
			stopQualityMonitor();
			setDisconnected();
			resetMedia();
			clearParticipants();
			resetLayout();
			resetChat();
			resetScreenShare();
			clearUnread();
		};
	});

	$effect(() => {
		if ($connection.phase === 'connected') {
			sendMediaState($media.isMicOn, $media.isCameraOn);
		}
	});

	$effect(() => {
		if ($media.localStream && $connection.userId) {
			trackStream($connection.userId, $media.localStream);
		}
	});

	$effect(() => {
		for (const [id, participant] of Object.entries($participants)) {
			if (participant.stream) {
				trackStream(id, participant.stream);
			}
		}
	});

	function handleLeave() {
		disconnect();
		closeAll();
		stopAudioLevels();
		stopQualityMonitor();
		setDisconnected();
		resetMedia();
		clearParticipants();
		resetLayout();
		resetChat();
		resetScreenShare();
		void goto('/');
	}

	$effect(() => {
		const panelDeps = {
			mode: $layout.mode,
			chatOpen: $layout.chatOpen,
			rosterOpen: $layout.rosterOpen,
			screenShareActive: $screenShare.localActive,
			participantCount: Object.keys($participants).length,
			localStream: $media.localStream
		};
		void panelDeps;

		let observer: ResizeObserver | null = null;
		let cancelled = false;

		void tick().then(() => {
			if (cancelled || !layoutHost) {
				return;
			}

			const primaryFrame = layoutHost.querySelector('[data-primary-call-frame]') as HTMLElement | null;
			if (!primaryFrame) {
				sidePanelHeight = null;
				return;
			}

			const syncHeight = () => {
				sidePanelHeight = primaryFrame.getBoundingClientRect().height;
			};

			syncHeight();
			observer = new ResizeObserver(syncHeight);
			observer.observe(primaryFrame);
		});

		return () => {
			cancelled = true;
			observer?.disconnect();
		};
	});
</script>

{#if error}
	<div class="flex min-h-[60vh] items-center justify-center">
		<div class="grid gap-4">
			<p class="text-lg text-destructive">{error}</p>
			<a href="/" class="text-sm text-primary underline">Back to lobby</a>
		</div>
	</div>
{:else}
	<div class="grid gap-4">
		<ConnectionBanner />

		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold text-foreground">Room: {roomId}</h2>
			<span class="text-sm text-muted-foreground">
				{Object.keys($participants).length + 1} participant{Object.keys($participants).length === 0 ? '' : 's'}
			</span>
		</div>

		<div class="flex items-start gap-4">
			<div bind:this={layoutHost} class="min-w-0 flex-1">
				<LayoutContainer
					localStream={$media.localStream}
					participants={$participants}
					isCameraOn={$media.isCameraOn}
					localDisplayName={displayName}
					localSpeaking={$localSpeaking}
				/>
			</div>

			{#if $layout.chatOpen}
				<div class="w-80 shrink-0 self-start overflow-hidden" style:height={sidePanelHeight ? `${sidePanelHeight}px` : undefined}>
					<ChatPanel />
				</div>
			{:else if $layout.rosterOpen}
				<div class="w-80 shrink-0 self-start overflow-hidden" style:height={sidePanelHeight ? `${sidePanelHeight}px` : undefined}>
					<ParticipantRoster localDisplayName={displayName} />
				</div>
			{/if}
		</div>

		<CallControls onLeave={handleLeave} />
	</div>
{/if}
