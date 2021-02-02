<script>
  import { fade } from "svelte/transition";
  export let show = false;
</script>

{#if show}
  <div class="fixed z-50 inset-0 overflow-y-auto" transition:fade>
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div class="inline-block bg-white rounded-lg p-6 text-left overflow-hidden shadow-xl transform transition-all" role="dialog" aria-modal="true">
        <slot />
      </div>
    </div>
  </div>
{/if}