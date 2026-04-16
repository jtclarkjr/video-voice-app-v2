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

<div class="flex h-full flex-col border-l border-border bg-card">
	<div class="border-b border-border px-4 py-3">
		<h3 class="text-sm font-semibold text-foreground">Chat</h3>
	</div>

	<div bind:this={scroller} class="min-h-0 flex-1 overflow-y-auto px-4 py-3">
		{#if $chat.messages.length === 0}
			<p class="text-center text-xs text-muted-foreground">No messages yet</p>
		{:else}
			<div class="grid gap-3">
				{#each $chat.messages as message (message.id)}
					<div class={message.fromId === $connection.userId ? 'text-right' : 'text-left'}>
						<div class="text-xs text-muted-foreground">
							{message.fromId === $connection.userId ? 'You' : message.displayName} · {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
						</div>
						<div class={`mt-0.5 inline-block rounded-lg px-3 py-1.5 text-sm ${message.fromId === $connection.userId ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
							{message.text}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<form onsubmit={handleSend} class="border-t border-border p-3">
		<div class="flex gap-2">
			<input
				bind:value={text}
				class="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary"
				placeholder="Send a message..."
			/>
			<button type="submit" class="shrink-0 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50" disabled={!text.trim()}>
				Send
			</button>
		</div>
	</form>
</div>
