<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { _ } from "svelte-i18n";
  import type { Contact } from "../interfaces/contact";
  import Button from "../shared/Button.svelte";
  import ContactForm from "../shared/ContactForm.svelte";
  import { registrarService, appDatabase, bulkDomainEdit, isUpdatingDomains } from "../stores";

  const dispatch = createEventDispatcher();

  // The forms are NOT the same as contacts.. form ref is used for validating the contact schema
  let contactForm;

  // These must have a value set or validation breaks
  let contact: Contact = {};

  async function saveChanges() {

    // Make sure we get the latest domain info (in case of auto sync etc)
    $bulkDomainEdit = await $appDatabase.domains.bulkGet($bulkDomainEdit.map(d => d.domainName));

    const contactIds = [];

    $bulkDomainEdit.forEach((domain) => {
      domain.contactAdmin = {...domain.contactAdmin, ...contact};
      domain.contactBilling = {...domain.contactBilling, ...contact};
      domain.contactRegistrant = {...domain.contactRegistrant, ...contact};
      domain.contactTech = {...domain.contactTech, ...contact};
      
      if(domain.contactAdmin.contactId && !contactIds.includes(domain.contactAdmin.contactId)) {
        contactIds.push(domain.contactAdmin.contactId);
      }

      if(domain.contactBilling.contactId && !contactIds.includes(domain.contactBilling.contactId)) {
        contactIds.push(domain.contactBilling.contactId);
      }

      if(domain.contactRegistrant.contactId && !contactIds.includes(domain.contactRegistrant.contactId)) {
        contactIds.push(domain.contactRegistrant.contactId);
      }

      if(domain.contactTech.contactId && !contactIds.includes(domain.contactTech.contactId)) {
        contactIds.push(domain.contactTech.contactId);
      }
    });

    // Build a new array of domains to send to the main process, we only need domain name
    // and registrar here. This helps reduce memory usage.
    const domains = $bulkDomainEdit.map(d => {
      return {
        domainName: d.domainName,
        registrar: d.registrar
      }
    });

    $registrarService.updateDomains(domains, {
      contact,
      contactIds
    });

    await $appDatabase.domains.bulkPut($bulkDomainEdit);

    dispatch("saveChanges");
  }


</script>

<div class="pb-24">
  <ContactForm contact={contact} bind:form={contactForm} />
</div>

<div class="bg-white pb-6 px-5 leading-20 fixed bottom-0 z-10 h-20">
  <Button 
    type="primary" 
    iconName="save" 
    disabled={$isUpdatingDomains 
          || (contact && contactForm && !$contactForm.valid)}
    on:click={saveChanges}>
    {#if !$isUpdatingDomains}
      {$_("save_changes")}
    {:else}
      {$_("working")}...
    {/if}
  </Button>
</div>