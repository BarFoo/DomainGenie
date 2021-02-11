<script lang="ts">
  /**
   * @todo I really don't like this approach of a component being responsible for handling
   * all incoming notifications. But it feels like the cleanest way at the moment.
   * 
   * 
   * Handles incoming notifications from the main process. This HAS to be its own component 
   * at the very root of App.svelte, so its essentially always available to pick up the messages, 
   * since individual components can be destroyed/unmounted we would lose the events.
  */
  import { _ } from "svelte-i18n";
  import { isCheckingRegistrars, isSyncingDomains, appDatabase, hasSyncCompleted } from "./stores";
  import appNotification from "./appNotification";
  import type { CheckedRegistrarNotification } from "./interfaces/checkRegistrarNotification";
  import { toast } from '@zerodevx/svelte-toast';
  import { successTheme, errorTheme, warningTheme } from "./toastThemes";
  import type { GetAllDomainsUpdate } from "./interfaces/getAllDomainsUpdate"

  // Handle check registrar notification response
  window.electronApi.receive("checkedRegistrar", (result: CheckedRegistrarNotification) => {
    if(result.isValid) {
      toast.push(`${$_("notifications.check_registrar_valid_title", { values: { registrar: result.registrar}})}`, {
        theme: successTheme
      });
    } else {
      console.log(result.exception);
      appNotification(
        $_("notifications.check_registrar_invalid_title", { values: { registrar: result.registrar}}),
        $_("notifications.check_registrar_invalid_message", { values: { registrar: result.registrar}})
      );
      toast.push(
        `${$_("notifications.check_registrar_invalid_title", { values: { registrar: result.registrar}})}`, 
        {
          theme: errorTheme
        }
      );
    }
  });

  window.electronApi.receive("checkRegistrarsComplete", () => {
    console.log("Check Registrars Complete");
    $isCheckingRegistrars = false;
  });

  window.electronApi.receive("getAllDomainsUpdate", async (result: GetAllDomainsUpdate) => {

    if(!result.isValid) {
      console.log(result.error);
      toast.push(
        `${$_("notifications.sync_domains_rejected_registrar", { values: { registrar: result.registrar}})}`,
        {
          theme: errorTheme,
          duration: 20000
        }
      );
      return;
    }

    if(result.domains.length === 0) {
      toast.push(
        `${$_("no_domains", { values: { registrar: result.registrar}})}`,
        {
          theme: warningTheme,
          duration: 10000
        }
      );
      return;
    }

    // We have to convert dates here because the communication between child process
    // and electron serializes the dates given to strings.
    result.domains.map(d => {
      d.expiryDate = new Date(d.expiryDate);
      d.registrationDate = new Date(d.registrationDate);
      if(d.transferEligibilityDate) {
        d.transferEligibilityDate = new Date(d.transferEligibilityDate);
      }
    });

    const beforeCount = await $appDatabase.domains.where("registrar").equals(result.registrar).count();
    await $appDatabase.domains.bulkPut(result.domains);
    const afterCount = await $appDatabase.domains.where("registrar").equals(result.registrar).count();

    const domainsAdded = afterCount - beforeCount;
    const domainsUpdated = afterCount - domainsAdded;

    if(domainsAdded > 0) {
      toast.push(
        `${$_("notifications.sync_domains_completed_added", { values: { domainsAdded, registrar: result.registrar}})}`,
        {
          theme: successTheme,
          duration: 20000 // This keeps the toast indefinitely
        }
      );
    }

    if(domainsUpdated > 0) {
      toast.push(
        `${$_("notifications.sync_domains_completed_updated", { values: { domainsUpdated, registrar: result.registrar}})}`,
        {
          theme: successTheme,
          duration: 20000 // This keeps the toast indefinitely
        }
      );
    }
  });

  window.electronApi.receive("getAllDomainsCompleted", () => {
    
    appNotification(
      `${$_("notifications.sync_domains_completed_title")}`,
      `${$_("notifications.sync_domains_completed_message")}`
    );
    
    $isSyncingDomains = false;
    $hasSyncCompleted = true;
  });

</script>