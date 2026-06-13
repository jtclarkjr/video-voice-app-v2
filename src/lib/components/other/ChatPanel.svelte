<script lang="ts">
  import { X } from 'lucide-svelte'
  import { chat } from '$lib/stores/chat.svelte'
  import { connection } from '$lib/stores/connection.svelte'
  import { broadcastChatMessage } from '$lib/webrtc/data-channel'
  import type { ChatMessage } from '$lib/types/chat'

  type PanelVariant = 'side' | 'sheet'

  let { variant = 'side', onClose = undefined } = $props<{
    variant?: PanelVariant
    onClose?: () => void
  }>()

  let text = $state('')
  let sendError = $state<string | null>(null)
  let scroller = $state<HTMLDivElement | null>(null)
  const titleId = 'chat-panel-title'
  const errorId = 'chat-message-error'

  const shellClass = $derived(
    variant === 'sheet'
      ? 'flex max-h-[min(70dvh,34rem)] min-h-0 flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl'
      : 'flex h-full min-h-0 flex-col overflow-hidden border-l border-border bg-card'
  )

  $effect(() => {
    chat.clearUnread()
  })

  $effect(() => {
    if (text.trim()) {
      sendError = null
    }
  })

  $effect(() => {
    const messageCount = chat.messages.length
    void messageCount

    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight
    }
  })

  function handleSend(event: SubmitEvent) {
    event.preventDefault()
    const trimmed = text.trim()
    sendError = null

    if (!trimmed) {
      sendError = 'Enter a message before sending.'
      return
    }

    if (!connection.userId) {
      sendError = 'Connect to the room before sending.'
      return
    }

    const message: ChatMessage = {
      id: `${connection.userId}-${Date.now()}`,
      fromId: connection.userId,
      displayName: 'You',
      text: trimmed,
      timestamp: Date.now()
    }

    chat.addMessage(message)
    broadcastChatMessage(message)
    text = ''
  }
</script>

<div
  class={shellClass}
  role={variant === 'sheet' ? 'dialog' : 'region'}
  aria-modal={variant === 'sheet' ? 'true' : undefined}
  aria-labelledby={titleId}
>
  <div
    class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3"
  >
    <h3 id={titleId} class="text-sm font-semibold text-foreground">Chat</h3>
    {#if variant === 'sheet'}
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        onclick={() => onClose?.()}
        aria-label="Close chat"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
    {/if}
  </div>

  <div
    bind:this={scroller}
    class="min-h-0 flex-1 overflow-y-auto px-4 py-3"
    role="log"
    aria-label="Chat messages"
    aria-live="polite"
    aria-relevant="additions text"
  >
    {#if chat.messages.length === 0}
      <p class="text-center text-xs text-muted-foreground" role="status">
        No messages yet
      </p>
    {:else}
      <div class="grid gap-3">
        {#each chat.messages as message (message.id)}
          <div
            class={message.fromId === connection.userId
              ? 'text-right'
              : 'text-left'}
            role="article"
            aria-label={`Message from ${message.fromId === connection.userId ? 'You' : message.displayName}`}
          >
            <div class="text-xs text-muted-foreground">
              {message.fromId === connection.userId
                ? 'You'
                : message.displayName} ·
              <time datetime={new Date(message.timestamp).toISOString()}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            </div>
            <div
              class={`mt-0.5 inline-block max-w-full break-words rounded-lg px-3 py-1.5 text-sm ${message.fromId === connection.userId ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
            >
              {message.text}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <form onsubmit={handleSend} class="shrink-0 border-t border-border p-3">
    <label for="chat-message-input" class="sr-only">Message</label>
    <div class="flex gap-2">
      <input
        id="chat-message-input"
        bind:value={text}
        class="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 focus:border-primary"
        placeholder="Send a message…"
        name="message"
        autocomplete="off"
        aria-invalid={sendError !== null}
        aria-describedby={sendError ? errorId : undefined}
      />
      <button
        type="submit"
        class="shrink-0 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-50"
        disabled={!connection.userId}
      >
        Send
      </button>
    </div>
    {#if sendError}
      <p
        id={errorId}
        class="mt-2 text-xs text-destructive"
        role="alert"
        aria-live="assertive"
      >
        {sendError}
      </p>
    {/if}
  </form>
</div>
