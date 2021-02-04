<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { ColumnDefinition } from "../interfaces/columnDefinition";
import Checkbox from "./Checkbox.svelte";

  const dispatch = createEventDispatcher();

  export let cols: ColumnDefinition[];
  export let items;
  export let isRowClickable = false;
  export let checkable = false;

  function handleRowClick(item) {
    dispatch("rowClick", item);
  }

  function handleHeaderClick(col: ColumnDefinition) {
    dispatch("headerClick", col.key);
  }

  function handleRowChecked(item) {
    dispatch("rowChecked", item);
  }

  function handleCheckAll() {
    dispatch("checkAll");
  }
</script>

<div class="flex flex-col">
  <div class="overflow-x-auto">
    <div class="align-middle inline-block min-w-full">
      <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              {#if checkable}
                <th scope="col" class="px-6 py-3 text-left" title="Checks all matching domains">
                  <Checkbox on:change={handleCheckAll} />
                </th>
              {/if}
              {#each cols as col}
                <th scope="col" 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  on:click={() => handleHeaderClick(col)}>
                  {col.displayText}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
              {#each items as item}
                <tr class="hover:bg-gray-50"
                 class:cursor-pointer={isRowClickable}
                 on:click={() => handleRowClick(item)}>
                  {#each cols as col}
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {#if col.formatter}
                        {col.formatter(item[col.key])}
                      {:else}
                        {item[col.key]}
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>