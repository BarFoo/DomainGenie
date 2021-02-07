<script lang="ts">
  /* @todo Support various heights */
  import { fade } from "svelte/transition";
  import { MenuDirection } from "../constants/menuDirection";

  export let menuDirection: MenuDirection;
  export let isShowing: boolean = false;
  export let leftPos: number = 0;
  
  // Spacing (in pixels) at the bottom of the menu if it is up direction
  // This looks funny, but allows for dynamic height on the flyout menu content
  export let bottomSpacing: number = 15;

  let flyoutMenuRef: HTMLElement;

  $: {
    // Adjust negative top position to allow for dynamic height
    if(flyoutMenuRef && menuDirection === MenuDirection.UP) {
      flyoutMenuRef.style.top = `-${flyoutMenuRef.offsetHeight + bottomSpacing}px`;
    }
  }
</script>

{#if isShowing}
  <div class="flyout-menu transform -translate-x-1/2" 
      class:up={menuDirection === MenuDirection.UP}
      class:down={menuDirection === MenuDirection.DOWN}
      style="left: {leftPos}px"
      bind:this={flyoutMenuRef}
      in:fade>
        <div class="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
          <div class="relative grid gap-6 bg-white px-5 py-6">
            <slot></slot>
          </div>
        </div>
  </div>
  <div class="flyout-backdrop" on:click|self={() => isShowing = false}></div>
{/if}

<style>
  .flyout-menu {
    position: absolute;
    z-index: 100;
    width: 28rem;
    max-width: 28rem;
  }
  .flyout-menu.up {
    /* Must be equal to at least the height of the body and any extra spacing */
    top: -18rem;
  }
  .flyout-menu.down {
    bottom: -0.75rem;
  }
  .flyout-backdrop {
    /* Z index of this must be lower than the flyout menu, but higher than everything else on the page */
    background: rgba(125, 125, 125, 0.1);
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 50;
  }

  @media (prefers-color-scheme: dark) {
    .flyout-backdrop {
      background: rgba(180, 180, 180, 0.2);
    }
  }
</style>