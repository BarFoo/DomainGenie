<script lang="ts">
  import type { DomainFilters } from "../interfaces/domainFilters";
  import { _ } from "svelte-i18n";

  import Dropdown from "../shared/Dropdown.svelte";
  import Radio from "../shared/Radio.svelte";
  import SearchField from "../shared/SearchField.svelte";

  export let filters: DomainFilters;
</script>

<div>
  <h3 class="text-xs uppercase mb-2">{$_("filter_by_name")}</h3>
  <SearchField bind:value={filters.name} />
</div>
<div>
  <h3 class="text-xs uppercase mb-2">{$_("filter_by_dates")}</h3>
  <div class="mb-2">
    <Radio bind:options={filters.expires} value={30}>{$_("expires_within", { values: { days: "30"} })}</Radio>
  </div>
  <div class="mb-2">
    <Radio bind:options={filters.expires} value={60}>{$_("expires_within", { values: { days: "60"} })}</Radio>
  </div>
  <div class="mb-2">
    <Radio bind:options={filters.expires} value={90}>{$_("expires_within", { values: { days: "90"} })}</Radio>
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
  <div class="mb-2">
    <Radio bind:options={filters.orderBy} value={"registrationDate"}>{$_("registered")}</Radio>
  </div>
  <div class="mt-4">
    <Dropdown bind:value={filters.isDescending}>
      <option value={false}>{$_("ascending")}</option>
      <option value={true}>{$_("descending")}</option>
    </Dropdown>
  </div>
</div>