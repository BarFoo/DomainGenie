<script lang="ts">
  import SidebarItem from "./SidebarItem.svelte";
</script>

<div class="bg-steel-700 flex flex-shrink-0">
  <div class="flex flex-col w-48">
    <div class="flex flex-col h-0 flex-1">
        <div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav class="flex-1 px-2 space-y-1">
            <SidebarItem iconName="domains" title="View all your domains" to="/domains">Domains</SidebarItem>
            <SidebarItem iconName="registrars" title="Configure registrar settings" to="/registrars">Registrars</SidebarItem>
            <SidebarItem iconName="marketplaces" title="Configure marketplace settings" to="/marketplaces">Marketplaces</SidebarItem>
            <SidebarItem iconName="settings" title="Manage general app settings" to="/settings">Settings</SidebarItem>
          </nav>
        </div>
    </div>
  </div>
</div>