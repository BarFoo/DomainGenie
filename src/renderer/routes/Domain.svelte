<script lang="ts">
  /* @todo Possibly add a loader, but with it being all local its insanely fast */
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import Router, { link, push } from "svelte-spa-router";
  import Icon from "../shared/Icon.svelte";
  import SideMenuItem from "../shared/SideMenuItem.svelte";
  import { registrarService, appDatabase } from "../stores";
  import DomainContacts from "./DomainContacts.svelte"; 
  import DomainNameServers from "./DomainNameServers.svelte";
  import Layout from "./_Layout.svelte";

  const routes = {
    "/": DomainNameServers,
    "/contacts": DomainContacts
  };

  // Route params, which contains the domain name to show here
  export let params;

  let domain;

  onMount(async () => {
    domain = await $appDatabase.domains.get(params.name);

    if(domain == null) {
      // This is unlikely to happen, but just in case the user is viewing an old list..
      push("/domains");
      return;
    }
  });

</script>

<Layout heading={params.name}>
  <div slot="headerRight">
    <a href="/domains" use:link class="block text-white leading-8 pt-2">
      <Icon name="arrowLeft" class="fill-current align-middle inline"></Icon>
      {$_("back_to_domains")}
    </a>
  </div>
  <div class="divide-gray-200 flex flex-row flex-grow divide-x">
    <aside class="domain-menu py-6">
      <nav>
        <SideMenuItem href={`/domains/${params.id}`} iconName="server">{$_("name_servers")}</SideMenuItem>
        <SideMenuItem href={`/domains/${params.id}/contacts`} iconName="contacts">{$_("contacts")}</SideMenuItem>
      </nav>
    </aside>

    <form class="divide-y divide-gray-200 col-span-9">
      <Router {routes} prefix={/^\/domains\/[a-z\.]+/} />
    </form>
  </div>
</Layout>

<style>
  .domain-menu {
    flex-basis: 25%;
  }
</style>