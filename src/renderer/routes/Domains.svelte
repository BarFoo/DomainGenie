<script lang="ts">

  /**
   * @todo Tidy this up, separate out table, fitlers and pagination into their own components
   */

  import { onMount, tick } from "svelte";
  import { _, date } from "svelte-i18n";
  import Button from "../shared/Button.svelte";
  import Icon from "../shared/Icon.svelte"; 
  import Modal from "../shared/Modal.svelte";
  import Alert from "../shared/Alert.svelte";
  import SearchField from "../shared/SearchField.svelte";
  import { fileStoreService, appDatabase, registrarService } from "../stores";
  import type  { GeneralSettings } from "../interfaces/generalSettings";
  import { push } from "svelte-spa-router";
  import type { Domain } from "../database/domain";
  import Table from "../shared/Table.svelte";
  import Radio from "../shared/Radio.svelte";
  import Dropdown from "../shared/Dropdown.svelte";
  import type { ColumnDefinition } from "../interfaces/columnDefinition";
  import Layout from "./_Layout.svelte";

  // Table column definitions
  const cols: ColumnDefinition[] = [
    {
      key: "domainName",
      headerText: $_("domain_name")
    },
    {
      key: "registrar",
      headerText: $_("registrar"),
      hasLight: true
    },
    {
      key: "registrationDate",
      headerText: $_("registered"),
      formatter: (val) => $date(val, {format: "medium"}),
      hasLight: true
    },
    {
      key: "expiryDate",
      headerText: $_("expires"),
      formatter: (val) => $date(val, { format: "medium"}),
      hasLight: true
    }
  ];

  // Filter states
  const defaultFilters = {
    query: "",
    expires: 0,
    orderBy: "domainName",
    isDescending: false
  };
  let filters = {...defaultFilters};

  // Used for automatic state tracking of filters
  let lastFilters = {...filters};

  // Domains states
  let isSyncingDomains: boolean = false;
  let hasFinishedImporting: boolean = false;
  let domainsAdded: number = 0;
  let domainsUpdated: number = 0;
  let rejectedClients: string[] = [];
  let domains: Domain[] = [];
  let isFirstLoad: boolean = true;
  let isLoadingDomains: boolean = false;
  let hasRegistrarSettings = false;
  let hasSyncError: boolean = false;

  // Whether the user needs to sync if no domains
  let requiresSync: boolean = false;

  // Whether to make the domains table checkable
  let checkable: boolean = false;
  let checkedIndexes: Number[] = [];

  $:{
    // State tracking for filters, to ensure we don't repeatedly call loadDomains over and over
    if(!isFirstLoad &&
      (filters.query !== lastFilters.query 
      || filters.orderBy !== lastFilters.orderBy 
      || filters.isDescending !== lastFilters.isDescending
      || filters.expires !== lastFilters.expires)) {
        lastFilters = {...filters};
        loadDomains();
        // Clear selections when reloading domains
        checkedIndexes = [];
    }
  }

  function handleSyncDomains() {
    isSyncingDomains = true;
    hasFinishedImporting = false;
    $registrarService.syncDomains().then((result) => {
      domainsAdded = result.domainsAdded;
      domainsUpdated = result.domainsUpdated;
      rejectedClients = result.rejectedClients;
      hasFinishedImporting = true;
      loadDomains();
    }).catch(() => {
      hasSyncError = true;
    });
  }

  async function loadDomains() {

    if(isLoadingDomains) {
      return;
    }

    // A mapper so we only select what we need rather than the whole object since
    // the domain objects are rather big this will trim down memory usage
    // for those with tens of thousands of domains.
    const mapFunction = async (coll: Dexie.Collection, mapperFn: Function): Promise<Domain[]> => {
      const result = [];
      await coll.each(row => result.push(mapperFn(row)));
      return result;
    }

    isLoadingDomains = true;

    let domainOpts = $appDatabase.domains.orderBy(filters.orderBy);

    if(filters.expires > 0) {
      const today =  new Date();
      const future = new Date();
      future.setDate(future.getDate() + filters.expires);
      domainOpts = domainOpts.and(d => d.expiryDate >= today && d.expiryDate <= future);
    }

    if(filters.isDescending) {
      domainOpts = domainOpts.reverse();
    }

    if(filters.query && filters.query.trim() !== "") {
      domainOpts = domainOpts.and(d => d.domainName.startsWith(filters.query));
    }
    
    domains = [...await mapFunction(domainOpts, (doc: Domain) => ({
      domainName: doc.domainName,
      registrationDate: doc.registrationDate,
      expiryDate: doc.expiryDate,
      registrar: doc.registrar
    }))];

    isLoadingDomains = false;
  }

  function handleCloseSyncModal() {
    isSyncingDomains = false;
    hasFinishedImporting = false;
    domainsAdded = 0;
    domainsUpdated = 0;
    hasSyncError = false;
  }

  function toggleCheckable() {
    checkable = !checkable;
    if(!checkable) {
      checkedIndexes = [];
    }
  }

  onMount(async () => {
    // Disable synchronize if no registrar settings are enabled
    const registrarSettings = await $fileStoreService.get("registrarSettings", null);

    if(registrarSettings === null) {
      hasRegistrarSettings = false;
      isFirstLoad = false;
      push("/registrars");
      return;
    }

    hasRegistrarSettings = true;

    // Check if we have any domains at all
    await loadDomains();

    // If no domains come back on initial load it means they require sync
    if(domains.length === 0) {
      requiresSync = true;
    }

    // Marks first load as finished, now will be picked up by auto filterer
    isFirstLoad = false;
  });
</script>

<Layout heading={$_("domains")}>
  <div slot="headerRight">
    <Button 
      type="primary"
      size="large"
      iconName="sync" 
      on:click={handleSyncDomains} 
      disabled={!hasRegistrarSettings}>{$_("synchronize")}</Button>
  </div>
  <div class="grid grid-cols-12 gap-8 overflow-hidden">
    {#if hasRegistrarSettings && !requiresSync}
      <div class="col-span-3 flex flex-col gap-4 sticky text-gray-400">
        <div>
          <h3 class="text-xs uppercase mb-2">{$_("filter_by_name")}</h3>
          <SearchField bind:value={filters.query} />
        </div>
        <div>
          <h3 class="text-xs uppercase mb-2">{$_("filter_by_dates")}</h3>
          <div class="mb-2">
            <Radio bind:options={filters.expires} value={30}>{$_("expires_within", { values: { days: "30"} })}</Radio>
          </div>
          <div class="mb-2">
            <Radio bind:options={filters.expires} value={60}>{$_("expires_within", { values: { days: "60"} })}</Radio>
          </div>
          <div class="mb-2">
            <Radio bind:options={filters.expires} value={90}>{$_("expires_within", { values: { days: "90"} })}</Radio>
          </div>
        </div>
        <div>
          <h3 class="text-xs uppercase mb-2">{$_("order_by")}</h3>
          <div class="mb-2">
            <Radio bind:options={filters.orderBy} value={"domainName"}>{$_("domain_name")}</Radio>
          </div>
          <div class="mb-2">
            <Radio bind:options={filters.orderBy} value={"expiryDate"}>{$_("expires")}</Radio>
          </div>
          <div class="mb-2">
            <Radio bind:options={filters.orderBy} value={"registrationDate"}>{$_("registered")}</Radio>
          </div>
          <div class="mb-2">
            <Dropdown bind:value={filters.isDescending}>
              <option value={false}>{$_("ascending")}</option>
              <option value={true}>{$_("descending")}</option>
            </Dropdown>
          </div>
        </div>
      </div>
      <div class="col-span-9 flex flex-col">
        {#if isFirstLoad}
          <p class="text-gray-400">{$_("loading")}</p>
        {:else if domains.length > 0}
          <Table {cols} 
          items={domains} 
          isRowClickable={true} 
          bind:checkable
          bind:checkedIndexes
          on:rowClick={(key) => push(`/domains/${key}`)}>
            <div class="flex" slot="footer">
              <div class="flex-grow flex space-x-6">
                <Button type="primary" bold={false} iconName="checkbox-multiple" on:click={toggleCheckable}>
                  {#if !checkable}
                    {$_("enable_selection")}
                  {:else}
                    {$_("disable_selection")}
                  {/if}
                </Button>
                {#if checkable && checkedIndexes.length > 0}
                  <Button type="success" bold={false} iconName="command">{$_("domains_route.checked_domains", { values: {checkedDomains: checkedIndexes.length}})}</Button>
                {/if}
              </div>
              <div class="text-gray-400 text-sm uppercase font-light leading-8">
                {$_("domains_route.total_domains_text", { values: {totalDomains: domains.length}})}
              </div>
            </div>
          </Table>
        {:else}
          <p class="text-gray-400">{$_("domains_route.no_domains_message")}</p>
        {/if}
      </div>
    {:else if requiresSync}
      <div class="col-span-12 text-gray-600">
        {$_("domains_route.requires_sync_message")}
      </div>
    {:else}
      <div class="col-span-12 text-gray-600">
        {$_("domains_route.no_registrars_message")}
      </div>
    {/if}
  </div>

  <Modal show={isSyncingDomains}>
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
</Layout>