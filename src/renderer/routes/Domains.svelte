<script lang="ts">

  /**
   * @todo Tidy this up, separate out table, fitlers and pagination into their own components
   */

  import { onMount } from "svelte";
  import { _, date } from "svelte-i18n";
  import Button from "../shared/Button.svelte";
  import { fileStoreService, appDatabase, registrarService } from "../stores";
  import { push } from "svelte-spa-router";
  import type { Domain } from "../database/domain";
  import Table from "../shared/Table.svelte";
  import type { ColumnDefinition } from "../interfaces/columnDefinition";
  import Layout from "./_Layout.svelte";
  import { MenuDirection } from "../constants/menuDirection";
  import FlyoutButton from "../shared/FlyoutButton.svelte";
  import DomainFilters from "./_DomainFilters.svelte";
  import FlyoutMenuItem from "../shared/FlyoutMenuItem.svelte";
  import SyncDomains from "../shared/SyncDomains.svelte";
  import type { DomainFilters as DomainFitersInterface } from "../interfaces/domainFilters";
  import { NameFilterType } from "../constants/nameFilterType";

  // Table column definitions
  const cols: ColumnDefinition[] = [
    {
      key: "domainName",
      headerText: $_("domain_name"),
      width: 40
    },
    {
      key: "registrar",
      headerText: $_("registrar"),
      hasLight: true,
      width: 20,
    },
    {
      key: "registrationDate",
      headerText: $_("registered"),
      formatter: (val) => $date(val, {format: "medium"}),
      hasLight: true,
      width: 20,
    },
    {
      key: "expiryDate",
      headerText: $_("expires"),
      formatter: (val) => $date(val, { format: "medium"}),
      hasLight: true,
      width: 20
    }
  ];

  // Filter states
  const defaultFilters: DomainFitersInterface = {
    name: "",
    nameType: NameFilterType.STARTS_WITH,
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
  let hasRegistrarSettings = false;

  // Whether the user needs to sync if no domains
  let requiresSync: boolean = false;

  // Whether to make the domains table checkable
  let checkable: boolean = false;
  let checkedIndexes: Number[] = [];

  // Whether to show the sync modal
  let showSyncModal: boolean = false;

  $:{
    // State tracking for filters, to ensure we don't repeatedly call loadDomains over and over
    if(!isFirstLoad &&
      (filters.name !== lastFilters.name
      || filters.nameType !== lastFilters.nameType
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
    
    domains = [...await mapFunction(domainOpts, (doc: Domain) => ({
      domainName: doc.domainName,
      registrationDate: doc.registrationDate,
      expiryDate: doc.expiryDate,
      registrar: doc.registrar
    }))];

    isLoadingDomains = false;
  }

  function onDomainsSynced() {
    requiresSync = false;
    loadDomains();
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
      on:click={() => showSyncModal = true} 
      disabled={!hasRegistrarSettings}>{$_("synchronize")}</Button>
  </div>
  <div class="flex flex-row flex-grow gap-8 px-5 py-6">
    {#if isFirstLoad}
      <p>{$_("loading")}</p>
    {:else if hasRegistrarSettings && !requiresSync}
      <div class="flex flex-col flex-shrink gap-4 text-gray-400">
        <DomainFilters bind:filters={filters} />
      </div>
      <div class="flex flex-col flex-grow">
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
    {:else if requiresSync}
      <div class="text-gray-400">
        <p class="mb-2">
          {$_("domains_route.requires_sync_message_one")}
        </p>
        <p class="mb-2">
          {$_("domains_route.requires_sync_message_two")}
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

  <SyncDomains bind:show={showSyncModal} on:domainsSynced={onDomainsSynced} />
</Layout>