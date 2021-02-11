<script lang="ts">
  import Navbar from "../navbar/Navbar.svelte";
  import NavbarItem from "../navbar/NavbarItem.svelte";
  import { _ } from "svelte-i18n";

  export let heading: string;
</script>

<div class="min-h-screen bg-gray-100">
  <div class="pb-32 bg-steel-700 text-white">
    <Navbar>
      <NavbarItem iconName="domains" title={$_("domains_tooltip")} to="/domains" activePath="/domains(.*)$">{$_("domains")}</NavbarItem>
      <NavbarItem iconName="registrars" title={$_("registrars_tooltip")} to="/registrars" activePath="/registrars">{$_("registrars")}</NavbarItem>
      <NavbarItem iconName="settings" title={$_("settings_tooltip")} to="/settings" activePath="/settings">{$_("settings")}</NavbarItem>
    </Navbar>
    <header class="py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex">
          <h1 class="flex-grow text-3xl font-bold">
            {heading}
          </h1>
          <slot name="headerRight" />
        </div>
      </div>
    </header>
  </div>
  <main class="-mt-32">
    <div class="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
      <div class="bg-white rounded-lg shadow main-container flex flex-col text-gray-500">
        <slot></slot>
      </div>
    </div>
  </main>
</div>

<style>
  .main-container {
    min-height: calc(100vh - 200px);
  }
</style>