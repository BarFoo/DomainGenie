<script lang="ts">
  import { addMessages, init, getLocaleFromNavigator } from "svelte-i18n";
  import en from "./locales/en.json";
  import TailwindCSS from "./TailwindCSS.svelte";
  import Sidebar from "./sidebar/Sidebar.svelte";
  import EnterPassword from "./EnterPassword.svelte";
  import Domains from "./routes/Domains.svelte";
  import Domain from "./routes/Domain.svelte";
  import RegistrarSettings from "./routes/RegistrarSettings.svelte";
  import Router from "svelte-spa-router";
  import Settings from "./routes/Settings.svelte";
  import MarketplaceSettings from "./routes/MarketplaceSettings.svelte";
  import Home from "./routes/Home.svelte";

  const routes = {
    "/": Home,
    "/domains": Domains,
    "/domains/:id": Domain,
    "/registrars": RegistrarSettings,
    "/settings": Settings,
    "/marketplaces": MarketplaceSettings
  };

  function handleExternalLinks(evt) {
    if(evt.target.tagName === "A" && evt.target.classList.contains("external")) {
      evt.preventDefault();
      window.electronApi.openExternal(evt.target.href);
    }
  }

  // @todo Add more locales in the future, dependent on user feedback
  addMessages("en", en);

  init({
    fallbackLocale: "en",
    initialLocale: getLocaleFromNavigator(),
  });

</script>
<TailwindCSS />
<svelte:window on:click={handleExternalLinks} />

<EnterPassword />

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