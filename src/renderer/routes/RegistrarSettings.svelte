<script>
  import TextField from "../common/TextField.svelte";
  import Button from "../common/Button.svelte";
  import Modal from "../common/Modal.svelte";
  import Alert from "../common/Alert.svelte";
  import { onMount } from "svelte";
  import { encryptionKey } from "../stores";
  import { getFileStore, setFileStore } from "../file-store";

  const electron = window.require("electron");
  const ipcRenderer = electron.ipcRenderer;

  let hasChanges = false;
  let settings = {};
  let origSettings = {};
  let showModal = false;
  let allRejected = false;
  let isLoading = true;
  let isChecking = false;
  let outcome;

  $: {
    hasChanges = false;
    Object.entries(settings).forEach(([key, value]) => {
      if(origSettings[key] !== settings[key]) {
        hasChanges = true;
      }
    });
  }

  function saveChanges() {
    console.log("Saving changes");
    origSettings = {...settings};
    showModal = true;
    setFileStore("registrarSettings", settings);
    isChecking = true; 
    ipcRenderer.invoke("check-registrars", $encryptionKey).then((response) => {
      console.log("Received outcome");
      console.log(response);
      isChecking = false;
      outcome = response;
    }, () => {
      isChecking = false;
      allRejected = true;
    });
  }

  function handleClose() {
    showModal = false;
    isChecking = false;
    outcome = undefined;
    allRejected = false;
  }

  onMount(() => {
    settings = getFileStore("registrarSettings") || {
      gdApiKey: "",
      gdSecret: "",
      dynadotApiKey: "",
      nameSiloApiKey: "",
      namecheapUser: "",
      namecheapKey: ""
    };
    origSettings = {...settings};
    isLoading = false;
  });

</script>

<div class="max-w-7xl mx-auto px-4 flex">
  <h1 class="text-2xl font-semibold text-gray-900 flex-grow">Registrar Settings</h1>
  <Button disabled={!hasChanges} type="primary" on:click={saveChanges} iconName="save">Save Changes</Button>
</div>
{#if isLoading}
  <div class="max-w-7xl mx-auto px-4 mt-6">
    <p>Please wait, loading settings...</p>
  </div>
{:else}
  <div class="max-w-7xl mx-auto px-4 mt-6">
    <div class="shadow sm:rounded-md sm:overflow-hidden mb-6">
      <div class="bg-white py-6 px-4 sm:p-6">
        <div>
          <h2 id="payment_details_heading" class="text-lg leading-6 font-medium text-gray-900">GoDaddy Settings</h2>
          <p class="mt-1 text-sm text-gray-500">
            To generate new API keys for GoDaddy please visit 
            <a href="https://developer.godaddy.com/keys" class="text-steel-900 external">https://developer.godaddy.com/keys</a>. 
            From here click on <i>Create New Api Key</i>.
          </p>
        </div>
        <div class="mt-4 grid grid-cols-4 gap-6">
          <div class="col-span-2">
            <TextField name="gdApiKey" label="API Key" bind:value={settings.gdApiKey} />
          </div>
          <div class="col-span-2">
            <TextField name="gdSecret" label="Secret" bind:value={settings.gdSecret} />
          </div>
        </div>
      </div>
    </div>
    <div class="shadow sm:rounded-md sm:overflow-hidden mb-6">
      <div class="bg-white py-6 px-4 sm:p-6">
        <div class="mb-4">
          <h2 id="payment_details_heading" class="text-lg leading-6 font-medium text-gray-900">Dynadot Settings</h2>
          <p class="mt-1 text-sm text-gray-500">
            Your Dynadot API key can be found at
            <a href="https://www.dynadot.com/account/domain/setting/api.html" class="text-steel-900 external">https://www.dynadot.com/account/domain/setting/api.html</a> 
          </p>
        </div>
        <TextField name="dynadotAPIKey" label="API Key" bind:value={settings.dynadotApiKey} />
      </div>
    </div>
    <div class="shadow sm:rounded-md sm:overflow-hidden mb-6">
      <div class="bg-white py-6 px-4 sm:p-6">
        <div class="mb-4">
          <h2 id="payment_details_heading" class="text-lg leading-6 font-medium text-gray-900">NameSilo Settings</h2>
          <p class="mt-1 text-sm text-gray-500">
            Your NameSilo API key can be found at
            <a href="https://www.namesilo.com/account/api-manager" class="text-steel-900 external">https://www.namesilo.com/account/api-manager</a> 
          </p>
        </div>
        <TextField name="namesiloAPIKey" label="API Key" bind:value={settings.nameSiloApiKey} />
      </div>
    </div>
    <div class="shadow sm:rounded-md sm:overflow-hidden mb-6">
      <div class="bg-white py-6 px-4 sm:p-6">
        <div class="mb-4">
          <h2 id="payment_details_heading" class="text-lg leading-6 font-medium text-gray-900">Namecheap Settings</h2>
          <p class="mt-1 text-sm text-gray-500">
            Your Namecheap API user and key can be set/found at 
            <a href="https://ap.www.namecheap.com/settings/tools" class="text-steel-900 external">https://ap.www.namecheap.com/settings/tools</a>.
            Scroll down to Business & Dev Tools and follow the instructions. 
          </p>
        </div>
        <div class="mt-4 grid grid-cols-4 gap-6">
          <div class="col-span-2">
            <TextField name="namecheapKey" label="API Key" bind:value={settings.namecheapKey} />
          </div>
          <div class="col-span-2">
            <TextField name="namecheapUser" label="API User" bind:value={settings.namecheapUser} />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<Modal show={showModal}>
  <div class="text-center">
    <h3 class="text-lg leading-6 font-medium text-gray-900">
      Saving Changes
    </h3>
    <div class="mt-2">
      {#if isChecking}
        <p class="text-sm text-gray-500">Please wait, checking registrar settings</p>
      {:else if allRejected}
        <div class="mt-2">
          <Alert type="error">
            <span slot="heading">Critical Error</span>
            <span slot="body">All provided API keys are invalid. Please check and try again.</span>
          </Alert>
        </div>
        <div class="mt-2 text-center">
          <Button on:click={handleClose}>OK</Button>
        </div>
      {:else if outcome}
        {#if outcome.accepted && outcome.accepted.length > 0}
          <Alert type="success">
            <span slot="heading">Accepted</span>
            <div slot="body">
              <p class="mb-2">The following keys are working as expected:</p>
              <ul>
                {#each outcome.accepted as clientName}
                  <li>{clientName}</li>
                {/each}
              </ul>
            </div>
          </Alert>
        {/if}
        {#if outcome.rejected && outcome.rejected.length > 0}
          <Alert type="warning">
            <span slot="heading">Rejected</span>
            <div slot="body">
              <p class="mb-2">The following keys were rejected:</p>
              <ul>
                {#each outcome.rejected as clientName}
                  <li>{clientName}</li>
                {/each}
              </ul>
            </div>
          </Alert>
        {/if}
        <div class="mt-2 text-center">
          <Button on:click={handleClose}>OK</Button>
        </div>
      {/if}
    </div>
  </div>
</Modal>