<script lang="ts">
  import { _ } from "svelte-i18n";
</script>

<div class="max-w-7xl mx-auto px-4">
  <h1 class="text-2xl font-semibold text-gray-900 mb-4">{$_("welcome")}</h1>
  <p>{$_("please_enter_password")}</p>
</div>