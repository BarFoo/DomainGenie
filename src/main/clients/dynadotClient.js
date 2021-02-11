const axios = require("axios");
const xmlToJs = require("xml-js");

export default class DynadotClient {
  constructor(keys) {
    const baseURL = "https://api.dynadot.com/";
    this.name = "Dynadot";
    this.xmlToJsonOptions = {
      compact: true,
      trim: true,
      ignoreCdata: true,
      ignoreAttributes: true,
      ignoreDoctype: true,
      ignoreComment: true,
      ignoreDeclaration: true,
      ignoreInstruction: true,
    };
    this.client = axios.create({
      baseURL,
      responseType: "text",
      headers: {
        Accept: "text/xml",
      },
      params: {
        key: keys.apiKey,
      },
    });
  }

  async getDomains() {
    // We get all contacts first and pass those to internal parse domains, for local filtering
    // of contacts.
    const contacts = await this.getContacts();
    const response = await this.client.get("api3.xml", {
      params: {
        command: "list_domain",
      },
    });
    const domains = await this.parseDomainInfoResponse(response, contacts);

    return domains;
  }

  async getContacts() {
    const response = await this.client.get("api3.xml", {
      params: {
        command: "contact_list",
      },
    });
    return await this.parseContactResponse(response);
  }

  async updateDomains(domains, operation, partialCallback) {
    return Promise.resolve(true);
  }

  /**
   * Update the nameservers for one or more domains.
   * @param {*} domains
   */
  async updateNameServers(domainNames, nameServers) {
    // Dynadot's API is awful.. each response is formatted differently, so we have no choice
    // but to parse each one on its own.
    const params = {
      command: "set_ns",
    };

    // Dynadot's max limit is 100 domains per request. So if we're updating thousands
    // of domains we need to put a delay between each request.
    domainNames.forEach((domainName, index) => {
      params[`domain${index}`] = domainName;
    });

    // Yes it is a GET request....
    const setNsResponse = await this.client.get("api3.xml", {
      params,
    });

    return this.isValidNameServerResponse(setNsResponse);
  }

  /**
   * @access private
   * @param {*} response
   */
  async parseContactResponse(response) {
    const data = JSON.parse(
      xmlToJs.xml2json(response.data, this.xmlToJsonOptions)
    );

    if (
      data.Response &&
      data.ResponseHeader &&
      data.ResponseHeader.ResponseCode._text === "-1"
    ) {
      return Promise.reject(
        `Invalid request, response code is ${data.ResponseHeader.ResponseCode._text}`
      );
    }

    const header = data.ContactListResponse.ContactListHeader;

    if (
      header.ResponseCode === undefined ||
      header.ResponseCode._text === "-1"
    ) {
      return Promise.reject("Unauthorized");
    }

    // Don't worry.. this really is an array! :O
    const rawContacts =
      data.ContactListResponse.ContactListContent.ContactList.Contact;
    const contacts = [];

    rawContacts.forEach((rawContact) => {
      const nameParts = rawContact.Name._text.split(" ");
      contacts.push({
        contactId: rawContact.ContactId?._text,
        addressLineOne: rawContact.Address1?._text,
        addressLineTwo: rawContact.Address2?._text,
        city: rawContact.City?._text,
        country: rawContact.Country?._text,
        postalCode: rawContact.ZipCode?._text,
        state: rawContact.State?._text,
        email: rawContact.Email?._text,
        firstName: nameParts[0],
        lastName: nameParts[1],
        organization: rawContact.Organization?._text,
        phone: `+${rawContact.PhoneCc?._text}${rawContact.PhoneNum?._text}`,
      });
    });

    return contacts;
  }

  /**
   * Parses a raw domain response into our expected format
   * @param {*} response The domains response to parse
   * @param {*} contacts Already parsed contacts array
   */
  async parseDomainInfoResponse(response, contacts) {
    const data = JSON.parse(
      xmlToJs.xml2json(response.data, this.xmlToJsonOptions)
    );
    const header = data.ListDomainInfoResponse.ListDomainInfoHeader;

    if (header.Status === undefined || header.ResponseCode._text === "-1") {
      return Promise.reject("Unauthorized");
    }

    const domains = [];

    const findContact = (contactType) => {
      if (contactType && contactType.ContactId) {
        return contacts.find(
          (c) => c.contactId === contactType.ContactId?._text
        );
      }
    };

    const domainInfos =
      data.ListDomainInfoResponse.ListDomainInfoContent.DomainInfoList
        .DomainInfo;

    domainInfos.forEach((domainInfo) => {
      const domain = domainInfo.Domain;
      let nameServers = [];
      // Overly defensive here yes, but when I tested the API several times, sometimes these come back undefined/null for certain domains
      if (domain.NameServerSettings?.NameServers?.ServerName) {
        nameServers = domain.NameServerSettings.NameServers.ServerName.map(
          (s) => s._text
        ).filter((s) => s !== "");
      }
      domains.push({
        registrar: this.name,
        domainName: domain.Name._text,
        contactAdmin: findContact(domain.Whois.Admin),
        contactBilling: findContact(domain.Whois.Billing),
        contactRegistrant: findContact(domain.Whois.Registrant),
        contactTech: findContact(domain.Whois.Technical),
        expiryDate: new Date(parseInt(domain.Expiration._text)),
        registrationDate: new Date(parseInt(domain.Registration._text)),
        hasPrivacy: domain.Privacy && domain.Privacy._text !== "none",
        locked: domain.Locked && domain.Locked._text === "yes",
        nameServers,
        hasAutoRenewal: domain.RenewOption._text === "auto-renew",
        isRenewable: domain.RenewOption._text !== "do not renew",
      });
    });

    return domains;
  }

  /**
   * @access private
   * @param {*} response
   */
  async isValidNameServerResponse(response) {
    const data = JSON.parse(
      xmlToJs.xml2json(response.data, this.xmlToJsonOptions)
    );

    return data.SetNsResponse.SetNsHeader.SuccessCode._text === "0";
  }

  check() {
    // There sadly isn't a better way than calling contact_list command in order to check
    // that the key is valid, this is because every other API command I checked requires
    // some data other than this one.
    // Also oddly enough, Dynadot always returns 200 OK, so we have to check the response itself.

    // This will return a rejection/throw error if the key is invalid
    return this.getContacts();
  }

  getName() {
    return this.name;
  }
}
