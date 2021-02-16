import axios from "axios";
import type { AxiosInstance } from "axios";
import type { RegistrarClient } from "./registrarClient";
import { sleep } from "../utils";
import type { Domain } from "../interfaces/domain";
import type { DomainUpdate } from "../interfaces/domainUpdate";
import type { Contact } from "../interfaces/contact";

class GoDaddyClient implements RegistrarClient {
  private name: string = "GoDaddy";
  // The max number of domains we can get from GoDaddy at one time
  private getDomainsLimit: number = 1000;
  // How many milliseconds to delay between each GD request
  // when there are more than getDomainsLimit domains.
  private repeatTimeout: number = 500;
  // How long to sleep between most other requests (domain update etc)
  private sleep: number = 125;
  private apiKey: string;
  private secret: string;
  private client: AxiosInstance;

  constructor(keys) {
    // The OTE environment appears to have completely gone offline. :\
    // const baseURL = "https://api.ote-godaddy.com/"
    const baseURL = "https://api.godaddy.com/v1/";

    this.apiKey = keys.apiKey;
    this.secret = keys.secret;

    this.client = axios.create({
      baseURL,
      headers: {
        Accept: "application/json",
        Authorization: `sso-key ${this.apiKey}:${this.secret}`,
      },
    });
  }

  getDomains() {
    const self = this;

    // GoDadddy limits requests to 1000 maximum domains. So we have to be clever, we have to repeat the request
    // until the amount returned is less than 1000 if we want to support importing say tens of thousands of domains.
    // We put a delay between each request so as to stop GoDaddy blocking us.
    // Thankfully GoDaddy supports a marker domain we can use as the offset for repeated attempts until the
    // returned response length is less than 1000.
    return new Promise<Domain[]>((resolve, rejection) => {
      let domains = [];
      let markerDomain = "";
      let shouldRepeat = true;

      const repeatableRequest = () => {
        const params = {
          limit: this.getDomainsLimit,
          includes: "contacts,nameServers",
          statuses: "ACTIVE",
          marker: null,
        };
        if (markerDomain !== "") {
          params.marker = markerDomain;
        }
        return new Promise((repeatableResolve, repeatableRejection) => {
          this.client
            .get("domains", {
              params,
            })
            .then((response) => {
              const dataLen = response.data.length;
              domains = [...domains, ...self.parseDomains(response.data)];
              if (dataLen < 1000) {
                shouldRepeat = false;
                repeatableResolve(true);
              } else {
                markerDomain = response.data[dataLen - 1].domain;
                setTimeout(() => {
                  repeatableResolve(true);
                }, self.repeatTimeout);
              }
            })
            .catch(() => {
              shouldRepeat = false;
              repeatableRejection();
            });
        });
      };

      const repeat = () => {
        if (!shouldRepeat) {
          return Promise.resolve();
        }
        return repeatableRequest().then(() => {
          return repeat();
        });
      };

      // Repeat until all domains are populated
      repeat()
        .then(() => {
          resolve(domains);
        })
        .catch(() => {
          rejection(domains);
        });
    });
  }

  /**
   * Updates one or more given domains. Domains must be an array even if only
   * updating one! I would like to switch to TypeScript in the near future so
   * enforcing types at this level now will help with that.
   * @param {array} domains
   * @param {*} operation The type of operation to perform
   * @param {Function} partialCallback A callback function to receive partial updates
   */
  async updateDomains(
    domainNames: string[],
    data: DomainUpdate,
    partialCallback: Function
  ) {
    /**
     * GoDaddy does not support bulk updates. The only choice we have is to
     * send requests with a sleep in between. I tried testing with more than one request at a time
     * but it sadly doesn't work. This of course does mean for bulk updating
     * thousands of domains, it will take a long time. There's pretty
     * much no way around this.
     */

    // For bulk update
    let gdContact;
    if(data.contact) {
      gdContact = this.convertToGodaddyContact(data.contact);
    }

    // For single update
    let gdContactRegistrant;
    let gdContactBilling;
    let gdContactAdmin;
    let gdContactTech;

    if(data.contactRegistrant && data.contactTech && data.contactBilling && data.contactAdmin) {
      gdContactRegistrant = this.convertToGodaddyContact(data.contactRegistrant);
      gdContactAdmin = this.convertToGodaddyContact(data.contactAdmin);
      gdContactBilling = this.convertToGodaddyContact(data.contactBilling);
      gdContactTech = this.convertToGodaddyContact(data.contactTech);
    }

    for (const domainName of domainNames) {
      // If contact is set it means for all contact types (bulk edit)
      if (gdContact) {
        await this.client.patch(`domains/${domainName}/contacts`, {
          contactAdmin: gdContact,
          contactBilling: gdContact,
          contactRegistrant: gdContact,
          contactTech: gdContact
        });
      } else if(gdContactRegistrant && gdContactAdmin && gdContactTech && gdContactBilling) {
        // Else its individual update
        await this.client.patch(`domains/${domainName}/contacts`, {
          contactAdmin: gdContactAdmin,
          contactBilling: gdContactBilling,
          contactRegistrant: gdContactRegistrant,
          contactTech: gdContactTech
        });
      }

      if (
        "nameServers" in data ||
        "hasAutoRenewal" in data ||
        "hasPrivacy" in data
      ) {
        await this.client.patch(`domains/${domainName}`, {
          nameServers: data.nameServers,
          exposeWhois: data.hasPrivacy ? !data.hasPrivacy : undefined,
          renewAuto: data.hasAutoRenewal,
        });
      }

      if (partialCallback) {
        partialCallback({
          domainName,
        });
      }

      await sleep(this.sleep);
    }
  }

  validateKeys() {
    // There is no real method to check, so we use the fastest one available (which afaik is tlds check)
    return this.client.get("domains/tlds");
  }

  getName() {
    return this.name;
  }

  private parseDomains(data) {
    const domains = [];
    data.forEach((item) => {
      domains.push(this.parseDomain(item));
    });
    return domains;
  }

  private parseDomain(data) {
    if (data) {
      return {
        registrar: this.name,
        contactAdmin: this.parseContact(data.contactAdmin),
        contactBilling: this.parseContact(data.contactBilling),
        contactRegistrant: this.parseContact(data.contactRegistrant),
        contactTech: this.parseContact(data.contactTech),
        registrationDate: data.createdAt,
        expiryDate: data.expires,
        transferEligibilityDate: data.transferAwayEligibleAt,
        registrarDomainId: data.domainId.toString(),
        locked: data.locked,
        nameServers: data.nameServers,
        hasAutoRenewal: data.renewAuto,
        hasPrivacy: data.privacy,
        isRenewable: data.renewable,
        domainName: data.domain,
      };
    }
    throw new Error("Invalid data!");
  }

  private parseContact(contact) {
    if (contact) {
      return {
        addressLineOne: contact.addressMailing.address1,
        addressLineTwo: contact.addressMailing.address2,
        city: contact.addressMailing.city,
        country: contact.addressMailing.country,
        postalCode: contact.addressMailing.postalCode,
        state: contact.addressMailing.state,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        organization: contact.organization,
        phone: contact.phone,
      };
    } else {
      return contact;
    }
  }

  private convertToGodaddyContact(contact: Contact) {
    return {
      addressMailing: {
        address1: contact.addressLineOne,
        address2: contact.addressLineTwo,
        city: contact.city,
        country: contact.country,
        postalCode: contact.postalCode,
        state: contact.state,
      },
      email: contact.email,
      nameFirst: contact.firstName,
      nameLast: contact.lastName,
      organization: contact.organization,
      phone: contact.phone,
    };
  }
}

export default GoDaddyClient;
