<script lang="ts">  
  import { _ } from "svelte-i18n";
  import { registrarService, fileStoreService } from "../stores";
  import type { RegistrarSettings } from "../interfaces/registrarSettings";
  import type { CheckRegistrarsResult } from "../interfaces/checkRegistrarsResult";
  import TextField from "../shared/TextField.svelte";
  import Button from "../shared/Button.svelte";
  import Modal from "../shared/Modal.svelte";
  import Alert from "../shared/Alert.svelte";
  import { onMount } from "svelte";
  import Layout from "./_Layout.svelte";

  let hasChanges: boolean = false;
  let settings: RegistrarSettings = {
    gdApiKey: "",
    gdSecret: "",
    dynadotApiKey: "",
    nameSiloApiKey: "",
    namecheapKey: "",
    namecheapUser: ""
  };
  let origSettings: RegistrarSettings;
  let showModal: boolean = false;
  let allRejected: boolean = false;
  let isLoading: boolean = true;
  let isChecking: boolean = false;
  let checkRegistrarsResult: CheckRegistrarsResult;

  $: {
    // Here be dragons.. but this works. Since this is a reactive block, hasChanges = false is only
    // set when something changes and before we check. Then if something has changed we override it.
    // I know this looks funny, but this works like magic! :)
    if(settings && origSettings) {
      Object.entries(settings).forEach(([key, value]) => {
        if(origSettings[key] !== settings[key]) {
          hasChanges = true;
        }
      });
    }
  }

  async function saveChanges() {
    showModal = true;
    isChecking = true; 
    allRejected = false;

    checkRegistrarsResult = await $registrarService.checkRegistrars(settings);
    isChecking = false;

    // If failed equals total checked it means all of them failed
    if(checkRegistrarsResult.failedClients.length === checkRegistrarsResult.totalChecked) {
      allRejected = true;
      return;
    }

    // Only save those that have passed, so build up a new object from the results and save that as the registrar settings
    // into the file store
    const toSave: RegistrarSettings = {...settings};
    checkRegistrarsResult.failedClients.forEach((name) => {
      name = name.toLowerCase();
      if(name === "godaddy") {
        toSave.gdApiKey = null;
        toSave.gdSecret = null;
      } else if(name === "dynadot") {
        toSave.dynadotApiKey = null;
      } else if(name === "namesilo") {
        toSave.nameSiloApiKey = null;
      } else if(name === "namecheap") {
        toSave.namecheapKey = null;
        toSave.namecheapUser = null;
      }
    });

    $fileStoreService.set("registrarSettings", toSave);
  }

  function handleClose() {
    showModal = false;
    isChecking = false;
    checkRegistrarsResult = undefined;
    allRejected = false;
  }

  onMount(async () => {
    settings = {...await $fileStoreService.get("registrarSettings", settings)};
    origSettings = {...settings};
    isLoading = false;
  });

</script>

<Layout heading={$_("registrar_settings")}>
  <div slot="headerRight">
    <Button disabled={!hasChanges} type="primary" size="large" on:click={saveChanges} iconName="save">{$_("save_changes")}</Button>
  </div>
  {#if isLoading}
    <p>{$_("registrars_route.loading_settings")}</p>
  {:else}
    <div class="flex flex-col divide-y divide-gray-200 space-y-8 px-5 py-6">
      <div>
        <h2 class="text-lg leading-6 font-medium">
            {$_("registrars_route.godaddy_settings")}
        </h2>
        <p class="mt-1 text-sm">
          {$_("registrars_route.godaddy_key_message_one")}
          <a href="https://developer.godaddy.com/keys" class="external">https://developer.godaddy.com/keys</a>. 
          {$_("registrars_route.godaddy_key_message_two")}.
        </p>

        <div class="mt-4 grid grid-cols-4 gap-6">
          <div class="col-span-2">
            <TextField name="gdApiKey" label="API Key" bind:value={settings.gdApiKey} />
          </div>
          <div class="col-span-2">
            <TextField name="gdSecret" label="Secret" bind:value={settings.gdSecret} />
          </div>
        </div>
      </div>
      
      <div class="pt-6">
        <div class="mb-4">
          <h2 class="text-lg leading-6 font-medium">
            {$_("registrars_route.dynadot_settings")}
          </h2>
          <p class="mt-1 text-sm">
            {$_("registrars_route.dynadot_key_message")}
            <a href="https://www.dynadot.com/account/domain/setting/api.html" class="external">https://www.dynadot.com/account/domain/setting/api.html</a> 
          </p>
        </div>
        <TextField name="dynadotAPIKey" label="API Key" bind:value={settings.dynadotApiKey} />
      </div>

      <div class="pt-6">
        <div class="mb-4">
          <h2 class="text-lg leading-6 font-medium">
            {$_("registrars_route.namesilo_settings")}
          </h2>
          <p class="mt-1 text-sm">
            {$_("registrars_route.namesilo_key_message")}
            <a href="https://www.namesilo.com/account/api-manager" class="external">https://www.namesilo.com/account/api-manager</a>. 
          </p>
        </div>
        <TextField name="namesiloAPIKey" label="API Key" bind:value={settings.nameSiloApiKey} />
      </div>
        
      <div class="pt-6">
        <div class="mb-4">
          <h2 class="text-lg leading-6 font-medium">
            {$_("registrars_route.namecheap_settings")}
          </h2>
          <p class="mt-1 text-sm">
            {$_("registrars_route.namecheap_key_message_one")}
            <a href="https://ap.www.namecheap.com/settings/tools" class="external">https://ap.www.namecheap.com/settings/tools</a>.
            {$_("registrars_route.namecheap_key_message_two")}
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
    <div class="text-xs text-gray-400 px-5">
      <p>{$_("registrars_route.security_message_one")}
        <a href="https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation" class="external">aes-256-cbc</a>
        {$_("registrars_route.security_message_two")}</p>
      <p class="mt-2">{$_("registrars_route.security_message_three")}</p>
    </div>
  {/if}


  <Modal show={showModal}>
    <div class="text-center">
      <h3 class="text-lg leading-6 font-medium text-gray-900">
        {$_("saving_changes")}
      </h3>
      <div class="mt-2">
        {#if isChecking}
          <p class="text-sm text-gray-500">{$_("registrars_route.checking_message")}</p>
        {:else if allRejected}
          <div class="mt-2">
            <Alert type="error">
              <span slot="heading">{$_("critical_error")}</span>
              <span slot="body">{$_("registrars_route.all_rejected_message")}</span>
            </Alert>
          </div>
          <div class="mt-2 text-center">
            <Button on:click={handleClose}>{$_("ok")}</Button>
          </div>
        {:else if checkRegistrarsResult}
          {#if checkRegistrarsResult.acceptedClients && checkRegistrarsResult.acceptedClients.length > 0}
            <Alert type="success">
              <span slot="heading">{$_("accepted")}</span>
              <div slot="body">
                <ul>
                  {#each checkRegistrarsResult.acceptedClients as clientName}
                    <li>{clientName}</li>
                  {/each}
                </ul>
              </div>
            </Alert>
          {/if}
          {#if checkRegistrarsResult.failedClients && checkRegistrarsResult.failedClients.length > 0}
            <Alert type="warning">
              <span slot="heading">{$_("rejected")}</span>
              <div slot="body">
                <ul>
                  {#each checkRegistrarsResult.failedClients as clientName}
                    <li>{clientName}</li>
                  {/each}
                </ul>
                <p class="mt-2">{$_("registrars_route.rejected_removal_message")}</p>
              </div>
            </Alert>
          {/if}
          <div class="mt-2 text-center">
            <Button on:click={handleClose}>{$_("ok")}</Button>
          </div>
        {/if}
      </div>
    </div>
  </Modal>
</Layout>

