import type { Contact } from "./contact";

export interface Domain {
  domainName: string;
  registrar: string;
  registrationDate?: Date;
  expiryDate?: Date;
  contactAdmin?: Contact;
  contactBilling?: Contact;
  contactRegistrant?: Contact;
  contactTech?: Contact;
  hasAutoRenewal?: boolean;
  nameServers?: string[];
  hasPrivacy?: boolean;
}
