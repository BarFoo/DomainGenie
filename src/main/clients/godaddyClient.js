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
    return new Promise((resolve, rejection) => {
      let domains = [];
      let markerDomain = "";
      let shouldRepeat = true;

      const repeatableRequest = () => {
        const markerQs = markerDomain !== "" ? `&marker=${markerDomain}` : "";
        return new Promise((repeatableResolve, repeatableRejection) => {
          this.client
            .get(
              `domains?limit=1000&includes=contacts,nameServers&statuses=ACTIVE${markerQs}`
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

  /**
   * Updates one or more given domains. Domains must be an array even if only
   * updating one! I would like to switch to TypeScript in the near future so
   * enforcing types at this level now will help with that.
   * @param {array} domains
   */
  updateDomains(domains) {
    /**
     * GoDaddy does not support bulk updates. The only choice we have is to
     * send requests sequentially. I tried testing with more than one request at a time
     * but it sadly doesn't work. This of course does mean for bulk updating
     * thousands of domains, it will take a long time. There's pretty
     * much no way around this. The renderer should already know this
     * and display a message accordingly to the user that they will be
     * notified once all updates have been completed. Warn them not to
     * quit the application until they have been notified that this
     * job has finished!
     *
     * From my testing it seems sending requests with a 5 second delay
     * between each one is the safest.
     */

    return this.client.patch(`domains/${domain.domainName}`, {
      locked: domain.locked,
      nameServers: domain.nameServers,
      renewAuto: domain.hasAutoRenewal,
      exposeWhois: !domain.hasPrivacy,
    });
  }

  check() {
    // There is no real method to check, so we use the fastest one available (which afaik is tlds check)
    return this.client.get("domains/tlds");
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
}

export default GoDaddyClient;
