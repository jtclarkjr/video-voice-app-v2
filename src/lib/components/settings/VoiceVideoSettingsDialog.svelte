<script lang="ts">
	import Modal from '$lib/components/shared/Modal.svelte';
	import { media } from '$lib/stores/media.svelte';
	import type { NoiseSuppression } from '$lib/types/media';

	let { open = false, onClose = () => {} } = $props<{ open?: boolean; onClose?: () => void }>();

	let videoElement = $state<HTMLVideoElement | null>(null);
	let previewStream = $state<MediaStream | null>(null);
	let micTestStream = $state<MediaStream | null>(null);
	let micCanvas = $state<HTMLCanvasElement | null>(null);
	let animationFrame = 0;

	$effect(() => {
		if (!open) {
			stopPreview();
			stopMicTest();
			return;
		}

		void (async () => {
			try {
				const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
				for (const track of tempStream.getTracks()) {
					track.stop();
				}
			} catch {
				// Permissions denied.
			}

			await media.enumerateDevices();
		})();
	});

	$effect(() => {
		if (videoElement) {
			videoElement.srcObject = previewStream;
		}
	});

	$effect(() => {
		if (!micCanvas || !micTestStream) {
			return;
		}

		const context = new AudioContext();
		const source = context.createMediaStreamSource(micTestStream);
		const analyser = context.createAnalyser();
		analyser.fftSize = 256;
		source.connect(analyser);
		const data = new Uint8Array(analyser.frequencyBinCount);

		const draw = () => {
			animationFrame = requestAnimationFrame(draw);
			analyser.getByteFrequencyData(data);
			const ctx = micCanvas?.getContext('2d');
			if (!ctx || !micCanvas) {
				return;
			}
			const width = micCanvas.width;
			const height = micCanvas.height;
			ctx.clearRect(0, 0, width, height);
			const avg = data.reduce((sum, value) => sum + value, 0) / data.length / 255;
			const bars = 24;
			const barWidth = (width - (bars - 1) * 4) / bars;

			for (let index = 0; index < bars; index += 1) {
				const active = avg > index / bars;
				ctx.fillStyle = active ? '#2d936c' : '#d8c5b8';
				ctx.fillRect(index * (barWidth + 4), 0, barWidth, height);
			}
		};

		draw();

		return () => {
			cancelAnimationFrame(animationFrame);
			source.disconnect();
			void context.close();
		};
	});

	async function startPreview() {
		stopPreview();

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: media.selectedVideoInput ? { deviceId: { exact: media.selectedVideoInput } } : true
			});
			previewStream = stream;
		} catch {
			previewStream = null;
		}
	}

	function stopPreview() {
		if (previewStream) {
			for (const track of previewStream.getTracks()) {
				track.stop();
			}
		}
		previewStream = null;
	}

	async function startMicTest() {
		stopMicTest();
		try {
			micTestStream = await navigator.mediaDevices.getUserMedia({
				audio: media.selectedAudioInput ? { deviceId: { exact: media.selectedAudioInput } } : true
			});
		} catch {
			micTestStream = null;
		}
	}

	function stopMicTest() {
		if (micTestStream) {
			for (const track of micTestStream.getTracks()) {
				track.stop();
			}
		}
		micTestStream = null;
	}
</script>

<Modal open={open} onClose={onClose} title="Voice & Video" widthClass="max-w-2xl">
	<div class="grid gap-6">
		<div class="grid gap-4 md:grid-cols-2">
			<label class="grid gap-2">
				<span class="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Microphone</span>
				<select class="rounded-2xl border border-input bg-card px-4 py-3" value={media.selectedAudioInput} onchange={(event) => media.setSelectedAudioInput((event.currentTarget as HTMLSelectElement).value)}>
					{#each media.audioInputs.length > 0 ? media.audioInputs : [{ deviceId: '', label: 'Default' }] as device}
						<option value={device.deviceId}>{device.label}</option>
					{/each}
				</select>
			</label>
			<label class="grid gap-2">
				<span class="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Speaker</span>
				<select class="rounded-2xl border border-input bg-card px-4 py-3" value={media.selectedAudioOutput} onchange={(event) => media.setSelectedAudioOutput((event.currentTarget as HTMLSelectElement).value)}>
					{#each media.audioOutputs.length > 0 ? media.audioOutputs : [{ deviceId: '', label: 'Default' }] as device}
						<option value={device.deviceId}>{device.label}</option>
					{/each}
				</select>
			</label>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<label class="grid gap-2">
				<span class="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Mic Volume</span>
				<input type="range" min="0" max="200" value={media.inputVolume} oninput={(event) => media.setInputVolume(Number((event.currentTarget as HTMLInputElement).value))} />
			</label>
			<label class="grid gap-2">
				<span class="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Speaker Volume</span>
				<input type="range" min="0" max="200" value={media.outputVolume} oninput={(event) => media.setOutputVolume(Number((event.currentTarget as HTMLInputElement).value))} />
			</label>
		</div>

		<div class="grid gap-3 rounded-[1.5rem] bg-secondary/60 p-4">
			<div class="flex flex-wrap items-center gap-3">
				<button type="button" class="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onclick={() => void (micTestStream ? stopMicTest() : startMicTest())}>
					{micTestStream ? 'Stop Mic Test' : 'Start Mic Test'}
				</button>
				<canvas bind:this={micCanvas} width="320" height="18" class="h-[18px] w-full rounded-full bg-muted md:flex-1"></canvas>
			</div>
			<div class="grid gap-3 md:grid-cols-2">
				<label class="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
					<span class="text-sm font-semibold">Echo Cancellation</span>
					<input type="checkbox" checked={media.echoCancellation} onchange={(event) => media.setEchoCancellation((event.currentTarget as HTMLInputElement).checked)} />
				</label>
				<label class="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
					<span class="text-sm font-semibold">Automatic Gain Control</span>
					<input type="checkbox" checked={media.autoGainControl} onchange={(event) => media.setAutoGainControl((event.currentTarget as HTMLInputElement).checked)} />
				</label>
			</div>
			<label class="grid gap-2">
				<span class="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Noise Suppression</span>
				<select class="rounded-2xl border border-input bg-card px-4 py-3" value={media.noiseSuppression} onchange={(event) => media.setNoiseSuppression((event.currentTarget as HTMLSelectElement).value as NoiseSuppression)}>
					<option value="high">High</option>
					<option value="low">Low</option>
					<option value="off">Off</option>
				</select>
			</label>
		</div>

		<div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
			<div class="relative aspect-video overflow-hidden rounded-[1.75rem] bg-secondary">
				<video bind:this={videoElement} autoplay playsinline muted class={`h-full w-full object-cover ${previewStream ? 'scale-x-[-1]' : 'hidden'}`}></video>
				{#if !previewStream}
					<div class="absolute inset-0 flex items-center justify-center">
						<button type="button" class="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onclick={() => void startPreview()}>
							Test Camera
						</button>
					</div>
				{:else}
					<button type="button" class="absolute bottom-3 right-3 rounded-full bg-card px-3 py-1 text-xs font-semibold" onclick={stopPreview}>
						Stop Preview
					</button>
				{/if}
			</div>

			<label class="grid gap-2">
				<span class="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Camera</span>
				<select class="rounded-2xl border border-input bg-card px-4 py-3" value={media.selectedVideoInput} onchange={(event) => media.setSelectedVideoInput((event.currentTarget as HTMLSelectElement).value)}>
					{#each media.videoInputs.length > 0 ? media.videoInputs : [{ deviceId: '', label: 'Default' }] as device}
						<option value={device.deviceId}>{device.label}</option>
					{/each}
				</select>
			</label>
		</div>
	</div>
</Modal>
