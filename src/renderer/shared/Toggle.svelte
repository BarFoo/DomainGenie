<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { _ } from "svelte-i18n";

  export let enabled: boolean;

  const dispatch = createEventDispatcher();

  function handleClick() {
    enabled = !(enabled);
    dispatch("toggleChanged", enabled);
  }

  $: title = enabled ? $_("click_to_disable") : $_("click_to_enable");
</script>

<button type="button" class="relative inline-flex flex-shrink-0 h-6 
w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out 
duration-200 focus:outline-none focus:ring-0" 
on:click={handleClick}
class:bg-gray-200={!enabled}
class:bg-limegreen-600={enabled}
{title}
aria-pressed={enabled}>
  <span class="sr-only">Toggle</span>
  <!-- Enabled: "translate-x-5", Not Enabled: "translate-x-0" -->
  <span aria-hidden="true" class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform 
  ring-0 transition ease-in-out duration-200"
  class:translate-x-5={enabled}
  class:translate-x-0={!enabled}></span>
</button>