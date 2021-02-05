<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { ColumnDefinition } from "../interfaces/columnDefinition";
  import Checkbox from "./Checkbox.svelte";
  import VirtualList from "./VirtualList.svelte";

  const dispatch = createEventDispatcher();

  export let cols: ColumnDefinition[];
  export let items: any[] = [];
  export let isRowClickable: boolean = false;
  export let checkable: boolean = false;

  // Whether check all is checked (the header check all, which selects all items)
  export let isCheckAll: boolean = false;

  // A reference for tbody, so we can scroll back to the top when needed
  let tbodyRef: HTMLElement;

  export let checkedIndexes: Number[] = [];

  function handleRowClicked(index: number) {
    // Only dispatch this event if no items are checked, otherwise handle checking this item instead.
    const item = items[index];
    if(!checkable) {
      dispatch("rowClick", item);
    } else {
      item.checked = !item.checked;
      const matchingIndex = checkedIndexes.indexOf(index);
      if(matchingIndex === -1) {
        checkedIndexes = [...checkedIndexes, index];
      } else {
        checkedIndexes.splice(matchingIndex, 1);
        checkedIndexes = [...checkedIndexes];
      }
    }
  }

  function handleHeaderClick(col: ColumnDefinition) {
    dispatch("headerClick", col.key);
  }

  function handleRowChecked(index: number) {
    const item = items[index];
    if(item.checked) {
      dispatch("rowChecked", item);
    } else {
      dispatch("rowUnchecked", item);
    }
  }

  function handleCheckAll() {
    if(isCheckAll) {
      checkedIndexes = items.map((v, index) => index);
      dispatch("checkAll");
    } else {
      checkedIndexes = [];
    }
  }
</script>

<div class="border border-gray-200 flex flex-col divide-y divide-gray-200 min-w-full">
  <div class="bg-gray-50">
    <div class="flex heading">
      {#if checkable}
        <th scope="col" class="px-6 py-3 w-2" title="Checks all matching domains">
          <Checkbox bind:checked={isCheckAll} on:change={handleCheckAll} size="small" />
        </th>
      {/if}
      {#each cols as col}
        <th scope="col" style="flex-basis: {100 / cols.length}%"
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          on:click|self={() => handleHeaderClick(col)}>{col.headerText}</th>
      {/each}
    </div>
  </div>
  <div class="bg-white w-full table-body divide-y divide-gray-200"
    bind:this={tbodyRef}>
      <VirtualList
        {items} let:item let:index>
          <div 
            class="flex w-full border-b border-gray-200"
            class:cursor-pointer={isRowClickable}
            class:hover:bg-gray-50={isRowClickable && checkedIndexes.indexOf(index) === -1}
            class:bg-steel-100={checkedIndexes.indexOf(index) >= 0}
            class:border-none={index === items.length - 1}>
              {#if checkable}
                <div class="px-6 py-4 w-2 max-w-xs">
                    <Checkbox forceChecked={checkedIndexes.indexOf(index) >= 0} on:change={(e) => handleRowChecked(index)} size="small" />
                  </div>
              {/if}
              {#each cols as col}
                <div 
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" 
                  on:click|self={(e) => handleRowClicked(index)}
                  class:font-medium={col.hasEmphasis}
                  class:font-light={col.hasLight}
                  style="flex-basis: {100 / cols.length}%;">
                  {#if col.formatter}
                    {col.formatter(item[col.key])}
                  {:else}
                    {items[index][col.key]}
                  {/if}
                </div>
              {/each}
              </div>
      </VirtualList>
  </div>
  {#if $$slots.footer}
    <div class="px-6 py-3 bg-gray-50">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  .heading {
    /* This must always equal the scrollbar width, which is 8px atm */
    padding-right: 7px;
  }
  .table-body {
    /* Accomodate for header, table footer etc */
    height: calc(100vh - 360px);
  }
</style>