import type { Domain } from "../database/domain";

export interface GetAllDomainsCompleted {
  domains: Domain[];
  rejectedClients: string[];
}
