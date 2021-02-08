<script lang="ts">
  /** 
   * This is the single domain name server edit. Bulk edit is a shared modal found in shared,
   * but they do both share the same form component (NameServerForm). This is essentially
   * a wrapper.
   */
  import { _ } from "svelte-i18n";
  import Button from "../shared/Button.svelte";
  import NameServerForm from "../shared/NameServerForm.svelte";
  import { singleDomainEdit } from "../stores";
  import type { Domain } from "../database/domain";
  
  let domain: Domain = $singleDomainEdit;
  let isSaving: boolean = false;

  function saveChanges() {}
</script>

{#if domain}
  <div class="border-b flex border-gray-200 pb-6">
    <div class="flex-grow">
      <h3 class="text-lg leading-6 font-medium">{$_("name_servers")}</h3>
      <p class="mt-1 text-sm">{$_("name_server_description")}</p>
    </div>
    <div class="flex-shrink-0">
      <Button type="primary" iconName="save" disabled={isSaving} on:click={saveChanges}>
        {#if !isSaving}
          {$_("save_changes")}
        {:else}
          {$_("saving")}...
        {/if}
      </Button>
    </div>
  </div>
  <NameServerForm nameServers={domain.nameServers} class="divide-y divide-gray-200" />
{/if}