<script lang="ts">
	import { addChatMessage, chat, clearUnread } from '$lib/stores/chat';
	import { connection } from '$lib/stores/connection';
	import { broadcastChatMessage } from '$lib/webrtc/data-channel';
	import type { ChatMessage } from '$lib/types/chat';

	let text = $state('');
	let scroller = $state<HTMLDivElement | null>(null);

	$effect(() => {
		clearUnread();
	});

	$effect(() => {
		if (scroller) {
			scroller.scrollTop = scroller.scrollHeight;
		}
	});

	function handleSend(event: SubmitEvent) {
		event.preventDefault();
		const trimmed = text.trim();
		if (!trimmed || !$connection.userId) {
			return;
		}

		const message: ChatMessage = {
			id: `${$connection.userId}-${Date.now()}`,
			fromId: $connection.userId,
			displayName: 'You',
			text: trimmed,
			timestamp: Date.now()
		};

		addChatMessage(message);
		broadcastChatMessage(message);
		text = '';
	}
</script>

<div class="glass-card surface-border flex h-full flex-col rounded-[1.75rem]">
	<div class="border-b border-border px-4 py-3">
		<h3 class="text-sm font-semibold text-foreground">Chat</h3>
	</div>

	<div bind:this={scroller} class="flex-1 space-y-3 overflow-y-auto px-4 py-4">
		{#if $chat.messages.length === 0}
			<p class="text-center text-xs text-muted-foreground">No messages yet.</p>
		{:else}
			{#each $chat.messages as message (message.id)}
				<div class={message.fromId === $connection.userId ? 'text-right' : 'text-left'}>
					<div class="text-xs text-muted-foreground">
						{message.fromId === $connection.userId ? 'You' : message.displayName} · {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
					</div>
					<div class={`mt-1 inline-block max-w-full rounded-2xl px-3 py-2 text-sm ${message.fromId === $connection.userId ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
						{message.text}
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<form onsubmit={handleSend} class="border-t border-border p-3">
		<div class="flex gap-2">
			<input
				bind:value={text}
				class="min-w-0 flex-1 rounded-2xl border border-input bg-card px-4 py-3 outline-none focus:border-primary"
				placeholder="Send a message..."
			/>
			<button type="submit" class="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={!text.trim()}>
				Send
			</button>
		</div>
	</form>
</div>
