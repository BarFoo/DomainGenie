<script lang="ts">
  import Icon from "./Icon.svelte";

  export let value: string = undefined;
  export let placeholder: string = undefined;
  export let showIcon: boolean = true;
</script>

<div class="text-gray-500" class:relative={showIcon}>
  <input class="border-2 border-gray-300 w-full bg-white py-1.5 px-2 pr-16 rounded-lg text-sm focus:outline-none focus:ring-gray-600 focus:border-gray-600"
    type="search" {placeholder} bind:value />
  {#if showIcon}
    <button class="absolute right-0 top-0 mt-2.5 mr-4">
      <Icon name="search" class="text-gray-300 h-4 w-4 fill-current" />
    </button>
  {/if}
</div>