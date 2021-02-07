<script>

import Alert from "../shared/Alert.svelte";

</script>
<div class="h-screen w-screen bg-gray-100 flex items-center text-gray-500">
	<div class="container flex flex-col md:flex-row items-center justify-center px-5">
   		<div class="max-w-7xl">
      		<div class="text-5xl font-dark font-bold">Error</div>
            <p
              class="text-2xl md:text-3xl font-light leading-normal"
            >Your wish was not granted</p>
          <p class="mb-8">You should never see this page. Please let us know on <a href="https://github.com/barfoo/DomainGenie/" class="external text-steel-900">GitHub</a>.</p>
          <a href="#/domains" class="px-4 inline py-2 text-sm font-medium leading-5 shadow text-white transition-colors duration-150 border border-transparent rounded-lg focus:outline-none focus:shadow-outline-blue bg-steel-600 active:bg-blue-600 hover:bg-steel-700">back to domains</a>
    </div>
  </div>
</div>