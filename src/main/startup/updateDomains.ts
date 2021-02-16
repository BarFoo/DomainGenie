import type { RegistrarClient } from "../clients/registrarClient";
import type { Domain } from "../interfaces/domain";
import type { DomainUpdate } from "../interfaces/domainUpdate";

/**
 * Handles updating domains via the given registrar clients.
 * @param clients Registrar clients to call
 * @param domains Domains to update
 * @param data Supporting update data
 * @param partialCallback A callback triggered after each partial update, typically once per domain or chunk
 * @param registrarCallback A callback triggered when updating for a given registrar client is complete
 */
export async function updateDomains(
  clients: RegistrarClient[],
  domains: Domain[],
  data: DomainUpdate,
  partialCallback: Function,
  registrarCallback: Function
) {
  const totalDomains = domains.length;
  let totalProcessed = 0;

  const promises = [];

  for (const client of clients) {
    const registrar = client.getName();
    const filteredDomains = domains.filter((d) => d.registrar === registrar);

    if (filteredDomains.length === 0) {
      continue;
    }

    promises.push(
      client
        .updateDomains(
          filteredDomains.map((d) => d.domainName),
          data,
          (domainName) => {
            // Append total progress to the outgoing result
            totalProcessed++;
            const partialResult = {
              domainName,
              totalProcessed,
              progress: (totalProcessed / totalDomains),
              isValid: true,
            };
            partialCallback(partialResult);
          }
        )
        .then(() => {
          registrarCallback(registrar);
          return Promise.resolve(true);
        })
        .catch((err) => {
          totalProcessed += filteredDomains.length;
          partialCallback({
            totalProcessed,
            progress: (totalProcessed / totalDomains),
            isValid: false,
            registrar,
          });
        })
    );
  }

  await Promise.allSettled(promises);
}
