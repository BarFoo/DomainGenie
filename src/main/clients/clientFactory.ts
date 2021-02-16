import DynadotClient from "./dynadotClient";
import GoDaddyClient from "./godaddyClient";
import NamesiloClient from "./namesiloClient";
import type { RegistrarSettings } from "../interfaces/registrarSettings";

/**
 * Responsible for creating client instances with necessary data.
 */
class ClientFactory {
  createClient(name: string, registrarSettings: RegistrarSettings) {
    let client;
    switch (name) {
      case "godaddy":
        client = new GoDaddyClient({
          apiKey: registrarSettings.gdApiKey,
          secret: registrarSettings.gdSecret,
        });
        break;
      case "dynadot":
        client = new DynadotClient({
          apiKey: registrarSettings.dynadotApiKey,
        });
        break;
      case "namesilo":
        client = new NamesiloClient({
          apiKey: registrarSettings.nameSiloApiKey,
        });
        break;
      default:
        throw Error("Given client name is invalid!");
    }

    return client;
  }

  hasClient(name: string, registrarSettings: RegistrarSettings) {
    let hasClient: boolean = false;
    switch (name) {
      case "godaddy":
        hasClient =
          registrarSettings.gdApiKey &&
          registrarSettings.gdApiKey.trim() !== "" &&
          registrarSettings.gdSecret &&
          registrarSettings.gdSecret.trim() !== "";
        break;
      case "dynadot":
        hasClient =
          registrarSettings.dynadotApiKey &&
          registrarSettings.dynadotApiKey.trim() !== "";
        break;
      case "namesilo":
        hasClient =
          registrarSettings.nameSiloApiKey &&
          registrarSettings.nameSiloApiKey.trim() !== "";
        break;
    }
    return hasClient;
  }
}

export default new ClientFactory();
