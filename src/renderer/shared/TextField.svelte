<script lang="ts">
  export let name: string = undefined;
  export let label: string = undefined;
  export let value: string = undefined;
  export let placeholder: string = "";

  // A reference to the text field
  let ref: HTMLInputElement;

  export function focus() {
    ref.focus();
  }
</script>

{#if label}
  <label for="{name}" class="block text-sm font-medium">{label}</label>
{/if}
<input type="text" {name} {placeholder} on:click on:input on:change on:focus bind:value bind:this={ref}
  class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none 
   focus:ring-gray-600 focus:border-gray-600"
   class:mt-1={label !== null}
   />