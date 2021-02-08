<script lang="ts">
  import { link } from "svelte-spa-router";
  import active from "svelte-spa-router/active";
  import Icon from "./Icon.svelte";
  export let href: string;
  export let iconName: string;
</script>

<a {href}
  use:link
  use:active 
  class="side-menu-item border-transparent hover:bg-gray-50 hover:text-gray-900 text-gray-400 group border-l-4 px-5 py-2 flex 
          items-center text-sm font-medium">
  <Icon class="fill-current flex-shrink-0 -ml-1 mr-3 h-6 w-6" name={iconName} />
  <span class="truncate">
    <slot></slot>
  </span>
</a>

<style>
  :global(a.side-menu-item.active) {
    @apply bg-steel-100;
    @apply text-steel-600;
  }
</style>