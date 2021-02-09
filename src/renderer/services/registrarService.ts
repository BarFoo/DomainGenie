import type { RegistrarSettings } from "../interfaces/registrarSettings";

/**
 * A service responsible for communicating with the registrar handles in the main process.
 *
 * This is simply a wrapper for different ipc channels.
 */
export default class RegistrarService {
  checkRegistrars(registrarSettings?: RegistrarSettings) {
    window.electronApi.send("checkRegistrars", registrarSettings);
  }

  getAllDomains() {
    window.electronApi.send("getAllDomains");
  }
}
