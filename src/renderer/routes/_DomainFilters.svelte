<script lang="ts">
  import type { DomainFilters } from "../interfaces/domainFilters";
  import { _ } from "svelte-i18n";

  import Dropdown from "../shared/Dropdown.svelte";
  import Radio from "../shared/Radio.svelte";
  import SearchField from "../shared/SearchField.svelte";
  import Checkbox from "../shared/Checkbox.svelte";

  export let filters: DomainFilters;

</script>

<div>
  <h3 class="text-xs uppercase mb-2">{$_("filter_by_name")}</h3>
  <SearchField bind:value={filters.name} />
</div>
<div>
  <h3 class="text-xs uppercase mb-2">{$_("filter_by_name_servers")}</h3>
  <SearchField bind:value={filters.nameServer} />
  <div class="mt-4">
    <Checkbox bind:checked={filters.onlyShowEmptyNameServers}>
      {$_("show_empty_name_servers")}
    </Checkbox>
  </div>
</div>
<div>
  <h3 class="text-xs uppercase mb-2">{$_("by_status")}</h3>
  <div class="mb-2">
    <Checkbox bind:checked={filters.onlyShowNoAutoRenewal}>
      {$_("without_auto_renew")}
    </Checkbox>
  </div>
  <div>
    <Checkbox bind:checked={filters.onlyShowNoPrivacy}>
      {$_("without_privacy")}
    </Checkbox>
  </div>
</div>
<div>
  <h3 class="text-xs uppercase mb-2">{$_("filter_by_dates")}</h3>
  <div class="mb-2">
    <Radio bind:options={filters.expires} value={30}>{$_("expires_within", { values: { days: "30"} })}</Radio>
  </div>
  <div>
    <Radio bind:options={filters.expires} value={60}>{$_("expires_within", { values: { days: "60"} })}</Radio>
  </div>
</div>
<div>
  <h3 class="text-xs uppercase mb-2">{$_("order_by")}</h3>
  <div class="mb-2">
    <Radio bind:options={filters.orderBy} value={"domainName"}>{$_("domain_name")}</Radio>
  </div>
  <div class="mb-2">
    <Radio bind:options={filters.orderBy} value={"expiryDate"}>{$_("expires")}</Radio>
  </div>
  <div>
    <Radio bind:options={filters.orderBy} value={"registrationDate"}>{$_("registered")}</Radio>
  </div>
  <div class="mt-4">
    <Dropdown bind:value={filters.isDescending}>
      {#if filters.orderBy === "domainName"}
        <option value={false} selected={!filters.isDescending}>{$_("ascending")}</option>
        <option value={true} selected={filters.isDescending}>{$_("descending")}</option>
      {:else}
        <option value={false} selected={!filters.isDescending}>{$_("oldest_to_recent")}</option>
        <option value={true} selected={filters.isDescending}>{$_("recent_to_oldest")}</option>
      {/if}
    </Dropdown>
  </div>
</div>