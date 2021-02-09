<script lang="ts">
  import Icon from "./Icon.svelte"; 

  export let href: string;
  export let iconName: string;
</script>

<a {href} class="flyout-menu-item -m-3 p-3 flex rounded-lg items-center hover:bg-gray-50" on:click>
  <Icon 
      class="flex-shrink-0 text-steel-600 fill-current" 
      width="1.5rem"
      height="1.5rem"
      name={iconName} /> 
  <div class="ml-4">
    <p class="text-base font-medium text-gray-900">
      <slot name="title" />
    </p>
    <p class="mt-1 text-sm text-gray-500">
      <slot name="description" />
    </p>
  </div>
</a>

<style>
  .flyout-menu-item:not(:last-child) {
    margin-bottom: 0.75rem;
  }
</style>