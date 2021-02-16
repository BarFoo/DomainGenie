<script lang="ts">
  // A nicely scrollable list of just given domain names, I may update this
  // to include support for removing from the list in the future.
  export let domainNames: string[] = [];
</script>

<div class="list-container border border-gray-300 bg-steel-50 rounded pt-2 px-3 overflow-y-scroll">
  {#each domainNames as domainName}
    <p class="mb-1">{domainName}</p>
  {/each}
</div>

<style>
  .list-container {
    max-height: 400px;
  }
</style>