<script lang="ts">
  import type { DropdownItem } from "../interfaces/dropdownItem";

  export let items: DropdownItem<any>[] = null;
  export let value;
</script>

<select class="mt-1 block w-full pl-3 pr-10 py-2 text-base border
 border-gray-300 focus:outline-none sm:text-sm rounded-md"
   bind:value>
  {#if items}
    {#each items as item}
      <option value={item.value}>{item.text}</option>
    {/each}
  {:else}
    <slot></slot>
  {/if}
</select>