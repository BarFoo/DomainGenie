const axios = require("axios");

class GoDaddyClient {
  constructor(keys) {
    // The OTE environment appears to have completely gone offline. :\
    // const baseURL = "https://api.ote-godaddy.com/"
    const baseURL = "https://api.godaddy.com/v1/";

    // How many milliseconds to delay between each GD request when there are more than
    // Max GD limit domains.
    this.repeatTimeout = 1000;
    this.name = "GoDaddy";
    this.apiKey = keys.apiKey;
    this.secret = keys.secret;

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

  check() {
    // There is no real method to check, so we use the fastest one available (which afaik is tlds check)
    return this.client.get("domains/tlds", this.commonArgs());
  }

  /**
   * @access private
   * @param {*} data
   */
  parseDomains(data) {
    const domains = [];
    data.forEach((item) => {
      domains.push(this.parseDomain(item));
    });
    return domains;
  }

  /**
   * @access private
   * @param {*} data
   */
  parseDomain(data) {
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

  /**
   * @access private
   */
  commonArgs() {
    return {
      headers: {
        Accept: "application/json",
        Authorization: `sso-key ${this.apiKey}:${this.secret}`,
      },
    };
  }
}

export default GoDaddyClient;
