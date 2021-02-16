import type { Contact } from "../interfaces/contact";

export interface Domain {
  domainName: string;
  registrar?: string;
  contactAdmin?: Contact;
  contactBilling?: Contact;
  contactRegistrant?: Contact;
  contactTech?: Contact;
  registrationDate?: Date;
  expiryDate?: Date;
  transferEligibilityDate?: Date;
  registrarDomainId?: string;
  locked?: boolean;
  nameServers?: string[];
  hasAutoRenewal?: boolean;
  hasPrivacy?: boolean;
  isRenewable?: boolean;
  additionalData?: any[];
}
