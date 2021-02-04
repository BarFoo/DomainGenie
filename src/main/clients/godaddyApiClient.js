const axios = require("axios");

class GoDaddyAPIClient {
  constructor() {
    // Switch the following if testing
    // TODO: Move this out to a config file?
    // const baseURL = "https://api.ote-godaddy.com/"
    const baseURL = "https://api.godaddy.com/v1/";

    // This is how many seconds are delayed in between repeated requests when the user has
    // more than 1000 domains.
    this.repeatTimeout = 1000;
    this.name = "GoDaddy";

    this.client = axios.create({
      baseURL,
    });
  }

  getDomains() {
    const self = this;
    // GoDadddy limits requests to 1000 maximum domains. So we have to be clever, we have to repeat the request
    // until the amount returned is less than 1000 if we want to support importing say tens of thousands of domains.
    // We put a delay between each request so as to stop GoDaddy blocking us.
    // Thankfully GoDaddy supports a marker domain we can use as the offset for repeated attempts until the
    // returned response length is less than 1000.
    return new Promise((resolve, rejection) => {
      let domains = [];
      let markerDomain = "";
      let shouldRepeat = true;

      const repeatableRequest = () => {
        const markerQs = markerDomain !== "" ? `&marker=${markerDomain}` : "";
        return new Promise((repeatableResolve, repeatableRejection) => {
          this.client
            .get(
              `domains?limit=1000&includes=contacts,nameServers&statuses=ACTIVE${markerQs}`,
              this.commonArgs()
            )
            .then((response) => {
              const dataLen = response.data.length;
              domains = [...domains, ...self.parseDomains(response.data)];
              if (dataLen < 1000) {
                shouldRepeat = false;
                repeatableResolve();
              } else {
                markerDomain = response.data[dataLen - 1].domain;
                setTimeout(() => {
                  repeatableResolve();
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

      // Repeat until all domains populated
      repeat()
        .then(() => {
          resolve(domains);
        })
        .catch(() => {
          rejection(domains);
        });
    });
  }

  getDomain(domain) {
    return this.client.get(`domains/${domain}`, this.commonArgs());
  }

  check() {
    // There is no real method to check, so we use the fastest one available (which afaik is tlds check)
    return this.client.get("domains/tlds", this.commonArgs());
  }

  parseDomains(data) {
    const domains = [];
    data.forEach((item) => {
      domains.push(this.parseDomain(item));
    });
    return domains;
  }

  parseDomain(data) {
    // Handle parsing a GoDaddy domain object to our unified object equivalent
    // Yes, yes.. I know I know, I will rewrite to TypeScript when I have the chance
    if (data) {
      return {
        registrar: this.name,
        contactAdmin: this.parseContact(data.contactAdmin),
        contactBilling: this.parseContact(data.contactBilling),
        contactRegistrant: this.parseContact(data.contactRegistrant),
        contactTech: this.parseContact(data.contactTech),
        registrationDate: data.createdAt ? new Date(data.createdAt) : null,
        expiryDate: data.expires ? new Date(data.expires) : null,
        transferEligibilityDate: data.transferAwayEligibleAt
          ? new Date(data.transferAwayEligibleAt)
          : null,
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

  /**
   * Helper for the above parseDomain method
   * @param {object} contact
   * @access private
   */
  parseContact(contact) {
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

  getName() {
    return this.name;
  }

  hasKeys() {
    return this.apiKey !== undefined && this.secret !== undefined;
  }

  commonArgs() {
    return {
      headers: {
        Accept: "application/json",
        Authorization: `sso-key ${this.apiKey}:${this.secret}`,
      },
    };
  }

  setKeys(apiKey, secret) {
    this.apiKey = apiKey;
    this.secret = secret;
  }
}

export default GoDaddyAPIClient;
