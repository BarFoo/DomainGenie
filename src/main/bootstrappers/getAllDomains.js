import clientNames from "../clients/clientNames";
import clientFactory from "../clients/clientFactory";

async function getAllDomains(registrarSettings) {
  const clientsToCall = [];
  const result = {
    domains: [],
    rejectedClients: [],
  };

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

  for (const client of clientsToCall) {
    try {
      const domains = await client.getDomains();
      // If it gets and doesn't throw it means we got the domain successfully
      domains.forEach((domain) => result.domains.push(domain));
    } catch (ex) {
      result.rejectedClients.push(client.getName());
    }
  }

  process.send(result);
}

process.on("message", (registrarSettings) => {
  getAllDomains(registrarSettings);
});
