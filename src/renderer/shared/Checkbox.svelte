<script>
  export let value;
</script>

<label for="checkbox" class="flex justify-start items-start">
  <div class="bg-white border-2 rounded border-gray-300 w-5 h-5 flex flex-shrink-0 justify-center items-center mr-2 focus-within:border-steel-500">
    <input type="checkbox" name="checkbox" class="opacity-0 absolute" bind:value on:change>
    <svg class="fill-current hidden w-4 h-4 text-steel-500 pointer-events-none" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
  </div>
  <div class="select-none text-sm"><slot></slot></div>
</label>

<style>
  input:checked + svg {
  	display: block;
  }
</style>