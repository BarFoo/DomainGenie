import { ipcMain } from "electron";
import { mainFileStore } from "../mainFileStore";
import GoDaddyClient from "../clients/godaddyClient";
import DynadotClient from "../clients/dynadotClient";

const log = require("electron-log");

export default function () {
  /**
   * Responsible for checking registrars to determine if the given registrar settings
   * are valid.
   */
  ipcMain.handle("check-registrars", async (evt, registrarSettings) => {
    const gdApiKey = registrarSettings.gdApiKey;
    const gdSecret = registrarSettings.gdSecret;
    const dynadotApiKey = registrarSettings.dynadotApiKey;
    let result = {
      totalChecked: 0,
      acceptedClients: [],
      failedClients: [],
    };

    const doCheck = async (client) => {
      const name = client.getName();
      try {
        result.totalChecked++;
        await client.check();
        result.acceptedClients.push(name);
      } catch (ex) {
        log.error(
          `${name} api keys are invalid or returned an unexpected response`
        );
        log.error(ex);
        result.failedClients.push(name);
      }
    };

    if (
      gdApiKey &&
      gdApiKey.trim() !== "" &&
      gdSecret &&
      gdSecret.trim() !== ""
    ) {
      const goDaddyClient = new GoDaddyClient({
        apiKey: gdApiKey,
        secret: gdSecret,
      });

      await doCheck(goDaddyClient);
    }

    if (dynadotApiKey && dynadotApiKey.trim() !== "") {
      const dynadotClient = new DynadotClient({
        apiKey: dynadotApiKey,
      });

      await doCheck(dynadotClient);
    }

    return result;
  });

  /**
   * Queries all registrar endpoints for getDomains. All clients must implement
   * the same getDomains method. Yes I know, we should use TypeScript but sadly electron-snowpack
   * doesn't support it yet, and that helped to save me a lot of time when setting up snowpack
   * with Electron initially.
   */
  ipcMain.handle("get-all-domains", async () => {
    const registrarSettings = mainFileStore.get("registrarSettings");
    const clientsToCall = [];

    if (
      registrarSettings.gdApiKey !== "" &&
      registrarSettings.gdSecret !== ""
    ) {
      const goDaddyClient = new GoDaddyClient({
        apiKey: registrarSettings.gdApiKey,
        secret: registrarSettings.gdSecret,
      });
      clientsToCall.push(goDaddyClient);
    }

    if (
      registrarSettings.dynadotApiKey &&
      registrarSettings.dynadotApiKey.trim() !== ""
    ) {
      const dynadotClient = new DynadotClient({
        apiKey: registrarSettings.dynadotApiKey,
      });

      clientsToCall.push(dynadotClient);
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
