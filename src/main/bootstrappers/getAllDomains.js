import clientNames from "../clients/clientNames";
import clientFactory from "../clients/clientFactory";

async function getAllDomains(registrarSettings) {
  const clientsToCall = [];

  if (clientFactory.hasClient(clientNames.GODADDY, registrarSettings)) {
    const goDaddyClient = clientFactory.createClient(
      clientNames.GODADDY,
      registrarSettings
    );
    clientsToCall.push(goDaddyClient);
  }

  if (clientFactory.hasClient(clientNames.DYNADOT, registrarSettings)) {
    const dynadotClient = clientFactory.createClient(
      clientNames.DYNADOT,
      registrarSettings
    );
    clientsToCall.push(dynadotClient);
  }

  if (clientFactory.hasClient(clientNames.NAMESILO, registrarSettings)) {
    const namesiloClient = clientFactory.createClient(
      clientNames.NAMESILO,
      registrarSettings
    );
    clientsToCall.push(namesiloClient);
  }

  for (const client of clientsToCall) {
    const result = {
      domains: [],
      isValid: false,
      error: null,
      registrar: client.getName(),
    };
    try {
      const domains = await client.getDomains();
      // If it gets and doesn't throw it means we got the domain successfully
      domains.forEach((domain) => result.domains.push(domain));
      result.isValid = true;
    } catch (ex) {
      result.isValid = false;
      result.error = ex;
    }
    process.send(result);
  }

  process.send({ _completed: true });
}

process.on("message", (registrarSettings) => {
  getAllDomains(registrarSettings);
});
