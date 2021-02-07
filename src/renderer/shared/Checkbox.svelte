<script>
  export let checked = undefined;
  export let size = "default";
  export let forceChecked = false;
</script>

<label for="checkbox" class="flex justify-start relative items-start">
  <div class="bg-white border-2 border-gray-300 flex flex-shrink-0 justify-center items-center"
    class:mr-2={$$slots.default}
    class:w-5={size === "default"}
    class:h-5={size === "default"}
    class:w-4={size === "small"}
    class:h-4={size === "small"}>
    <input type=checkbox name="checkbox" class="opacity-0 absolute" bind:checked on:change>
    <svg class="fill-current text-steel-500 pointer-events-none" 
      class:w-4={size === "default"}
      class:h-4={size === "default"}
      class:w-3={size === "small"}
      class:h-3={size === "small"}
      class:hidden={!forceChecked}
      class:block={forceChecked}
      viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
  </div>
  <div class="select-none text-sm"><slot></slot></div>
</label>

<style>
  input:checked + svg {
  	display: block;
  }
</style>