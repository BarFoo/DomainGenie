import type { Domain } from "../database/domain";

export interface GetAllDomainsResult {
  domains: Domain[];
  rejectedClients: string[];
}
