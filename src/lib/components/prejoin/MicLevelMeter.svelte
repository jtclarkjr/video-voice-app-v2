<script lang="ts">
	let { stream } = $props<{ stream: MediaStream }>();

	let canvas = $state<HTMLCanvasElement | null>(null);

	$effect(() => {
		if (!canvas || !stream) {
			return;
		}

		const el = canvas;
		const context = new AudioContext();
		const source = context.createMediaStreamSource(stream);
		const analyser = context.createAnalyser();
		analyser.fftSize = 256;
		source.connect(analyser);

		const data = new Uint8Array(analyser.frequencyBinCount);
		let animationFrame = 0;

		const draw = () => {
			animationFrame = requestAnimationFrame(draw);
			analyser.getByteFrequencyData(data);

			const canvasCtx = el.getContext('2d');
			if (!canvasCtx) {
				return;
			}

			const w = el.width;
			const h = el.height;
			canvasCtx.clearRect(0, 0, w, h);

			const bars = 40;
			const barW = (w - (bars - 1) * 2) / bars;
			const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;

			const styles = getComputedStyle(el);
			const activeColor = styles.getPropertyValue('--color-success').trim() || '#2d936c';
			const inactiveColor = styles.getPropertyValue('--color-muted').trim() || '#eaded2';

			for (let i = 0; i < bars; i += 1) {
				const threshold = i / bars;
				const active = avg > threshold;
				canvasCtx.fillStyle = active ? activeColor : inactiveColor;
				const x = i * (barW + 2);
				canvasCtx.fillRect(x, 2, barW, h - 4);
			}
		};

		draw();

		return () => {
			cancelAnimationFrame(animationFrame);
			source.disconnect();
			void context.close();
		};
	});
</script>

<div class="grid gap-2">
	<span class="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Microphone</span>
	<canvas bind:this={canvas} width="400" height="20" class="h-5 w-full rounded-full bg-muted"></canvas>
</div>
