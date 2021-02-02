<script>
  /**
   * App is responsible for setting up the initial $encryptionKey used throughout the rest of the app.
   * This is the only file that should have any reference to Store other than file-store. Every other component should use
   * getFileStore and setFileStore utility methods exported by file-store.js.
   */
  import { onMount } from "svelte";
  import { encryptionKey } from "./stores";
  import TailwindCSS from "./TailwindCSS.svelte";
  import Sidebar from "./sidebar/Sidebar.svelte";
  import Domains from "./routes/Domains.svelte";
  import Domain from "./routes/Domain.svelte";
  import RegistrarSettings from "./routes/RegistrarSettings.svelte";
  import Modal from "./common/Modal.svelte";
  import Router from "svelte-spa-router";
  import Settings from "./routes/Settings.svelte";
  import MarketplaceSettings from "./routes/MarketplaceSettings.svelte";
  import Home from "./routes/Home.svelte";
  import { push } from "svelte-spa-router";

  const electron = window.require('electron');
  const shell = electron.shell;
  const Store = window.require("electron-store");

  const routes = {
    "/": Home,
    "/domains": Domains,
    "/domains/:id": Domain,
    "/registrars": RegistrarSettings,
    "/settings": Settings,
    "/marketplaces": MarketplaceSettings
  };

  let hasRunBefore = window.localStorage.getItem("hasRunBefore") !== null;
  let passwordError = false;
  let showModal = true;
  let passwordInput;
  
  function handleExternalLinks(evt) {
    if(evt.target.tagName === "A" && evt.target.classList.contains("external")) {
      evt.preventDefault();
      shell.openExternal(evt.target.href);
    }
  }

  function handleEncryptionKey(evt) {
    if(evt.key === "Enter") {
      evt.preventDefault();
      let enteredKey = evt.target.value;
      try 
      {
        // This must be in a try catch, as an invalid password will throw JSON deserialization issue
        // so by catching that we know the password is incorrect!
        const store = new Store({
          encryptionKey: enteredKey
        });
        if(hasRunBefore && !store.has("check")) {
          passwordError = true;
          return;
        }
        store.set("check", { check: true});
      }
      catch(ex)
      {
        passwordError = true;
        return;
      }

      $encryptionKey = enteredKey;
      showModal = false;
      window.localStorage.setItem("hasRunBefore", true);
      push("/domains");
    } else {
      passwordError = false;
    }
  }

  onMount(() => {
    if(passwordInput) {
      passwordInput.focus();
    }
  });
</script>
<TailwindCSS />
<svelte:window on:click={handleExternalLinks} />

<div class="h-screen flex overflow-hidden bg-gray-100">
  <Sidebar />
  <div class="flex flex-col w-0 flex-1 overflow-hidden">
    <main class="flex-1 relative z-0 overflow-y-auto focus:outline-none" tabindex="0">
      <div class="py-6">
        <Router {routes} />
      </div>
    </main>
  </div>
</div>

<Modal show={showModal}>
  <div>
    <h3 class="text-2xl leading-6 font-medium text-gray-900">
    {#if hasRunBefore}
      Enter Password
    {:else}
      Create Password
    {/if}
    </h3>
    <div class="mt-4">
      {#if !hasRunBefore}
        <p class="mb-1">Please setup a password that is used to securely encrypt your settings such as api keys.</p>
        <p class="mb-1">You will be prompted for this password everytime you run Domain Genie.</p>
        <p class="mb-1">This helps to keep your API keys safe and only usable by this app.</p>
        <p class="mb-1"><b>Warning:</b> Due to the secure nature of this you will not be able to change this password later.</p>
      {/if}
      <div class:mt-4={!hasRunBefore}>
        <input type="password" class="block mb-2 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-600 focus:border-gray-600" 
                on:keyup={handleEncryptionKey} bind:this={passwordInput} />
      </div>
      {#if passwordError}
        <p class="text-red-500 mb-2">Invalid Password! Please try again.</p>
      {/if}
      <p class="text-sm text-gray-500">Press enter to submit</p>
    </div>
  </div>
</Modal>