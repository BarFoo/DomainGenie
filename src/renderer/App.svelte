<script lang="ts">
  import { addMessages, init, getLocaleFromNavigator } from "svelte-i18n";
  import en from "./locales/en.json";
  import TailwindCSS from "./TailwindCSS.svelte";
  import EnterPassword from "./EnterPassword.svelte";
  import Domains from "./routes/Domains.svelte";
  import Domain from "./routes/Domain.svelte";
  import RegistrarSettings from "./routes/RegistrarSettings.svelte";
  import Router from "svelte-spa-router";
  import Settings from "./routes/Settings.svelte";
  import MarketplaceSettings from "./routes/MarketplaceSettings.svelte";
  import Home from "./routes/Home.svelte";
  import NotFound from "./routes/NotFound.svelte";

  const routes = {
    "/": Home,
    "/domains": Domains,
    "/domains/:name": Domain,
    "/domains/:name/*": Domain,
    "/registrars": RegistrarSettings,
    "/settings": Settings,
    "/marketplaces": MarketplaceSettings,
    "*": NotFound
  };

  function handleExternalLinks(evt) {
    if(evt.target.tagName === "A" && evt.target.classList.contains("external")) {
      evt.preventDefault();
      window.electronApi.openExternalLink(evt.target.href);
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

<Router {routes} />

<style global>
  :global(html), :global(body) {
    @apply bg-gray-100;
    height: 100%;
    min-height: 100%;
    box-sizing: border-box;
    margin: 0;
  }

  :global(a.active) {
    @apply bg-steel-800;
    @apply text-white;
  }

  a {
    @apply text-steel-700;
  }
</style>