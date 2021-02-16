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
  import { onDestroy, tick } from "svelte";
  import { _ } from "svelte-i18n";
  import { isCheckingRegistrars, isSyncingDomains, isUpdatingDomains, appDatabase, hasSyncCompleted, requiresFirstSync } from "./stores";
  import appNotification from "./appNotification";
  import type { CheckedRegistrarNotification } from "./interfaces/checkRegistrarNotification";
  import { toast } from '@zerodevx/svelte-toast';
  import { successTheme, errorTheme, warningTheme, bottomTheme } from "./toastThemes";
  import type { GetAllDomainsUpdate } from "./interfaces/GetAllDomainsUpdate";
  import type { UpdateDomainsPartial } from "./interfaces/updateDomainsPartial";

  // A toast id of any current on-going operation (sync, updates etc)
  let operationToastId;

  const operationToastOptions = {
    initial: 0,
    progress: 0,
    dismissable: false,
    theme: bottomTheme,
    reversed: true
  };

  // Handle check registrar notification response
  window.electronApi.receive("checkedRegistrar", (result: CheckedRegistrarNotification) => {
    if(result.isValid) {
      toast.push(
        $_("notifications.check_registrar_valid_title", { values: { registrar: result.registrar}}), {
          theme: successTheme
        }
      );
    } else {
      appNotification(
        $_("notifications.check_registrar_invalid_title", { values: { registrar: result.registrar}}),
        $_("notifications.check_registrar_invalid_message", { values: { registrar: result.registrar}})
      );
      toast.push(
        $_("notifications.check_registrar_invalid_title", { values: { registrar: result.registrar}}), 
        {
          theme: errorTheme
        }
      );
    }
  });

  window.electronApi.receive("checkRegistrarsCompleted", () => {
    $isCheckingRegistrars = false;
  });

  window.electronApi.receive("getAllDomainsUpdate", async (result: GetAllDomainsUpdate) => {

    if(!result.isValid) {
      toast.push(
        $_("notifications.sync_domains_rejected_registrar", { values: { registrar: result.registrar}}),
        {
          theme: errorTheme,
          duration: 20000
        }
      );
      return;
    }

    if(result.domains.length === 0) {
      toast.push(
        $_("no_domains", { values: { registrar: result.registrar}}),
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
        $_("notifications.sync_domains_completed_added", { values: { domainsAdded, registrar: result.registrar}}),
        {
          theme: successTheme,
          duration: 10000
        }
      );
    }

    if(domainsUpdated > 0) {
      toast.push(
        $_("notifications.sync_domains_completed_updated", { values: { domainsUpdated, registrar: result.registrar}}),
        {
          theme: successTheme,
          duration: 10000 // This keeps the toast indefinitely
        }
      );
    }
  });

  window.electronApi.receive("getAllDomainsCompleted", async (domainNames: string[]) => {
  
    // This is the only way I know of to wait for an IndexedDB update with Dexie
    // Even if you try awaiting the result here, sometimes a race condition occurs where
    // this reports back faster than the update.
    // Safest way is to sleep to allow time for the update to finish.
    await new Promise((r) => setTimeout(r, 250));

    if(!$requiresFirstSync) {
      const allLocalDomains = await $appDatabase.domains.toArray();
      const toRemove = allLocalDomains
        .filter(d => d && !domainNames.includes(d.domainName))
        .map(d => d.domainName);

      if(toRemove.length > 0) {
        await $appDatabase.domains
          .where("domainName")
          .anyOfIgnoreCase(toRemove)
          .delete();

        toast.push(
          $_("notifications.removed_domains", { values: { totalRemoved: toRemove.length}})
        );
      }
    }

    appNotification(
      $_("notifications.sync_domains_completed_title"),
      $_("notifications.sync_domains_completed_message")
    );
    
    $isSyncingDomains = false;
    $hasSyncCompleted = true;

    if(operationToastId) {
      toast.pop(operationToastId);
      operationToastId = null;
    }
  });

  // Occurs when there are partial results (in this case one domain)
  // to an update request
  window.electronApi.receive("updateDomainsPartial", (partialResult: UpdateDomainsPartial) => {
    if(operationToastId) {
      toast.set(operationToastId, { progress: partialResult.progress});
    }
    if(!partialResult.isValid) {
      toast.push(
        $_("notifications.update_domains_error", { values: { registrar: partialResult.registrar}}),
        {
          theme: errorTheme
        }
      );
    }
  });

  window.electronApi.receive("updateDomainsCompleted", () => {
    toast.pop(operationToastId);
    toast.push($_("all_done"));
    $isUpdatingDomains = false;
  });

  $: { 
    if($isSyncingDomains) {
      operationToastId = toast.push(
        `${$_("notifications.sync_domains_in_progress")}`,
        operationToastOptions
      );
    } else if($isUpdatingDomains) {
      operationToastId = toast.push(
        `${$_("notifications.update_domains_in_progress")}`,
        operationToastOptions
      );
    }
  }

  onDestroy(() => {
    window.electronApi.stopListening("checkedRegistrar");
    window.electronApi.stopListening("checkedRegistrarsCompleted");
    window.electronApi.stopListening("getAllDomainsUpdate");
    window.electronApi.stopListening("getAllDomainsCompleted");
    window.electronApi.stopListening("updateDomainsPartial");
    window.electronApi.stopListening("updateDomainsCompleted");
  });

</script>