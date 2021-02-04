<script lang="ts">
  import type { DropdownItem } from "../interfaces/dropdownItem";
  import Dropdown from "./Dropdown.svelte";

  export let pageSizes: number[] = [10, 25, 50, 100, 250, 500, 1000];
  export let value: number;

  let items: DropdownItem<number>[] = pageSizes.map((size) => {
    return {
      text: `${size} rows per page`,
      value: size
    }
  });
</script>

<Dropdown bind:value {items}>
</Dropdown>