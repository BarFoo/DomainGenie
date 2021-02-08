<script lang="ts">
  import { tick } from "svelte";
  import { _ } from "svelte-i18n";
  import Button from "./Button.svelte";
  import TextField from "./TextField.svelte";

  // The minimum amount of nameservers allowed.. this will always be 2!
  const minNameservers = 2;

  // Two empty strings to form two empty inputs if no name servers are passed in
  export let nameServers: string[] = ["", ""];

  // References to the name server text fields
  let refs = [];

  async function addNameServer() {
    nameServers = [...nameServers, ""];
    // Must wait for tick before we can give focus!
    await tick();

    refs[nameServers.length - 1].focus();
  }

  function removeNameServer(index) {
    if(nameServers.length > minNameservers) {
      nameServers.splice(index, 1);
      nameServers = [...nameServers];
    }
  }
</script>

<form class={$$props.class}>
  <div class="space-y-6">   
    {#each nameServers as nameServer, index}
      <div class="grid grid-cols-3 gap-4 items-start border-gray-200 pt-6" class:border-t={index > 0}>
        <label for="nameServer{index}" class="block text-sm font-medium mt-px pt-2">
          {$_("name_server_label", { values: { index: index + 1}})}
          {#if index > 1}
            <span class="block text-sm font-light cursor-pointer" on:click={() => removeNameServer(index)}>Delete</span>
          {/if}
        </label>
        <div class="col-span-2">
          <div class="max-w-lg flex rounded-md shadow-sm">
            <TextField placeholder={`ns${index + 1}.example.com`} bind:value={nameServer} bind:this={refs[index]} />
          </div>
        </div>
      </div>
    {/each}
    <div class="grid grid-cols-3 gap-4 items-start border-t border-gray-200 pt-5">
      <div></div>
      <div class="col-span-2">
        <div class="max-w-lg flex rounded-md shadow-sm">
          <Button type="success" iconName="plus" on:click={addNameServer}>{$_("add_name_server")}</Button>
        </div>
      </div>
    </div>
  </div>
  <slot></slot>
</form>