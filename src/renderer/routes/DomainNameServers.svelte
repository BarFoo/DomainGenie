<script lang="ts">
  /** 
   * This is the single domain name server edit. Bulk edit is a shared modal found in shared,
   * but they do both share the same form component (NameServerForm). This is essentially
   * a wrapper.
   */
  import { _ } from "svelte-i18n";
  import Button from "../shared/Button.svelte";
  import NameServerForm from "../shared/NameServerForm.svelte";
  import { registrarService, appDatabase, singleDomainEdit, isUpdatingDomains } from "../stores";
  import type { Domain } from "../database/domain";
  import { UpdateOperations } from "../constants/updateOperations";
  
  let domain: Domain = $singleDomainEdit;

  async function saveChanges() {
    await $appDatabase.domains.put(domain);
    $registrarService.updateDomains([{
      domainName: domain.domainName,
      registrar: domain.registrar,
      nameServers: domain.nameServers
    }], UpdateOperations.NAMESERVERS);
  }
</script>

{#if domain}
  <div class="border-b flex border-gray-200 pb-6">
    <div class="flex-grow">
      <h3 class="text-lg leading-6 font-medium">{$_("name_servers")}</h3>
      <p class="mt-1 text-sm">{$_("name_server_description")}</p>
    </div>
    <div class="flex-shrink-0">
      <Button 
        type="primary" 
        iconName="save" 
        disabled={$isUpdatingDomains} 
        on:click={saveChanges}>
        {#if !$isUpdatingDomains}
          {$_("save_changes")}
        {:else}
          {$_("saving")}...
        {/if}
      </Button>
    </div>
  </div>
  <NameServerForm bind:nameServers={domain.nameServers} class="divide-y divide-gray-200" />
{/if}