<script lang="ts">
  import { MenuDirection } from "../constants/menuDirection";
  import Button from "./Button.svelte";
  import FlyoutMenu from "./FlyoutMenu.svelte";

  export let menuDirection: MenuDirection = MenuDirection.DOWN;
  export let type: string;
  export let rounded: boolean = true;
  export let disabled: boolean = false;
  export let title: string = undefined;
  export let iconName: string = undefined;
  export let uppercase: boolean = true;
  export let bold: boolean = true;
  export let size: string = "default";

  let flyoutIconName: string;
  let isShowing: boolean = false;
  let flyoutButtonRef: HTMLElement;
  let flyoutMenuPosLeft: number;

  $: {
    if(isShowing) {
      flyoutIconName = "close";

      if(flyoutButtonRef) {
        flyoutMenuPosLeft = (flyoutButtonRef.offsetWidth / 2);
      }
    } else {
      switch(menuDirection) {
        case MenuDirection.UP:
          flyoutIconName = "chevron-up";
          break;
        case MenuDirection.DOWN:
        default:
          flyoutIconName = "chevron-down";
          break;
      }
    }
  }

</script>

<div class="relative">
  <div class="flyout-button" bind:this={flyoutButtonRef}>
    <Button trailingIconName={flyoutIconName}
     bind:type
     {rounded}
     bind:size
     bind:disabled
     bind:iconName
     {title}
     {uppercase}
     {bold}
     on:click={() => isShowing = !isShowing}><slot name="text"></slot></Button>
  </div>
  <FlyoutMenu {menuDirection} bind:isShowing leftPos={flyoutMenuPosLeft}>
    <slot name="menu"></slot>
  </FlyoutMenu>
  <slot></slot>
</div>

<style>
  /* The flyout button z-index must be higher than the backdrop and menu, those are 50 and 100 respectively */
  .flyout-button {
    z-index: 500;
    position: absolute;
    left: 0;
    top: 0;
    width: auto;
    white-space: nowrap;
  }
</style>
