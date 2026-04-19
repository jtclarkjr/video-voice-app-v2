<script lang="ts">
  import { onMount } from 'svelte'
  import { cn } from '$lib/utils'

  let {
    open = $bindable(false),
    align = 'center',
    trigger,
    children
  } = $props<{
    open?: boolean
    align?: 'start' | 'center' | 'end'
    trigger?: () => unknown
    children?: () => unknown
  }>()

  let root = $state<HTMLDivElement | null>(null)

  onMount(() => {
    const handleClick = (event: MouseEvent) => {
      if (!open || !root) {
        return
      }
      if (!root.contains(event.target as Node)) {
        open = false
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        open = false
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  })
</script>

<div bind:this={root} class="relative">
  <div>
    {@render trigger?.()}
  </div>

  {#if open}
    <div
      class={cn(
        'popover-shell absolute top-full z-30 mt-2 min-w-[240px]',
        align === 'start' && 'left-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        align === 'end' && 'right-0'
      )}
    >
      {@render children?.()}
    </div>
  {/if}
</div>
