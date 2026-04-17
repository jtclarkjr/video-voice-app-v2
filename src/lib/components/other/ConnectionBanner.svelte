<script lang="ts">
	import { connection } from '$lib/stores/connection.svelte';

	let { onRetry = undefined as (() => void) | undefined } = $props<{ onRetry?: () => void }>();
</script>

{#if connection.phase === 'reconnecting'}
	<div class="flex items-center justify-center gap-3 rounded-[1.5rem] bg-yellow-500/12 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
		<div class="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"></div>
		<span>Reconnecting... attempt {connection.reconnectAttempts}</span>
	</div>
{:else if connection.phase === 'failed'}
	<div class="flex items-center justify-center gap-3 rounded-[1.5rem] bg-destructive/12 px-4 py-3 text-sm text-destructive">
		<span>Connection lost</span>
		{#if onRetry}
			<button type="button" class="rounded-full bg-destructive/20 px-3 py-1 text-xs font-semibold" onclick={onRetry}>
				Retry
			</button>
		{/if}
	</div>
{/if}
