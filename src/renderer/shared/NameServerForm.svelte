<script lang="ts">
  import { onMount, tick } from "svelte";
  import { _ } from "svelte-i18n";
  import { useForm, Validators } from "svelte-use-form";
  import Button from "./Button.svelte";
  import TextField from "./TextField.svelte";

  
  // The minimum amount of nameservers allowed.. this will always be 2!
  const minNameservers = 2;

  // I can't imagine anyone ever adding more than this.. I mean if users demand
  // it I will change it but this seems fine for 99% of cases
  const maxNameservers = 10;

  // Regex pattern to match name servers with for validation
  const nsPattern = /^([a-zA-Z0-9\-]+)\.([a-zA-Z0-9\-]+)\.([a-zA-Z0-9\.]+)$/;

  function validateNS(value: string) {
    return nsPattern.test(value) ? null : { invalidRegex: true };
  }

  // Form schema and validation.. it needs to be like this because dynamic
  // values can't be bound to this form library, but I really like its approach
  // and simplicity, so will rethink in future, for now this is ok.
  export let form = useForm({
    ns0: { validators: [Validators.required, validateNS]},
    ns1: { validators: [Validators.required, validateNS]}
  });

  // Two empty strings to form two empty inputs if no name servers are passed in
  export let nameServers: string[] = ["", ""];

  // References to the name server text fields
  let refs = [];

  async function addNameServer(e: Event) {
    e.preventDefault();
    if(nameServers.length === maxNameservers) {
      return;
    }
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

  // Filter out undefined/null name servers (NOT empty strings)
  nameServers = nameServers.filter(s => s);

  if(nameServers.length === 0) {
    nameServers = ["", ""];
  }

  onMount(async () => {
    // This timeout must be equal to or greater than the sliding panel duration (in case this is used in sliding panel)
    setTimeout(() => {
      refs[0].focus();
    }, 250);
  });
</script>

<form class={$$props.class} on:submit={(e) => e.preventDefault()} use:form>
  <div class="space-y-6">   
    {#each nameServers as nameServer, index}
      <div class="grid grid-cols-3 gap-4 items-start border-gray-200 pt-6 px-5" class:border-t={index > 0}>
        <label for="nameServer{index}" class="block text-sm mt-px pt-2">
          {$_("name_server_label", { values: { index: index + 1}})}
          {#if index > 1}
            <span class="block text-sm font-light cursor-pointer" on:click={() => removeNameServer(index)}>
               {$_("delete")}
            </span>
          {/if}
        </label>
        <div class="col-span-2">
          <div class="max-w-lg flex rounded-md shadow-sm">
            <TextField placeholder={`ns${index + 1}.example.com`} name={`ns${index}`} 
                bind:value={nameServer} bind:this={refs[index]} />
          </div>
        </div>
      </div>
    {/each}
    <div class="grid grid-cols-3 gap-4 items-start border-t border-gray-200 py-6 px-5">
      <div class="col-start-2 col-span-2">
        <div class="max-w-lg flex rounded-md shadow-sm">
          <Button type="default" iconName="plus" on:click={addNameServer} 
          disabled={nameServers.length >= maxNameservers}>{$_("add_name_server")}</Button>
        </div>
      </div>
    </div>
  </div>
  <slot></slot>
</form>