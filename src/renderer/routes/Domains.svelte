<script lang="ts">

  /**
   * @todo Tidy this up, separate out table, fitlers and pagination into their own components
   */

  import { onMount } from "svelte";
  import { _, date } from "svelte-i18n";
  import Button from "../shared/Button.svelte";
  import { fileStoreService, appDatabase, isSyncingDomains, registrarService, hasSyncCompleted } from "../stores";
  import { push } from "svelte-spa-router";
  import type { Domain } from "../database/domain";
  import Table from "../shared/Table.svelte";
  import type { ColumnDefinition } from "../interfaces/columnDefinition";
  import Layout from "./_Layout.svelte";
  import { MenuDirection } from "../constants/menuDirection";
  import FlyoutButton from "../shared/FlyoutButton.svelte";
  import DomainFilters from "./_DomainFilters.svelte";
  import FlyoutMenuItem from "../shared/FlyoutMenuItem.svelte";
  import type { DomainFilters as DomainFitersInterface } from "../interfaces/domainFilters";
import Alert from "../shared/Alert.svelte";

  // Table column definitions
  const cols: ColumnDefinition[] = [
    {
      key: "domainName",
      headerText: $_("domain_name"),
      width: 35,
    },
    {
      key: "registrationDate",
      headerText: $_("registered"),
      formatter: (val) => val ? $date(val, {format: "medium"}) : null,
      hasLight: true,
      width: 20,
    },
    {
      key: "expiryDate",
      headerText: $_("expires"),
      formatter: (val) => val ? $date(val, { format: "medium"}) : null,
      hasLight: true,
      width: 20
    },
    {
      key: "nameServers",
      headerText: $_("name_servers"),
      hasLight: true,
      width: 35,
      formatter: (ns: string[]) => ns ? ns.filter(s => s).join("<br />") : null
    },
  ];

  // Filter states
  const defaultFilters: DomainFitersInterface = {
    name: "",
    nameServer: "",
    onlyShowEmptyNameServers: false,
    expires: 0,
    orderBy: "domainName",
    isDescending: false
  };
  let filters = {...defaultFilters};

  // Used for automatic state tracking of filters
  let lastFilters = {...filters};

  // Domains states
  let domains: Domain[] = [];
  let isFirstLoad: boolean = true;
  let isLoadingDomains: boolean = false;

  // Whether sync is required, if so we will auto sync the first time
  let requiresSync: boolean = false;

  // Whether to make the domains table checkable
  let checkable: boolean = false;
  let checkedIndexes: Number[] = [];

  $:{
    // State tracking for filters, to ensure we don't repeatedly call loadDomains over and over
    if(!isFirstLoad &&
      (filters.name !== lastFilters.name
      || filters.nameServer !== lastFilters.nameServer
      || filters.onlyShowEmptyNameServers !== lastFilters.onlyShowEmptyNameServers
      || filters.orderBy !== lastFilters.orderBy 
      || filters.isDescending !== lastFilters.isDescending
      || filters.expires !== lastFilters.expires)) {
        lastFilters = {...filters};
        loadDomains();
        // Clear selections when reloading domains
        checkedIndexes = [];
    }
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

    if(filters.name && filters.name.trim() !== "") {
      domainOpts = domainOpts.and(d => d.domainName.indexOf(filters.name) >= 0);
    }

    // @todo: Is this precedence correct? Should this not be OR operation?
    if(filters.onlyShowEmptyNameServers) {
      domainOpts = domainOpts.and(d => 
        d.nameServers == null 
        || d.nameServers.length === 0
        || d.nameServers.filter(ns => ns == null).length === d.nameServers.length
      );
    } else if(filters.nameServer && filters.nameServer.trim() !== "") {
      const ns = filters.nameServer.toLowerCase();
      domainOpts = domainOpts.and(d => 
        d.nameServers.filter(
          ns => ns && ns.indexOf(filters.nameServer) >= 0
        ).length > 0
      );
    }
    
    domains = [...await mapFunction(domainOpts, (doc: Domain) => {
      const parsedDocs = {};
      cols.forEach((col) => {
        parsedDocs[col.key] = doc[col.key];
      });
      return parsedDocs;
    })];

    isLoadingDomains = false;
  }

  function handleSync() {
    if($isSyncingDomains) {
      return;
    }
    $isSyncingDomains = true;
    // @todo Sort out this awful name, but what is a better alternative? 
    // startSyncAllDomains()? triggerSyncAllDomains()?
    $registrarService.getAllDomains();
  }

  function toggleCheckable() {
    checkable = !checkable;
    if(!checkable) {
      checkedIndexes = [];
    }
  }

  function handleBulkNameServerClick(e: MouseEvent) {
    e.preventDefault();
  }

  function handleBulkContactsClick(e: MouseEvent) {
    e.preventDefault();
  }

  function handleExportClick(e: MouseEvent) {
    e.preventDefault();
  }

  onMount(async () => {
    // Disable synchronize if no registrar settings are enabled
    const registrarSettings = await $fileStoreService.get("registrarSettings", null);

    if(registrarSettings === null) {
      push("/registrars");
      return;
    }

    // Check if we have any domains at all
    await loadDomains();

    // If no domains come back on initial load it means they require sync
    // so let's begin auto syncing
    if(domains.length === 0) {
      requiresSync = true;
      handleSync();
    } else {
      requiresSync = false;
    }

    // Marks first load as finished
    isFirstLoad = false;
  });

  hasSyncCompleted.subscribe((val) => {
    if(val) {
      loadDomains();
      requiresSync = false;
      $hasSyncCompleted = false;
    }
  });

</script>

<Layout heading={$_("domains")}>
  <div slot="headerRight">
    <Button 
      type="primary"
      size="large"
      iconName="sync" 
      on:click={handleSync} 
      disabled={$isSyncingDomains}>
      {#if $isSyncingDomains}
        {$_("syncing")}...
      {:else}
        {$_("synchronize")}
      {/if}
  </Button>
  </div>
  <div class="flex flex-row flex-grow gap-8 px-5 py-6">
    {#if isFirstLoad && !requiresSync}
      <p>{$_("loading")}</p>
    {:else if !requiresSync}
      <div class="domain-filters flex flex-col gap-4 text-gray-400">
        <DomainFilters bind:filters={filters} />
      </div>
      <div class="flex flex-col flex-grow min-w-0 flex-shrink">
        {#if domains.length > 0}
          <Table {cols} 
          items={domains} 
          isRowClickable={true} 
          bind:checkable
          bind:checkedIndexes
          on:rowClick={(e) => push(`/domains/${e.detail.domainName}`)}>
            <div class="flex" slot="footer">
              <div class="flex-grow flex gap-6">
                <Button type="primary" bold={false} iconName="checkbox-multiple" on:click={toggleCheckable}>
                  {#if !checkable}
                    {$_("enable_selection")}
                  {:else}
                    {$_("disable_selection")}
                  {/if}
                </Button>
                {#if checkable && checkedIndexes.length > 0}
                  <FlyoutButton type="success" iconName="command" bold={false} menuDirection={MenuDirection.UP}>
                    <span slot="text">{$_("domains_route.checked_domains", { values: {checkedDomains: checkedIndexes.length}})}</span>
                    <div slot="menu">
                      <FlyoutMenuItem on:click={handleBulkNameServerClick} iconName="server" href="/">
                        <span slot="title">{$_("edit_name_servers_title")}</span>
                        <span slot="description">{$_("edit_name_servers_description")}</span>
                      </FlyoutMenuItem>
                      <FlyoutMenuItem on:click={handleBulkContactsClick} iconName="contacts" href="/">
                        <span slot="title">{$_("edit_contacts_title")}</span>
                        <span slot="description">{$_("edit_contacts_description")}</span>
                      </FlyoutMenuItem>
                      <FlyoutMenuItem on:click={handleExportClick} iconName="grid" href="/">
                        <span slot="title">{$_("export_to_csv_title")}</span>
                        <span slot="description">{$_("export_to_csv_description")}</span>
                      </FlyoutMenuItem>
                    </div></FlyoutButton>
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
    {:else if requiresSync && $isSyncingDomains}
      <div class="flex flex-col items-center flex-grow">
        <img src="/genie.png" class="block mb-4 text-center" alt="Genie" />
        <p class="mb-2">
          {$_("syncing_domains_message")}
        </p>
        <p class="mb-2 font-medium">
          {$_("syncing_domains_message_two")}
        </p>
      </div>
    {:else if !isFirstLoad}
      <p>
        {$_("domains_route.no_registrars_message")}
      </p>
    {:else}
      <p>
        {$_("loading")}
      </p>
    {/if}
  </div>
</Layout>

<style>
  .domain-filters {
    min-width: 25%;
    max-width: 25%;
  }
</style>