<script lang="ts">
  /** 
   * This is the single domain name server edit. Bulk edit is a shared modal found in shared,
   * but they do both share the same form component (NameServerForm). This is essentially
   * a wrapper.
   */
  import { _ } from "svelte-i18n";
  import Button from "../shared/Button.svelte";
  import { registrarService, appDatabase, singleDomainEdit, isUpdatingDomains } from "../stores";
  import type { Domain } from "../database/domain";
  import ContactForm from "../shared/ContactForm.svelte";
  import Checkbox from "../shared/Checkbox.svelte";
  
  let domain: Domain = $singleDomainEdit;

  // Whether the registrant matches all
  let registrantMatchesAll: boolean = true;

  // Refs to form bindings, for validation
  let adminForm;
  let billingForm;
  let registrantForm;
  let techForm;

  async function saveChanges() {

    if(registrantMatchesAll) {
      const clonedRegistrant = {...domain.contactRegistrant};

      if(clonedRegistrant.contactId) {
        delete clonedRegistrant.contactId;
      }

      domain.contactBilling = {...domain.contactBilling, ...clonedRegistrant};
      domain.contactAdmin = {...domain.contactAdmin, ...clonedRegistrant};
      domain.contactTech = {...domain.contactTech, ...clonedRegistrant};
    }

    await $appDatabase.domains.put(domain);

    $registrarService.updateDomains([{
      domainName: domain.domainName,
      registrar: domain.registrar
    }], {
      contactAdmin: domain.contactAdmin,
      contactBilling: domain.contactBilling,
      contactRegistrant: domain.contactRegistrant,
      contactTech: domain.contactTech
    });
  }

  if(domain) {
    const registrantEntries = Object.entries(domain.contactRegistrant).toString();
    registrantMatchesAll = 
     registrantEntries ===
     Object.entries(domain.contactBilling).toString() &&
     registrantEntries ===
     Object.entries(domain.contactTech).toString() &&
     registrantEntries ===
     Object.entries(domain.contactTech).toString();
  }
</script>

<div class="border-b flex border-gray-200">
  <div class="flex-grow px-5 py-6">
    <h3 class="text-lg leading-6 font-medium">{$_("domain_contacts")}</h3>
    <p class="mt-1 text-sm">{$_("domain_contacts_description")}</p>
  </div>
  <div class="flex-shrink-0 px-5 py-6">
    <Button 
      type="primary" 
      iconName="save" 
      disabled={$isUpdatingDomains 
        || (registrantForm && !$registrantForm.valid)
        || (!registrantMatchesAll && billingForm && !$billingForm.valid)
        || (!registrantMatchesAll && adminForm && !$adminForm.valid)
        || (!registrantMatchesAll && techForm && !$techForm.valid)}
      on:click={saveChanges}>
      {#if !$isUpdatingDomains}
        {$_("save_changes")}
      {:else}
        {$_("working")}...
      {/if}
    </Button>
  </div>
</div>
<ContactForm contact={$singleDomainEdit.contactRegistrant} bind:form={registrantForm}>
  <span slot="heading">{$_("registrant")}</span>
  <div slot="headerRight">
    <Checkbox bind:checked={registrantMatchesAll}>
      {$_("registrant_matches_all")}
    </Checkbox>
  </div>
</ContactForm>
<hr />
<div class:hidden={registrantMatchesAll}>
  <ContactForm contact={$singleDomainEdit.contactBilling} bind:form={billingForm}>
    <span slot="heading">{$_("billing")}</span>
  </ContactForm>
  <hr />
  <ContactForm contact={$singleDomainEdit.contactAdmin} bind:form={adminForm}>
    <span slot="heading">{$_("admin")}</span>
  </ContactForm>
  <hr />
  <ContactForm contact={$singleDomainEdit.contactTech} bind:form={techForm}>
    <span slot="heading">{$_("tech")}</span>
  </ContactForm>
</div>