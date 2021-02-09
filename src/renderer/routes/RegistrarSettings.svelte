<script lang="ts">  
  import { _ } from "svelte-i18n";
  import { registrarService, fileStoreService, isCheckingRegistrars } from "../stores";
  import type { RegistrarSettings } from "../interfaces/registrarSettings";
  import TextField from "../shared/TextField.svelte";
  import Button from "../shared/Button.svelte";
  import { onMount } from "svelte";
  import Layout from "./_Layout.svelte";

  let settings: RegistrarSettings = {
    gdApiKey: "",
    gdSecret: "",
    dynadotApiKey: "",
    nameSiloApiKey: "",
    namecheapKey: "",
    namecheapUser: ""
  };

  let isLoading: boolean = true;

  async function saveChanges() {
    if($isCheckingRegistrars) {
      return;
    }
    $isCheckingRegistrars = true;
    $registrarService.checkRegistrars(settings);
    $fileStoreService.set("registrarSettings", settings);
  }

  onMount(async () => {
    settings = {...await $fileStoreService.get("registrarSettings", settings)};
    isLoading = false;
  });

</script>

<Layout heading={$_("registrar_settings")}>
  <div slot="headerRight">
    <Button disabled={$isCheckingRegistrars} type="primary" size="large" on:click={saveChanges} iconName="save">
      {#if !$isCheckingRegistrars}
        {$_("save_changes")}
      {:else}
        {$_("checking")}...
      {/if}
    </Button>
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
</Layout>