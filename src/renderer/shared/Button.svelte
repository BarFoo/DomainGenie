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
  export let size: string = "default";

  let buttonClasses;
  switch(type) {
    case "primary":
      buttonClasses = "bg-steel-500 hover:bg-steel-600 text-white";
      break;
    case "success":
      buttonClasses = "bg-limegreen-500 hover:bg-limegreen-600 text-white";
      break;
    case "info":
      buttonClasses = "bg-turquoise-500 hover:bg-turquoise-600 text-white";
      break;
    case "sunset":
    case "error":
      buttonClasses = "bg-sunset-500 hover:bg-sunset-600 text-white";
      break;
    case "transparent":
      buttonClasses = "bg-transparent text-gray-400";
      break;
    default:
      buttonClasses = "bg-white text-gray-400 font-light border border-gray-300";
      break;
  }

</script>

<button class="inline-flex text-sm items-center shadow-border tracking-wide disabled:opacity-50 focus:outline-none {buttonClasses}"
  class:font-bold={bold}
  class:uppercase={uppercase}
  class:py-2={size === "default"}
  class:py-2.5={size === "large"}
  class:px-4={size === "default"}
  class:px-5={size === "large"}
  class:rounded={rounded} on:click {disabled} {title}>
    {#if iconName}
      <Icon class="-ml-1 mr-2 h-5 w-5 fill-current" name={iconName} />
    {/if}
    <slot />
    {#if trailingIconName}
      <Icon class="ml-2 h-5 w-5 fill-current" name={trailingIconName} />
    {/if}
</button>