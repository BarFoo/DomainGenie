<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { registrarService } from "../stores";
  import { _ } from "svelte-i18n";
  import Alert from "./Alert.svelte";
  import Button from "./Button.svelte";
  import Icon from "./Icon.svelte";
  import Modal from "./Modal.svelte";

  const dispatch = createEventDispatcher();

  export let show: boolean;

  let hasFinishedImporting: boolean = false;
  let domainsAdded: number = 0;
  let domainsUpdated: number = 0;
  let rejectedClients: string[] = [];
  let hasSyncError: boolean = false;
  let hasRun: boolean = false;

  function syncDomains() {
    hasFinishedImporting = false;
    $registrarService.syncDomains().then((result) => {
      domainsAdded = result.domainsAdded;
      domainsUpdated = result.domainsUpdated;
      rejectedClients = result.rejectedClients;
      hasFinishedImporting = true;
      dispatch("domainsSynced", result);
    }).catch(() => {
      hasSyncError = true;
    }).finally(() => {
      hasRun = true;
    });
  }

  function handleCloseSyncModal() {
    show = false;
    hasFinishedImporting = false;
    domainsAdded = 0;
    domainsUpdated = 0;
    hasSyncError = false;
    hasRun = false;
  }

  $: {
    // Only ensure each instance of this runs only once
    if(show && !hasRun) {
      syncDomains();
    }
  }
</script>

<Modal {show}>
  <div class="w-80">
    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-3">
      {$_("domains_route.syncing")}
    </h3>
    {#if !hasFinishedImporting}
      <div>
        <p class="mb-2">{$_("domains_route.fetching")}</p>
        <p>{$_("domains_route.please_wait")}</p>
      </div>
      <div class="mt-3 mb-3 mx-auto w-3 h-3">
        <Icon class="text-steel-900 animate-spin" width="2em" height="2em" name="loader" />
      </div>
    {:else}
      {#if hasSyncError}
        <div class="mt-2">
          <Alert type="error">
            <span slot="heading">{$_("domains_route.sync_error_heading")}</span>
            <span slot="body">{$_("domains_route.sync_error_message")}</span>
          </Alert>
        </div>
        <div class="mt-2 text-center">
          <Button on:click={handleCloseSyncModal}>{$_("close")}</Button>
        </div>  
      {:else}
        <Alert type="success">
          <span slot="heading">{$_("success")}</span>
          <div slot="body">
            <p class="mb-2">{$_("domains_route.imported_message", { values: {total: domainsAdded + domainsUpdated}})}</p>
            <p class="mb-2">{$_("added")}: {domainsAdded}</p>
            <p>{$_("updated")}: {domainsUpdated}</p>
          </div>
        </Alert>
        {#if rejectedClients && rejectedClients.length > 0}
          <div class="mt-4">
            <Alert type="warning">
              <span slot="heading">{$_("domains_route.rejected_clients_heading")}</span>
              <div slot="body">
                <ul>
                  {#each rejectedClients as clientName}
                    <li>{clientName}</li>
                  {/each}
                </ul>
              </div>
            </Alert>
          </div>
        {/if}
        <div class="mt-2">
            <Button on:click={handleCloseSyncModal}>{$_("close")}</Button>
        </div>
      {/if}
    {/if}
  </div>
</Modal>