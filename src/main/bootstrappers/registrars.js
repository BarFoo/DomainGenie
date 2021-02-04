import GoDaddyClient from "../clients/godaddyApiClient";
import { ipcMain } from "electron";
import { mainFileStore } from "../mainFileStore";

const log = require("electron-log");
const goDaddyClient = new GoDaddyClient();

export default function () {
  /**
   * Responsible for checking registrars to determine if the given registrar settings
   * are valid.
   */
  ipcMain.handle("check-registrars", async (evt, registrarSettings) => {
    log.debug("check-registrars received registrarSettings");
    const gdApiKey = registrarSettings.gdApiKey;
    const gdSecret = registrarSettings.gdSecret;
    let result = {
      totalChecked: 0,
      acceptedClients: [],
      failedClients: [],
    };

    const doCheck = async (client) => {
      const name = client.getName();
      log.debug(`Checking ${name} API keys are valid`);
      try {
        result.totalChecked++;
        await client.check();
        result.acceptedClients.push(name);
        log.debug(`${name} has correct API keys`);
      } catch (ex) {
        log.debug(
          `${name} API keys are invalid or GoDaddy returned an unexpected response`
        );
        result.failedClients.push(name);
      }
    };

    if (
      gdApiKey &&
      gdApiKey.trim() !== "" &&
      gdSecret &&
      gdSecret.trim() !== ""
    ) {
      goDaddyClient.setKeys(
        registrarSettings.gdApiKey,
        registrarSettings.gdSecret
      );

      await doCheck(goDaddyClient);
    }

    return result;
  });

  /**
   * Queries all registrar endpoints for getDomains. All clients must implement
   * the same getDomains method. Yes I know, we should use TypeScript but sadly electron-snowpack
   * doesn't support it yet, and that helped to save me a lot of time when setting up snowpack
   * with Electron initially, to help me get this project of the ground.
   */
  ipcMain.handle("get-all-domains", async () => {
    const registrarSettings = mainFileStore.get("registrarSettings");
    const clientsToCall = [];

    if (
      registrarSettings.gdApiKey !== "" &&
      registrarSettings.gdSecret !== ""
    ) {
      // TODO: Architect a better solution than having to set keys everytime.. this does ensure that we're using the most up to date
      // registrar settings for every request though.. although the keys should rarely ever change.
      goDaddyClient.setKeys(
        registrarSettings.gdApiKey,
        registrarSettings.gdSecret
      );
      clientsToCall.push(goDaddyClient);
    }

    const promises = [];

    clientsToCall.forEach((client) => {
      promises.push(client.getDomains());
    });

    return new Promise((resolution, rejection) => {
      Promise.allSettled(promises).then((results) => {
        let clientIndex = 0;
        const resolutionResult = {
          domains: [],
          rejectedClients: [],
        };
        results.forEach((result) => {
          // TODO: Log rejections / errors?
          // result.value is the axios response
          // Get the original client, which we can use for processing the response
          // to get back a unified schema for persistance
          const client = clientsToCall[clientIndex];
          if (result.status !== "rejected") {
            resolutionResult.domains = [
              ...resolutionResult.domains,
              ...result.value,
            ];
          } else {
            resolutionResult.rejectedClients.push(client.getName());
          }
          clientIndex++;
        });

        // This means they all failed, so we must reject
        if (resolutionResult.rejectedClients.length === clientsToCall.length) {
          rejection("All failed");
          return;
        }

        resolution(resolutionResult);
      });
    });
  });
}
