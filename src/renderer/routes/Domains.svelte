<script lang="ts">

  /**
   * @todo Tidy this up, separate out table, fitlers and pagination into their own components
   */

  import { onMount } from "svelte";
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
  import PageSizeDropdown from "../shared/PageSizeDropdown.svelte";
  import Table from "../shared/Table.svelte";
  import Checkbox from "../shared/Checkbox.svelte";
  import Radio from "../shared/Radio.svelte";
  import Dropdown from "../shared/Dropdown.svelte";

  // Table column definition
  const cols = [
    {
      key: "domainName",
      displayText: $_("domain_name")
    },
    {
      key: "registrar",
      displayText: $_("registrar")
    },
    {
      key: "registrationDate",
      displayText: $_("registered"),
      formatter: (val) => $date(val, {format: "medium"})
    },
    {
      key: "expiryDate",
      displayText: $_("expires"),
      formatter: (val) => $date(val, { format: "medium"})
    }
  ];

  // Filter states
  const defaultFilters = {
    query: "",
    pageSize: 10,
    expires: 0,
    orderBy: "domainName",
    isDescending: false
  };
  let filters = {...defaultFilters};

  // Domains states
  let isSyncingDomains: boolean = false;
  let hasFinishedImporting: boolean = false;
  let domainsAdded: number = 0;
  let domainsUpdated: number = 0;
  let rejectedClients: string[] = [];
  let domains: Domain[] = [];
  let totalDomains: number = 0;
  let isFirstLoad: boolean = true;
  let isLoadingDomains: boolean = false;
  let hasRegistrarSettings = false;
  let hasSyncError: boolean = false;

  // Pagination
  let currentPage: number = -1;
  let totalPages: number;
  let currentStartIndex: number;
  let currentEndIndex: number;
  let requiresSync: boolean = false;

  $:{
    // Letting Svelte work its magic :)
    if(!isFirstLoad && filters) {
      loadDomains(0);
    }
  }
  
  function handleClose() {
    isSyncingDomains = false;
    hasFinishedImporting = false;
    domainsAdded = 0;
    domainsUpdated = 0;
    hasSyncError = false;
  }

  function handleSyncDomains() {
    isSyncingDomains = true;
    hasFinishedImporting = false;
    $registrarService.syncDomains().then((result) => {
      domainsAdded = result.domainsAdded;
      domainsUpdated = result.domainsUpdated;
      rejectedClients = result.rejectedClients;
      totalDomains = domainsAdded + domainsUpdated;
      hasFinishedImporting = true;
      loadDomains(0);
    }).catch(() => {
      hasSyncError = true;
    });
  }

  async function loadDomains(page) {

    if(isLoadingDomains) {
      return;
    }

    currentPage = page;
    const hasQuery = filters.query && filters.query !== "";
    isLoadingDomains = true;

    let countOpts: any = $appDatabase.domains;
    const today = new Date();
    const future = new Date();
    future.setDate(future.getDate() + filters.expires);

    if(hasQuery) {
      countOpts = countOpts.filter(d => d.domainName.startsWith(filters.query));
    }

    if(filters.expires > 0) {
      countOpts = countOpts.where("expiryDate").between(today, future);
    }

    totalDomains = await countOpts.count();

    totalPages = totalDomains > 0 && page > 0 ? (Math.round(totalDomains / filters.pageSize) - 1): 1;
    currentStartIndex = (page > -1 ? (currentPage * filters.pageSize): 0) + 1;
    currentEndIndex = page === totalPages ? totalDomains : 
       (currentStartIndex - 1 + (totalDomains < filters.pageSize ? totalDomains : filters.pageSize));
 
    if(filters.expires > 0) {
      let domainOpts = $appDatabase.domains
        .where("expiryDate")
        .between(today, future);
      
      if(filters.isDescending) {
        domainOpts = domainOpts.reverse();
      }

      if(filters.query) {
        domainOpts = domainOpts.and(d => d.domainName.startsWith(filters.query.toLowerCase()));
      }

      domains = [...await domainOpts.offset(page * filters.pageSize).limit(filters.pageSize).sortBy(filters.orderBy)];
    } else {
      let domainOpts = $appDatabase.domains.orderBy(filters.orderBy);

      if(filters.isDescending) {
        domainOpts = domainOpts.reverse();
      }

      if(hasQuery) {
        domainOpts = domainOpts.and(d => d.domainName.startsWith(filters.query));
      }

      domains = [...await domainOpts.offset(page * filters.pageSize).limit(filters.pageSize).toArray()];
    }

    isLoadingDomains = false;
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
    const settings = await $fileStoreService.get<GeneralSettings>("settings");

    if(settings) {
      defaultFilters.pageSize = settings.domainsPageSize;
      filters.pageSize = settings.domainsPageSize;
    }

    await loadDomains(0);

    // If no domains come back on initial load it means they require sync
    if(domains.length === 0) {
      requiresSync = true;
    }

    isFirstLoad = false;
  });
</script>

<div class="flex max-w-7xl px-4 mx-auto">
  <h1 class="text-2xl font-semibold text-gray-900 flex-grow">{$_("domains")}</h1>
  <Button type="primary" iconName="sync" on:click={handleSyncDomains} disabled={!hasRegistrarSettings}>{$_("synchronize")}</Button>
</div>

<div class="pt-6 max-w-7xl px-4 mx-auto grid grid-cols-12 gap-8">
  {#if hasRegistrarSettings && !requiresSync}
    <div class="col-span-3 flex flex-col gap-4 sticky">
      <div>
        <h3 class="text-gray-400 text-xs uppercase mb-2">{$_("filter_by_name")}</h3>
        <SearchField bind:value={filters.query} />
      </div>
      <div class="text-gray-400">
        <h3 class="text-gray-400 text-xs uppercase mb-2">{$_("filter_by_dates")}</h3>
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
      <div class="text-gray-400">
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
      <div class="text-gray-400">
        <h3 class="text-gray-400 text-xs uppercase mb-2">{$_("rows_per_page")}</h3>
        <PageSizeDropdown bind:value={filters.pageSize} />
      </div>
    </div>
    <div class="col-span-9">
      {#if isFirstLoad}
        <p>{$_("loading")}</p>
      {:else if totalDomains > 0}
        <Table {cols} items={domains} isRowClickable={true} on:rowClick={(key) => push(`/domains/${key}`)} />
        <div class="mt-4 flex">
          <div class="text-gray-400 text-sm leading-10">
            {$_("domains_route.pagination_text", { values: { currentStartIndex, currentEndIndex, totalDomains}})}
          </div>
          <div class="flex-1 flex justify-end">
            {#if currentPage > 0}
              <div class="mr-2">
                <Button iconName="arrowLeft" uppercase={false} disabled={isLoadingDomains}
                on:click={() => loadDomains(currentPage - 1)}>{$_("previous_page")}</Button>
              </div>
            {/if}
            {#if currentPage < totalPages}
              <Button trailingIconName="arrowRight" uppercase={false} disabled={isLoadingDomains} 
              on:click={() => loadDomains(currentPage + 1)}>{$_("next_page")}</Button>
            {/if}
          </div>
        </div>
      {:else}
        <p>{$_("domains_route.no_domains_message")}</p>
      {/if}
    </div>
  {:else if requiresSync}
    <p>
      {$_("domains_route.requires_sync_message")}
    </p>
  {:else}
    <p>
      {$_("domains_route.no_registrars_message")}
    </p>
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
          <Button on:click={handleClose}>{$_("close")}</Button>
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
            <Button on:click={handleClose}>{$_("close")}</Button>
        </div>
      {/if}
    {/if}
  </div>
</Modal>