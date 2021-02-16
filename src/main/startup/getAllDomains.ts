import type { RegistrarClient } from "../clients/registrarClient";

export async function getAllDomains(
  clients: RegistrarClient[],
  registrarCallback: Function
) {
  // All domain names that get retrieved.. intended to be passed back
  // to the completed event. Domain names only! This helps to keep
  // the memory down as much as possible when there could be 10,000+
  // domains that someone is managing.
  const allDomainNames = [];

  for (const client of clients) {
    const result = {
      domains: [],
      isValid: false,
      error: null,
      registrar: client.getName(),
    };

    try {
      const domains = await client.getDomains();
      domains.forEach((domain) => {
        result.domains.push(domain);
        allDomainNames.push(domain.domainName);
      });
      result.isValid = true;
    } catch (ex) {
      result.isValid = false;
    }

    registrarCallback(result);
  }

  return allDomainNames;
}
