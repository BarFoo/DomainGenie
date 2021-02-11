import updateOperations from "../clients/updateOperations";
import clientNames from "../clients/clientNames";
import clientFactory from "../clients/clientFactory";

async function updateDomains(domains, registrarSettings, operationName) {
  const clientsToCall = [];
  let operation;

  switch (operationName) {
    case "nameservers":
      operation = updateOperations.NAMESERVERS;
      break;
    case "contacts":
      operation = updateOperations.CONTACTS;
      break;
    case "privacy":
      operation = updateOperations.PRIVACY;
      break;
    case "autorenew":
      operation = updateOperations.AUTORENEW;
      break;
    default:
      operation = updateOperations.ALL;
      break;
  }

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

  const totalDomains = domains.length;
  let totalProcessed = 0;

  for (const client of clientsToCall) {
    const registrar = client.getName();
    const filteredDomains = domains.filter((d) => d.registrar === registrar);

    if (filteredDomains.length === 0) {
      continue;
    }

    let result = {
      acceptedDomains: [],
      rejectedDomains: [],
    };

    try {
      result = await client.updateDomains(
        filteredDomains,
        operation,
        (partialResult) => {
          // Append total progress to the outgoing result
          totalProcessed++;
          partialResult.totalProcessed = totalProcessed;
          partialResult.progress = (totalProcessed / totalDomains) * 100;
          process.send({
            _partialUpdate: true,
            partialResult,
          });
        }
      );
    } catch (ex) {
      result.isValid = false;
      console.error(ex);
    }
    process.send(result);
  }

  process.send({ _completed: true });
}

process.on("message", (data) => {
  updateDomains(data.domains, data.registrarSettings, data.operationName);
});
