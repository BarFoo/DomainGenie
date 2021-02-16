<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { useForm, Validators, Hint, HintGroup } from "svelte-use-form";
  import type { Contact } from "../interfaces/contact";
  import ContactFormItem from "./ContactFormItem.svelte";
  import TextField from "./TextField.svelte";

  export let contact: Contact;
  export let autoFocusFirst: boolean = true;

  const phonePattern = /^\+([0-9]){1,3}\.([0-9]\ ?){5,14}$/;

  function validatePhone(value: string) {
    return phonePattern.test(value) ? null : { invalidRegex: true };
  }

  export let form = useForm({
    firstName: { validators: [Validators.required]},
    lastName: { validators: [Validators.required]},
    email: { validators: [Validators.required, Validators.email]},
    addressLineOne: { validators: [Validators.required]},
    city: { validators: [Validators.required]},
    state: { validators: [Validators.required]},
    postalCode: { validators: [Validators.required]},
    country: { validators: [Validators.required, Validators.minLength(2), Validators.maxLength(2)]},
    phone: { validators: [Validators.required, validatePhone]}
  });

  let firstNameField;

  onMount(() => {
    // Without a timeout the sliding transition does NOT work when trying to use autofocus at the same time
    setTimeout(() => {
      if(firstNameField && autoFocusFirst) {
        firstNameField.focus();
      }
    }, 250);
  });
</script>

<form class="divide-y divide-gray-200" on:submit={(e) => e.preventDefault()} use:form> 
  <div class="flex-grow flex px-5 py-6">
    <h3 class="flex-grow leading-6 font-medium">
      <slot name="heading"></slot>
    </h3>
    <slot name="headerRight"></slot>
  </div>
  <ContactFormItem>
    <span slot="label">{$_("first_name")}</span>
    <TextField bind:value={contact.firstName} name="firstName" bind:this={firstNameField} />
    <Hint name="firstName" on="required">
      {$_("first_name_required")}
    </Hint>
  </ContactFormItem>
  <ContactFormItem>
    <span slot="label">{$_("last_name")}</span>
    <TextField bind:value={contact.lastName} name="lastName" />
    <Hint name="lastName" on="required">
      {$_("last_name_required")}
    </Hint>
  </ContactFormItem>
  <ContactFormItem>
    <span slot="label">{$_("email")}</span>
    <TextField bind:value={contact.email} name="email" />
    <HintGroup name="email">
      <Hint on="required">{$_("email_required")}</Hint>
      <Hint on="email" hideWhenRequired>{$_("email_invalid")}</Hint>
    </HintGroup>
  </ContactFormItem>
  <ContactFormItem>
    <span slot="label">{$_("address_one")}</span>
    <TextField bind:value={contact.addressLineOne} name="addressLineOne" />
    <Hint name="addressLineOne" on="required">
      {$_("address_one_required")}
    </Hint>
  </ContactFormItem>
  <ContactFormItem>
    <span slot="label">{$_("address_two")}</span>
    <TextField bind:value={contact.addressLineTwo} />
  </ContactFormItem>
  <ContactFormItem>
    <span slot="label">{$_("city")}</span>
    <TextField bind:value={contact.city} name="city" />
    <Hint name="city" on="required">
      {$_("city_required")}
    </Hint>
  </ContactFormItem>
  <ContactFormItem>
    <span slot="label">{$_("state")}</span>
    <TextField bind:value={contact.state} name="state" />
    <Hint name="state" on="required">
      {$_("state_required")}
    </Hint>
  </ContactFormItem>
  <ContactFormItem>
    <span slot="label">{$_("zip")}</span>
    <TextField bind:value={contact.postalCode} name="postalCode" />
    <Hint name="postalCode" on="required">
      {$_("zip_required")}
    </Hint>
  </ContactFormItem>
  <ContactFormItem>
    <span slot="label">{$_("country")}</span>
    <TextField bind:value={contact.country} name="country" />
    <HintGroup name="country">
      <Hint on="required">{$_("country_required")}</Hint>
      <Hint on="minLength" hideWhenRequired>{$_("country_invalid")}</Hint>
      <Hint on="maxLength" hideWhenRequired>{$_("country_invalid")}</Hint>
    </HintGroup>
  </ContactFormItem>
  <ContactFormItem>
    <span slot="label">{$_("phone")} <span class="block text-sm text-gray-300">+44.123456</span></span>
    <TextField bind:value={contact.phone} name="phone" />
    <HintGroup name="phone">
      <Hint on="required">{$_("phone_required")}</Hint>
      <Hint hideWhenRequired>{$_("phone_invalid")}</Hint>
    </HintGroup>
  </ContactFormItem>
  <slot></slot>
</form>