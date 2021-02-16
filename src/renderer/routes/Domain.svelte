<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import Router, { link } from "svelte-spa-router";
  import Icon from "../shared/Icon.svelte";
  import SideMenuItem from "../shared/SideMenuItem.svelte";
  import { appDatabase, singleDomainEdit } from "../stores";
  import DomainContacts from "./DomainContacts.svelte"; 
  import DomainNameServers from "./DomainNameServers.svelte";
  import DomainOverview from "./DomainOverview.svelte";
  import Layout from "./_Layout.svelte";

  // Route params, which contains the domain name to show here
  export let params;

  const routes = {
    "/": DomainOverview,
    "/name-servers": DomainNameServers,
    "/contacts": DomainContacts
  };

  let isLoading: boolean = true;
  let domain;

  onMount(async () => {
    domain = await $appDatabase.domains.get(params.name);
    isLoading = false;

    $singleDomainEdit = domain;
  });

</script>

<Layout heading={params.name}>
  <div slot="headerRight">
    <a href="/domains" use:link class="block text-white leading-8 pt-2">
      <Icon name="arrowLeft" class="fill-current align-middle inline"></Icon>
      {$_("back_to_domains")}
    </a>
  </div>
  {#if !isLoading && domain == null}
    <div class="py-6 px-5">
      <h2>{$_("not_found")}</h2>
      <p>{$_("not_found_message")}</p>
    </div>
  {:else if !isLoading}
    <div class="divide-gray-200 flex flex-grow divide-x">
      <aside class="domain-menu py-6">
        <nav>
          <SideMenuItem href={`/domains/${params.name}/`} iconName="dashboard">{$_("overview")}</SideMenuItem>
          <SideMenuItem href={`/domains/${params.name}/name-servers`} iconName="server">{$_("name_servers")}</SideMenuItem>
          <SideMenuItem href={`/domains/${params.name}/contacts`} iconName="contacts">{$_("contacts")}</SideMenuItem>
        </nav>
      </aside>
      <div class="col-span-9 flex-grow">
        <Router {routes} prefix={/^\/domains\/[a-zA-Z\.]+/} />
      </div>
    </div>
  {/if}
</Layout>

<style>
  .domain-menu {
    flex-basis: 25%;
  }
</style>