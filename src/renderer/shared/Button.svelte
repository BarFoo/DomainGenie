<script lang="ts">
  import Icon from "../shared/Icon.svelte";

  export let type: string = undefined;
  export let rounded: boolean = true;
  export let disabled: boolean = false;
  export let title: string = undefined;
  export let iconName: string = undefined;
  export let trailingIconName: string = undefined;
  export let uppercase: boolean = true;
  export let bold: boolean = true;

  let buttonClasses;
  switch(type) {
    case "primary":
      buttonClasses = "bg-steel-500 hover:bg-steel-600 text-white";
      break;
    case "success":
      buttonClasses = "bg-limegreen-500 hover:bg-limegreen-600 text-white";
      break;
    case "transparent":
      buttonClasses = "bg-transparent text-gray-400";
      break;
    default:
      buttonClasses = "bg-white text-gray-500 border border-gray-300";
      break;
  }
</script>

<button class="inline-flex items-center text-sm shadow-border {buttonClasses} py-2 px-4 tracking-wide disabled:opacity-50 focus:outline-none"
class:font-bold={bold}
 class:uppercase={uppercase} 
 class:rounded={rounded} on:click {disabled} {title}>
  {#if iconName}
    <Icon class="-ml-1 mr-2 h-5 w-5 fill-current" name={iconName} />
  {/if}
  <slot />
  {#if trailingIconName}
    <Icon class="ml-1 h-5 w-5 fill-current" name={trailingIconName} />
  {/if}
</button>