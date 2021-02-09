<script lang="ts">
  /**
   * @todo Improve error handling of the file store initialization
   */
  import { onMount, tick } from "svelte";
  import { push } from "svelte-spa-router";
  import { _ } from "svelte-i18n";
  import Button from "./shared/Button.svelte";
  import Modal from "./shared/Modal.svelte";
  import Alert from "./shared/Alert.svelte";
  import Badge from "./shared/Badge.svelte";
  import { fileStoreService, hasEnteredPassword } from "./stores";
  import checkPasswordStrength from "check-password-strength";

  // If the user has already created their password
  let hasCreatedPassword: boolean = window.localStorage.getItem("hasCreatedPassword") !== null;

  let password: string;
  let confirmPassword: string;

  // A reference to the password input field DOM element
  let passwordInputRef: HTMLElement;

  // Whether to show the modal or not, we show it on first run or if screen is locked
  let showModal: boolean = true;
  let passwordErrors: string[] = [];

  let currentPasswordStrength;

  $: {
    if(password) {
      currentPasswordStrength = checkPasswordStrength(password);
    }
  }

  /**
   * This runs if the user is setting up their password for the first time. It is responsible
   * for validating the confirmation password matches, and also checks password strength.
   */
  function createPassword() {

    // Reset errors when re-submitting
    passwordErrors = [];

    if(password === undefined || password.length === 0) {
      passwordErrors.push($_("empty_password"));
    }

    if(confirmPassword === undefined || confirmPassword.length === 0) {
      passwordErrors.push($_("empty_confirm_password"));
    }

    if(confirmPassword !== password) {
      passwordErrors.push($_("password_confirm_not_match"));
    }

    // An id of 0 means it is far too weak.. we will only force this but not other strengths
    if(password && checkPasswordStrength(password).id === 0) {
      passwordErrors.push($_("weak_password"));
    }

    passwordErrors = [...passwordErrors];

    if(passwordErrors.length === 0) {
      $fileStoreService.init(password).then((isValid) => {
        if(!isValid) {
          passwordErrors.push($_("password_creation_error"));
          passwordErrors = [...passwordErrors];
        } else {
          window.localStorage.setItem("hasCreatedPassword", "1");
          showModal = false;
          hasCreatedPassword = true;
          $hasEnteredPassword = true;
          push("/registrars");
        }
      });
    }
  }

  /**
   * Runs when a user already has a password setup. Binded to the password input field.
   * @param evt KeyboardEvent
   */
  function checkExistingPassword(evt: KeyboardEvent) {
    const enteredPassword = (<HTMLInputElement>evt.target).value;
    if(evt.key === "Enter") {
      evt.preventDefault();
      passwordErrors = [];
      $fileStoreService.init(enteredPassword).then((isValid) => {
        if(!isValid) {
          passwordErrors.push($_("invalid_password"));
          passwordErrors = [...passwordErrors];
        } else {
          showModal = false;
          $hasEnteredPassword = true;
          push("/domains");
        }
      });
    } else {
      passwordErrors = [];
    }
  }

  /**
   * Captures Ctrl+L being pressed in order to lock the screen.
   * @param e Keyboard event
   */
  function handleWindowKeydown(e) {
    if(e.ctrlKey && e.key === "l" && hasCreatedPassword && !showModal) {
      showModal = true;
      push("/");

      tick().then(() => passwordInputRef.focus());
    }
  }

  onMount(() => {
    if(passwordInputRef) {
      passwordInputRef.focus();
    }
    if(showModal) {
      push("/");
    }
  });
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<Modal show={showModal}>
  <div>
    <h3 class="text-2xl leading-6 font-medium">
      {#if hasCreatedPassword} 
        {$_("enter_password")}
      {:else}
        {$_("create_password")}
      {/if}
    </h3>
    <div class="mt-4">
      {#if passwordErrors.length > 0}
        <Alert type="error">
          <span slot="heading">{$_("errors")}</span>
          <div slot="body">
            <ul>
              {#each passwordErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        </Alert>
      {/if}
      {#if !hasCreatedPassword}
        <p class="mb-1">{$_("password_intro_one")}</p>
        <p class="mb-1">{$_("password_intro_two")}</p>
        <p class="mb-1">{$_("password_intro_three")}</p>
        <p class="mb-1">{$_("password_intro_four")}</p>
        <div class="mt-4">
          <input type="password" class="block mb-2 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-600 focus:border-gray-600" 
                placeholder={$_("password")} bind:value={password} bind:this={passwordInputRef} />
          <input type="password" class="block mb-4 w-full border border-gray-300
           rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-600 focus:border-gray-600" 
                placeholder={$_("confirm_password")} bind:value={confirmPassword}  />
          <div class="flex">
            <div class="flex-1">
              <Button type="primary" on:click={createPassword}>{$_("create_password")}</Button>
            </div>
            {#if currentPasswordStrength}
              {#if currentPasswordStrength.id === 0}
                <Badge type="error">{$_("password_strength_weak")}</Badge>
              {:else if currentPasswordStrength.id === 1}
                <Badge type="warning">{$_("password_strength_ok")}</Badge>
              {:else}
                <Badge type="success">{$_("password_strength_strong")}</Badge>
              {/if}
            {/if}
          </div>
        </div>
      {:else}
          <input type="password" class="block mb-2 w-full border border-gray-300 
          rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-600 focus:border-gray-600" 
                on:keyup={checkExistingPassword} bind:this={passwordInputRef} />
          <p class="text-sm text-gray-400">{$_("password_press_enter")}</p>
      {/if}
    </div>
  </div>
</Modal>