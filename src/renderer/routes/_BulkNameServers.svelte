<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { _ } from "svelte-i18n";
  import Button from "../shared/Button.svelte";
  import NameServerForm from "../shared/NameServerForm.svelte";
  import { registrarService, appDatabase, bulkDomainEdit, isUpdatingDomains } from "../stores";

  const dispatch = createEventDispatcher();

  async function saveChanges() {

    // Make sure we get the latest domain info (in case of auto sync etc)
    $bulkDomainEdit = await $appDatabase.domains.bulkGet($bulkDomainEdit.map(d => d.domainName));

    $bulkDomainEdit.forEach((domain) => {
      domain.nameServers = nameServers;
    });

    // Build a new array of domains to send to the main process, we only need domain name
    // and registrar here. This helps reduce memory usage.
    const domains = $bulkDomainEdit.map(d => {
      return {
        domainName: d.domainName,
        registrar: d.registrar
      }
    });

    $registrarService.updateDomains(domains, {nameServers});
    await $appDatabase.domains.bulkPut($bulkDomainEdit);

    dispatch("saveChanges");
  }

  let form;
  let nameServers: string[];

</script>

<NameServerForm bind:nameServers={nameServers} bind:form
  class="divide-y divide-gray-200" />

<div class="py-6 px-5 border-t border-gray-200">
  <Button 
    type="primary" 
    iconName="save" 
    disabled={$isUpdatingDomains || $form == null || !$form.valid} 
    on:click={saveChanges}>
    {#if !$isUpdatingDomains}
      {$_("save_changes")}
    {:else}
      {$_("working")}...
    {/if}
  </Button>
</div>