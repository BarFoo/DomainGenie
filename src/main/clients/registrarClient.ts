import type { Domain } from "../interfaces/domain";
import type { DomainUpdate } from "../interfaces/domainUpdate";

/**
 * Describes an interface for registrar clients to implement.
 * @remarks
 * I'm hesitant to name this RegistrarAPIClient because some of the registrar API's
 * are not what I'd call true APIs, they're a real mess so the client has to do
 * more than simply make API calls in most cases.
 * @internal
 */
export interface RegistrarClient {
  getDomains(): Promise<Domain[]>;
  updateDomains(
    domainNames: string[],
    data: DomainUpdate,
    progressCallback: Function
  ): Promise<void>;
  validateKeys(): Promise<any>;
  getName(): string;
}
