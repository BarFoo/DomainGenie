const electron = require("electron");
const ipcRenderer = electron.ipcRenderer;
import { get } from "svelte/store";
import { encryptionKey } from "./stores";

export const syncDomains = (db) => {
  return new Promise((resolve, reject) => {
    ipcRenderer
      .invoke("get-all-domains", get(encryptionKey))
      .then((result) => {
        const promises = [];
        const toPut = [];
        let domainsAdded = 0;
        let domainsUpdated = 0;
        result.domains.forEach((registrarDomain) => {
          const promise = db
            .get(registrarDomain.domainName)
            .then((domain) => {
              // Existing domain, update it
              domain = { ...domain, ...registrarDomain };
              toPut.push(domain);
              domainsUpdated++;
            })
            .catch((err) => {
              if (err.name === "not_found") {
                toPut.push(registrarDomain);
                domainsAdded++;
              }
            });

          promises.push(promise);
        });

        Promise.allSettled(promises).then(() => {
          if (toPut.length > 0) {
            db.bulkDocs(toPut).then(() => {
              resolve({
                domainsAdded,
                domainsUpdated,
              });
            });
          } else {
            resolve({
              domainsAdded,
              domainsUpdated,
            });
          }
        });
      })
      .catch(() => {
        // All registrar calls failed. User is likely not connected to the internet.
        syncError = true;
      });
  });
};
