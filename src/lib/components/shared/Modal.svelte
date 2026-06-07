<script lang="ts">
  let {
    open = $bindable(false),
    title = '',
    eyebrow = 'Panel',
    widthClass = 'max-w-lg',
    children
  } = $props<{
    open?: boolean
    title?: string
    eyebrow?: string
    widthClass?: string
    children?: () => unknown
  }>()

  let dialogElement = $state<HTMLDivElement | null>(null)
  let previousFocus: HTMLElement | null = null

  const titleId = `modal-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'dialog'}`
  const focusableSelector = [
    'a[href]',
    'button:not(:disabled)',
    'input:not(:disabled)',
    'select:not(:disabled)',
    'textarea:not(:disabled)',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',')

  $effect(() => {
    if (!open) {
      return
    }

    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    queueMicrotask(focusFirstElement)

    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
      previousFocus = null
    }
  })

  function close() {
    open = false
  }

  function getFocusableElements() {
    if (!dialogElement) {
      return []
    }

    return Array.from(dialogElement.querySelectorAll<HTMLElement>(focusableSelector)).filter(
      (element) => !element.matches(':disabled') && element.offsetParent !== null
    )
  }

  function focusFirstElement() {
    const focusable = getFocusableElements()
    const preferred = focusable.find((element) => element.hasAttribute('autofocus'))
    ;(preferred ?? focusable[0] ?? dialogElement)?.focus()
  }

  function handleDialogKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }

    if (event.key !== 'Tab') {
      return
    }

    const focusable = getFocusableElements()
    if (focusable.length === 0) {
      event.preventDefault()
      dialogElement?.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
      return
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  // Portal the modal to <body> so ancestors with `backdrop-filter`/`transform`
  // don't constrain our `position: fixed` (which otherwise uses the ancestor as
  // the containing block and pins the dialog inside the header).
  function portal(node: HTMLElement) {
    document.body.appendChild(node)
    return {
      destroy() {
        if (node.parentNode) {
          node.parentNode.removeChild(node)
        }
      }
    }
  }
</script>

{#if open}
  <div use:portal class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button
      type="button"
      class="absolute inset-0 bg-black/45 backdrop-blur-sm"
      tabindex="-1"
      onclick={close}
      aria-label="Close dialog"
    ></button>
    <div
      bind:this={dialogElement}
      class={`glass-card surface-border relative z-10 w-full rounded-[2rem] p-6 ${widthClass}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabindex="-1"
      onkeydown={handleDialogKeydown}
    >
      <div class="mb-5 flex items-start justify-between gap-4">
        <div class="grid gap-1">
          {#if eyebrow}
            <p class="text-xs font-black uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
          {/if}
          <h2 id={titleId} class="text-2xl font-bold text-foreground">{title}</h2>
        </div>
        <button
          type="button"
          class="flex size-10 items-center justify-center rounded-full bg-secondary text-lg text-secondary-foreground transition hover:scale-105"
          onclick={close}
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>

      {@render children?.()}
    </div>
  </div>
{/if}
