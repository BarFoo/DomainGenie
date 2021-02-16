import type { RegistrarClient } from "../clients/registrarClient";

async function doCheck(client) {
  const registrar = client.getName();
  let isValid;
  try {
    await client.validateKeys();
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

export async function checkRegistrars(
  clients: RegistrarClient[],
  registrarCallback: Function
) {
  for (const client of clients) {
    const result = await doCheck(client);
    registrarCallback(result);
  }
}
