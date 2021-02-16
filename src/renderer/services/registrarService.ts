import type { Domain } from "../database/domain";
import type { RegistrarSettings } from "../interfaces/registrarSettings";
import {
  isSyncingDomains,
  isCheckingRegistrars,
  isUpdatingDomains,
} from "../stores";

/**
 * A service responsible for communicating with the registrar handles in the main process.
 *
 * This is simply a wrapper for different ipc channels.
 */
export default class RegistrarService {
  checkRegistrars(registrarSettings?: RegistrarSettings) {
    isCheckingRegistrars.set(true);
    window.electronApi.send("checkRegistrars", registrarSettings);
  }

  getAllDomains() {
    isSyncingDomains.set(true);
    window.electronApi.send("getAllDomains");
  }

  updateDomains(domains: Domain[], data: any) {
    isUpdatingDomains.set(true);
    window.electronApi.send("updateDomains", domains, data);
  }
}
