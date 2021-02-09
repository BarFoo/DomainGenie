/**
 * This is a child process that handles checking registrar keys are valid.
 * It is setup as a forked child process due to the invariable amount of
 * time these can take and so to stop blocking the main thread with long
 * awaits.
 */
import clientNames from "../clients/clientNames";
import clientFactory from "../clients/clientFactory";

async function doCheck(client) {
  const registrar = client.getName();
  let isValid;
  try {
    await client.check();
    // If it gets here, it means this registrar is successful
    isValid = true;
  } catch (ex) {
    // Any error means the API key is invalid
    isValid = false;
  }

  return {
    isValid,
    registrar,
  };
}

async function checkRegistrars(registrarSettings) {
  if (clientFactory.hasClient(clientNames.GODADDY, registrarSettings)) {
    const goDaddyClient = clientFactory.createClient(
      clientNames.GODADDY,
      registrarSettings
    );
    process.send(await doCheck(goDaddyClient));
  }

  if (clientFactory.hasClient(clientNames.DYNADOT, registrarSettings)) {
    const dynadotClient = clientFactory.createClient(
      clientNames.DYNADOT,
      registrarSettings
    );
    process.send(await doCheck(dynadotClient));
  }
}

/**
 * Delegates incoming messages to the appropriate function call
 */
process.on("message", (registrarSettings) => {
  checkRegistrars(registrarSettings);
});
