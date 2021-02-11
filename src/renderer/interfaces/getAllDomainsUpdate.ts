import type { Domain } from "../database/domain";

export interface GetAllDomainsUpdate {
  domains: Domain[];
  registrar: string;
  isValid: boolean;
  error: any;
}
