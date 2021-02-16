<script lang="ts">
  import { _ } from "svelte-i18n";
  import Button from "../shared/Button.svelte";
  import Layout from "./_Layout.svelte";
</script>

<Layout heading={$_("settings")}>
  <div slot="headerRight">
    <Button 
      type="primary"
      size="large"
      iconName="sync" 
      disabled={true}>
      {$_("save_changes")}
    </Button>
  </div>
</Layout>