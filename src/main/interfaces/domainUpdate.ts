import type { Contact } from "./contact";

/**
 * An interface describing supporting update data for domain updates.
 * @remarks
 * Please do not confuse this with the domain model, due to how different all the
 * APIs are, this is the best unified interface I could come up with for them all.
 */
export interface DomainUpdate {
  nameServers?: string[];
  contact?: Contact;
  contactAdmin?: Contact;
  contactBilling?: Contact;
  contactRegistrant?: Contact;
  contactTech?: Contact;
  hasAutoRenewal?: boolean;
  hasPrivacy?: boolean;
  contactIds?: any[];
}
