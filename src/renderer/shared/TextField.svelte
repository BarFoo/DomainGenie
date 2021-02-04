<script lang="ts">
  export let name: string;
  export let label: string = undefined;
  export let value: string = undefined;
</script>

{#if label}
  <label for="{name}" class="block text-sm font-medium text-gray-700">{label}</label>
{/if}
<input type="text" {name} on:click on:input on:change on:focus bind:value on:input
  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-600 focus:border-gray-600">