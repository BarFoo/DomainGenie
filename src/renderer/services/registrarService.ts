import type { AppDatabase } from "../database/appDatabase";
import type { Domain } from "../database/domain";
import type { CheckRegistrarsResult } from "../interfaces/checkRegistrarsResultsult";
import type { GetAllDomainsResult } from "../interfaces/getAllDomainsResultsult";
import type { RegistrarSettings } from "../interfaces/registrarSettingsings";
import type { SyncDomainsResult } from "../interfaces/syncDomainsResultsult";

/**
 * A service responsible for communicating with the registrar handles in the main process.
 *
 * This is simply a wrapper for different ipc channels.
 */
export default class RegistrarService {
  db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  checkRegistrars(
    registrarSettings?: RegistrarSettings
  ): Promise<CheckRegistrarsResult> {
    return window.electronApi.invoke("check-registrars", registrarSettings);
  }

  async syncDomains(): Promise<SyncDomainsResult> {
    const getAllDomainsResult = await window.electronApi.invoke<GetAllDomainsResult>(
      "get-all-domains"
    );

    const result: SyncDomainsResult = {
      domainsAdded: 0,
      domainsUpdated: 0,
      rejectedClients: getAllDomainsResult.rejectedClients,
    };

    // Get the count before we put, and the count after so that we can determine how many were updated
    // and how many were imported.
    const beforeCount = await this.db.domains.count();
    await this.db.domains.bulkPut(getAllDomainsResult.domains);
    const afterCount = await this.db.domains.count();

    result.domainsAdded = afterCount - beforeCount;
    result.domainsUpdated = afterCount - result.domainsAdded;

    return result;
  }
}
