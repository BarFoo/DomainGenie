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

  /* Yes this is not a true table. tbody's do not work well with the virtual list 
     and besides you'd have to change the display of those to flex anyway to get
     scrolling on the tbody */
</script>

<div class="border border-gray-200 flex flex-col flex-grow divide-y divide-gray-200">
  <div class="bg-gray-50 flex-shrink-0">
    <div class="flex heading text-gray-500">
      {#if checkable}
        <div class="px-6 py-3 w-2">
          <Checkbox bind:checked={isCheckAll} on:change={handleCheckAll} size="small" />
        </div>
      {/if}
      {#each cols as col}
        <div style="flex-basis: {col.width ? col.width : 100 / cols.length}%"
          class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
          on:click|self={() => handleHeaderClick(col)}>{col.headerText}</div>
      {/each}
    </div>
  </div>
  <div class="flex-grow h-px">
    <VirtualList 
        {items}
        let:index
        let:item
    >
      <div 
        class="flex w-full border-b border-gray-200"
        class:cursor-pointer={isRowClickable}
        class:hover:bg-gray-50={isRowClickable && checkedIndexes.indexOf(index) === -1}
        class:bg-steel-50={checkedIndexes.indexOf(index) >= 0}
        class:border-none={index === items.length - 1}>
          {#if checkable}
            <div class="px-6 py-4 w-2 max-w-xs">
                <Checkbox forceChecked={checkedIndexes.indexOf(index) >= 0} on:change={(e) => handleRowChecked(index)} size="small" />
              </div>
          {/if}
          {#each cols as col}
            <div 
              class="px-6 py-4 whitespace-nowrap text-sm truncate" 
              on:click|self={(e) => handleRowClicked(index)}
              class:font-medium={col.hasEmphasis}
              class:font-light={col.hasLight}
              style="flex-basis: {col.width ? col.width : 100 / cols.length}%;">
              {#if col.formatter}
                {col.formatter(item[col.key])}
              {:else}
                {item[col.key]}
              {/if}
            </div>
          {/each}
      </div>
    </VirtualList>
  </div>
  {#if $$slots.footer}
    <div class="px-6 py-3 bg-gray-50 flex-shrink-0 mt-auto">
      <slot name="footer" />
    </div>
  {/if}
</div>


<style>
  .heading {
    /* This perhaps looks odd, but this allows the header to line up with the scrollbar body. */
    max-width: 98%;
  }
</style>