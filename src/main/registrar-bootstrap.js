import GoDaddyClient from "./clients/godaddy-api-client";
import { ipcMain } from "electron";
const Store = require("electron-store");

const goDaddyClient = new GoDaddyClient();

function getRegistrarSettings(encryptionKey) {
  const store = new Store({
    encryptionKey,
  });
  const registrarSettings = store.get("registrarSettings");

  if (registrarSettings === undefined || registrarSettings === null) {
    throw new Error("Registrar settings have not been defined yet!");
  }

  return registrarSettings;
}

export default function () {
  ipcMain.handle("check-registrars", async (evt, encryptionKey) => {
    const registrarSettings = getRegistrarSettings(encryptionKey);
    const promises = [];
    const gdApiKey = registrarSettings.gdApiKey;
    const gdSecret = registrarSettings.gdSecret;
    const clientsToCall = [];

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
      clientsToCall.push(goDaddyClient);
    }

    return new Promise((resolution, rejection) => {
      clientsToCall.forEach((client) => {
        promises.push(client.check());
      });
      Promise.allSettled(promises).then((results) => {
        let passed = 0;
        const failed = [];
        const accepted = [];
        let clientIndex = 0;
        results.forEach(function (result) {
          if (result.status !== "rejected") {
            passed++;
            accepted.push(clientsToCall[clientIndex].getName());
          } else {
            failed.push(clientsToCall[clientIndex].getName());
          }
          clientIndex++;
        });

        // 0 passed means all failed, reject completely
        if (passed === 0) {
          rejection("All failed");
        } else {
          // Let the consumer know which ones passed and which didn't
          resolution({
            passed: passed,
            total: clientsToCall.length,
            accepted,
            failed,
          });
        }
      });
    });
  });

  /**
   * Queries all registrar endpoints for getDomains. All clients must implement
   * the same getDomains method. Yes I know, we should use TypeScript but sadly electron-snowpack
   * doesn't support it yet, and that helped to save me a lot of time when setting up snowpack
   * with Electron initially, to help me get this project of the ground.
   */
  ipcMain.handle("get-all-domains", async (evt, encryptionKey) => {
    const registrarSettings = getRegistrarSettings(encryptionKey);
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
          rejection();
          return;
        }

        resolution(resolutionResult);
      });
    });
  });
}
