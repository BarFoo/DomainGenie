import { ipcMain, app } from "electron";
import { mainFileStore } from "../mainFileStore";
import type { RegistrarSettings } from "../interfaces/registrarSettings";
import clientFactory from "../clients/clientFactory";
import { checkRegistrars } from "./checkRegistrars";
import { getAllDomains } from "./getAllDomains";
import { updateDomains } from "./updateDomains";
import type { Domain } from "../interfaces/domain";
import type { DomainUpdate } from "../interfaces/domainUpdate";

export default function () {
  function createClients(registrarSettings: RegistrarSettings) {
    const clients = [];
    if (clientFactory.hasClient("godaddy", registrarSettings)) {
      clients.push(clientFactory.createClient("godaddy", registrarSettings));
    }
    if (clientFactory.hasClient("dynadot", registrarSettings)) {
      clients.push(clientFactory.createClient("dynadot", registrarSettings));
    }
    if (clientFactory.hasClient("namesilo", registrarSettings)) {
      clients.push(clientFactory.createClient("namesilo", registrarSettings));
    }
    return clients;
  }

  /**
   * Responsible for checking registrars to determine if the given registrar settings
   * are valid. This essentially calls the underlying registrar child process.
   */
  ipcMain.on("checkRegistrars", (evt, registrarSettings: RegistrarSettings) => {
    const clients = createClients(registrarSettings);
    checkRegistrars(clients, (result) => {
      // Per registrar callback
      evt.reply("checkedRegistrar", result);
    }).then(() => {
      // When all have been checked
      evt.reply("checkRegistrarsCompleted");
    });
  });

  /**
   * Perhaps a confusing name, this does get all domains from all registrars
   * but doesn't immediately return them, or else the main thread could be blocked
   * for a while. Renderer should listen in for the getAllDomainsCompleted
   * channel to get the results of this operation.
   */
  ipcMain.on("getAllDomains", (evt) => {
    const registrarSettings = mainFileStore.get("registrarSettings");
    const clients = createClients(registrarSettings);

    getAllDomains(clients, (result) => {
      // Per registrar update
      evt.reply("getAllDomainsUpdate", result);
    }).then((allDomainNames) => {
      // When all have been imported
      evt.reply("getAllDomainsCompleted", allDomainNames);
    });
  });

  ipcMain.on("updateDomains", (evt, domains: Domain[], data: DomainUpdate) => {
    const registrarSettings = mainFileStore.get("registrarSettings");
    const clients = createClients(registrarSettings);

    const partialCallback = (result) => {
      evt.reply("updateDomainsPartial", result);
    };

    const registrarCallback = (result) => {
      evt.reply("updateDomainsRegistrar", result);
    };

    updateDomains(
      clients,
      domains,
      data,
      partialCallback,
      registrarCallback
    ).then(() => {
      evt.reply("updateDomainsCompleted");
    });
  });
}
