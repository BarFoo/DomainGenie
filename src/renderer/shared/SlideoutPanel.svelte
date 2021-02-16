<script lang="ts">
  import { fly } from "svelte/transition";

  export let show: boolean = false;
  export let heading: string;
</script>

{#if show}
  <div class="fixed inset-0 overflow-hidden">
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute inset-0 bg-gray-500 bg-opacity-20 transition-opacity z-40" aria-hidden="true"></div>
      <section class="absolute inset-y-0 right-0 pl-10 max-w-full flex z-50" aria-labelledby="slide-over-heading">
        <div class="w-screen max-w-2xl" transition:fly={{ x: 500 }}>
          <div class="h-full flex flex-col py-6 bg-white shadow-xl overflow-y-scroll">
            <div class="px-4 sm:px-6">
              <div class="flex items-start justify-between">
                <h2 id="slide-over-heading" class="text-lg font-medium text-gray-900">
                  {heading}
                </h2>
                <div class="ml-3 h-7 flex items-center">
                  <button on:click={() => show = false}
                  class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <span class="sr-only">Close</span>
                    <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="relative flex-1">
              <!-- Replace with your content -->
              <div class="absolute inset-0">
                <slot></slot>
              </div>
              <!-- /End replace -->
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
{/if}