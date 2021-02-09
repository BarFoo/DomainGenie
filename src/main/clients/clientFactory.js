import DynadotClient from "./dynadotClient";
import GoDaddyClient from "./godaddyClient";
import NamesiloClient from "./namesiloClient";
import clientNames from "./clientNames";
import NamecheapClient from "./namecheapClient";
/**
 * Responsible for creating client instances with necessary data.
 */
class ClientFactory {
  createClient(name, registrarSettings) {
    // This is very simple for now but allows us to abstract out the
    // client instances
    let client;
    switch (name) {
      case clientNames.GODADDY:
        client = new GoDaddyClient({
          apiKey: registrarSettings.gdApiKey,
          secret: registrarSettings.gdSecret,
        });
        break;
      case clientNames.DYNADOT:
        client = new DynadotClient({
          apiKey: registrarSettings.dynadotApiKey,
        });
        break;
      case clientNames.NAMESILO:
        client = new NamesiloClient({
          apiKey: registrarSettings.nameSiloApiKey,
        });
        break;
      case clientNames.NAMECHEAP:
        client = new NamecheapClient({
          apiKey: registrarSettings.namecheapKey,
          apiUser: registrarSettings.namecheapUser,
        });
        break;
      default:
        throw Error("Given client name is invalid!");
    }

    return client;
  }

  hasClient(name, registrarSettings) {
    let hasClient;
    switch (name) {
      case clientNames.GODADDY:
        hasClient =
          registrarSettings.gdApiKey &&
          registrarSettings.gdApiKey.trim() !== "" &&
          registrarSettings.gdSecret &&
          registrarSettings.gdSecret.trim() !== "";
        break;
      case clientNames.DYNADOT:
        hasClient =
          registrarSettings.dynadotApiKey &&
          registrarSettings.dynadotApiKey.trim() !== "";
        break;
      case clientNames.NAMESILO:
        hasClient =
          registrarSettings.nameSiloApiKey &&
          registrarSettings.nameSiloApiKey.trim() !== "";
        break;
      case clientNames.NAMECHEAP:
        hasClient =
          registrarSettings.namecheapKey &&
          registrarSettings.namecheapKey.trim() !== "" &&
          registrarSettings.namecheapUser &&
          registrarSettings.namecheapUser.trim() !== "";
        break;
    }
    return hasClient;
  }
}

export default new ClientFactory();
