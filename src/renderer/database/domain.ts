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
}

/* Contact isn't its own table (hence why it is in this file), it only ever lives on Domain, 
  but domain has 4 types of contacts so it warrants its own interface */
interface Contact {
  addressLineOne?: string;
  addressLineTwo?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  state?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  phone?: string;
}
