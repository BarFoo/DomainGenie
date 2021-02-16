<script lang="ts">
  import { date, _ } from "svelte-i18n";
  import Toggle from "../shared/Toggle.svelte";
  import { appDatabase, registrarService, singleDomainEdit } from "../stores";

  function handleAutoRenewalToggle() {
    $appDatabase.domains.put($singleDomainEdit);
    $registrarService.updateDomains([{
      domainName: $singleDomainEdit.domainName,
      registrar: $singleDomainEdit.registrar
    }], {
      hasAutoRenewal: $singleDomainEdit.hasAutoRenewal
    });
  }

  function handlePrivacyToggle() {
    $appDatabase.domains.put($singleDomainEdit);
    $registrarService.updateDomains([{
      domainName: $singleDomainEdit.domainName,
      registrar: $singleDomainEdit.registrar
    }], {
      hasPrivacy: $singleDomainEdit.hasPrivacy
    });
  }
</script>

{#if $singleDomainEdit}
  <div class="px-5 py-6">
    <h3 class="text-lg leading-6 font-medium">{$_("domain_overview")}</h3>
    <p class="mt-1 max-w-2xl text-sm">
      {$_("domain_overview_description")}
    </p>
  </div>
  <div class="border-t border-gray-200">
    <dl class="divide-y divide-gray-200">
      <div class="py-6 grid grid-cols-3 gap-4 px-5">
        <dt class="text-sm font-medium">{$_("domain_name")}</dt>
        <dd class="mt-1 text-sm col-span-2">{$singleDomainEdit.domainName}</dd>
      </div>
      <div class="py-6 grid grid-cols-3 gap-4 px-5">
        <dt class="text-sm font-medium">{$_("registrar")}</dt>
        <dd class="mt-1 text-sm col-span-2">{$singleDomainEdit.registrar}</dd>
      </div>
      <div class="py-6 grid grid-cols-3 gap-4 px-5">
        <dt class="text-sm font-medium">{$_("registered")}</dt>
        <dd class="mt-1 text-sm col-span-2">{$date($singleDomainEdit.registrationDate, { format: "medium"})}</dd>
      </div>
      <div class="py-6 grid grid-cols-3 gap-4 px-5">
        <dt class="text-sm font-medium">{$_("expires")}</dt>
        <dd class="mt-1 text-sm col-span-2">{$date($singleDomainEdit.expiryDate, { format: "medium"})}</dd>
      </div>
      <div class="py-6 grid grid-cols-3 gap-4 px-5">
        <dt class="text-sm font-medium">{$_("auto_renew")}</dt>
        <dd class="mt-1 text-sm col-span-2">
          <Toggle bind:enabled={$singleDomainEdit.hasAutoRenewal} on:toggleChanged={handleAutoRenewalToggle} />
        </dd>
      </div>
      <div class="py-6 grid grid-cols-3 gap-4 px-5">
        <dt class="text-sm font-medium">{$_("privacy")}</dt>
        <dd class="mt-1 text-sm col-span-2">
          <Toggle bind:enabled={$singleDomainEdit.hasPrivacy} on:toggleChanged={handlePrivacyToggle} />
        </dd>
      </div>
    </dl>
  </div>
{/if}