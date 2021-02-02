<script>

  /**
   * @todo Clean up the table in this file, make it its own component.
   * @todo Wire up pagination
   * @todo Plenty more yet I am sure
   */
  import { onMount } from "svelte";
  import Button from "../common/Button.svelte";
  import Icon from "../common/Icon.svelte"; 
  import Modal from "../common/Modal.svelte";
  import Alert from "../common/Alert.svelte";
  import { syncDomains } from "../utils";
  import { getFileStore } from "../file-store";
  import { defaultDateFormat } from "../stores";

  const PouchDB = window.require("pouchdb-browser");
  const dayjs = window.require("dayjs");
  PouchDB.plugin(window.require('pouchdb-find'));
  const db = new PouchDB("domains");
  
  let isSyncingDomains = false;
  let syncError = false;
  let hasFinishedImporting = false;
  let domainsAdded = 0;
  let domainsUpdated = 0;
  let pageSize = 10;
  let domains = [];
  let filterName;
  let currentPage = -1;
  let totalDomains = 0;
  let isFirstLoad = true;
  let dateFormat = $defaultDateFormat;
  let isLoadingDomains = false;
  let pageStartKeys = {};

  $: totalPages = totalDomains > 0 && currentPage > 0 ? (Math.round(totalDomains / pageSize) - 1): 1;
  $: currentStartIndex = (currentPage > -1 ? (currentPage * pageSize): 0) + 1;
  $: currentEndIndex = currentPage === totalPages ? totalDomains : (currentStartIndex - 1 + pageSize);
  
  const domainsGeneralIndex = "domains-general-index";

  function handleClose() {
    isSyncingDomains = false;
    hasFinishedImporting = false;
    domainsAdded = 0;
    domainsUpdated = 0;
  }

  function handleSyncDomains() {
    isSyncingDomains = true;
    hasFinishedImporting = false;
    syncDomains(db).then((totals) => {
      domainsAdded = totals.domainsAdded;
      domainsUpdated = totals.domainsUpdated;
      totalDomains = domainsAdded + domainsUpdated;
      hasFinishedImporting = true;
      loadDomains(0);
    });
  }

  function loadDomains(page) {

    if(page === currentPage || isLoadingDomains) {
      return;
    }

    let findOptions = {
      selector: {
        domainName: {$gte: null}
      },
      sort: ['domainName'],
      limit: pageSize,
      use_index: domainsGeneralIndex
    };

    if(domains.length > 0 && page > 0) {
      if(page < currentPage) {
        findOptions.selector = {
          domainName: {$gte: pageStartKeys[page]}
        }
      } else if(page > currentPage) {
        const lastName = domains[domains.length - 1].domainName;
        pageStartKeys[page] = lastName;
        findOptions.selector = {
          domainName: {$gt: lastName}
        }
      }
    }

    return db.find(findOptions).then((response) => {
      domains = [...response.docs];
      currentPage = page;
      isLoadingDomains = false;
      return Promise.resolve();
    });
  }

  onMount(() => {
    // Get the total number of stored pouch db documents
    // Using info is less overhead, but we must do this first before we can load the docs and apply pagination
    const settings = getFileStore("settings");
    if(settings) {
      pageSize = settings.domainsPageSize;
      dateFormat = settings.dateFormat;
    }
    // Create indexes used for domains selectors and querying
    db.createIndex({
      index: {
        fields: ["domainName", "registrationDate", "expiryDate"]
      },
      ddoc: domainsGeneralIndex
    }).then(() => {
      db.info().then((info) => {
        totalDomains = info.doc_count;
        loadDomains(0).then(() => { isFirstLoad = false });
      });
    });

  });
</script>

<div class="flex max-w-7xl mx-auto px-4 sm:px-6 md:px-8 gap-8">
  <h1 class="text-2xl font-semibold text-gray-900 flex-grow">Domains</h1>
  <div class="relative text-gray-500">
    <input class="border-2 border-gray-300 bg-white h-10 px-5 py-2 pr-16 rounded-lg text-sm focus:outline-none w-96 focus:ring-gray-600 focus:border-gray-600"
      type="search" placeholder="Filter by name..." bind:value={filterName}>
    <button class="absolute right-0 top-0 mt-3 mr-4">
      <svg class="text-gray-300 h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px"
        viewBox="0 0 56.966 56.966" style="enable-background:new 0 0 56.966 56.966;" xml:space="preserve"
        width="24px" height="24px">
        <path
          d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23  s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92  c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17  s-17-7.626-17-17S14.61,6,23.984,6z" />
      </svg>
    </button>
  </div>
  <Button type="primary" title="Synchronizes domains with all your configured registrars"
  iconName="sync" on:click={handleSyncDomains}>Synchronize</Button>
</div>
<div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
  <div class="py-4">
    {#if isFirstLoad}
      <p>Loading...</p>
    {:else if totalDomains > 0}
      <div class="flex flex-col">
        <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div
              class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg"
            >
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Domain Name
                    </th>
                    <th
                      scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Registrar
                    </th>
                    <th
                      scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name Servers
                    </th>
                    <th
                      scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Expires
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    {#each domains as domain}
                      <tr class="cursor-pointer hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {domain.domainName}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {domain.registrar}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {domain.nameServers !== null ? domain.nameServers.join(", ") : ""}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dayjs(domain.expiryDate).format(dateFormat)}
                        </td>
                      </tr>
                    {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 flex">
        <div class="flex-grow text-gray-400 text-sm leading-10">
          Showing {currentStartIndex} - {currentEndIndex} of {totalDomains} domains. Click on a domain to view more information.
        </div>
        <div class="flex-1 flex justify-between sm:justify-end">
          {#if currentPage > 0}
            <div class="mr-2">
              <Button iconName="arrowLeft" uppercase={false} disabled={isLoadingDomains}
              on:click={() => loadDomains(currentPage - 1)}>Previous Page</Button>
            </div>
          {/if}
          {#if currentPage < totalPages}
            <Button trailingIconName="arrowRight" uppercase={false} disabled={isLoadingDomains} 
            on:click={() => loadDomains(currentPage + 1)}>Next Page</Button>
          {/if}
        </div>
      </div>
    {:else}
      <p>You have no domains yet. Check your configured registrars and then come back here and click on synchronize.</p>
    {/if}
   
  </div>
</div>

<Modal show={isSyncingDomains}>
  <div class="w-80">
    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-3">
      Syncing Domains
    </h3>
    {#if !hasFinishedImporting}
      <div>
        <p class="mb-2">We are fetching your domains from all your configured registrars.</p>
        <p>Please wait, it could take several minutes.</p>
      </div>
      {#if syncError}
        <div class="mt-2">
          <Alert type="error">
            <span slot="heading">Error Synchronizing Domains</span>
            <span slot="body">Please check you have a valid internet connection.</span>
          </Alert>
        </div>
        <div class="mt-2 text-center">
          <Button on:click={handleClose}>Close</Button>
        </div>
      {:else}
        <div class="mt-3 mb-3 mx-auto w-3 h-3">
          <Icon class="text-steel-900 animate-spin" width="2em" height="2em" name="loader" />
        </div>
      {/if}
    {:else}
      <Alert type="success">
        <span slot="heading">Success</span>
        <div slot="body">
          <p class="mb-2">Imported {domainsAdded + domainsUpdated} domains.</p>
          <p class="mb-2"><b>Added: {domainsAdded}</b></p>
          <p><b>Updated: {domainsUpdated}</b></p>
        </div>
      </Alert>
      <div class="mt-2">
          <Button on:click={handleClose}>Close</Button>
      </div>
    {/if}
  </div>
</Modal>