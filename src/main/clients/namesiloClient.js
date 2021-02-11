import updateOperations from "./updateOperations";
import { chunkArray, dedupe, sleep } from "../utils";
const axios = require("axios");
const xmlToJs = require("xml-js");

export default class NamesiloClient {
  constructor(keys) {
    const baseURL = "https://www.namesilo.com/api/";
    this.name = "NameSilo";

    // How long to sleep, in milliseconds, between each getDomainInfo request
    // so we don't get bannned, or between other operations
    this.sleep = 250;

    // Namesilo's success code for successful operations
    this.successCode = "300";

    // Update name server chunk size
    this.nameServerChunkSize = 200;

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
        version: 1,
        type: "xml",
        key: keys.apiKey,
      },
    });
  }

  async getDomains() {
    /**
     * Ok so NameSilo's API is awkward.. the domain list command only returns the domain names themselves
     * so we will need to fire off continuous requests to fetch info for all the domains.
     * Unfortunately if someone has thousands of domains this will be slow, there isn't much I can do about
     * this at the moment, we're at the mercy of Namesilo here.
     */
    const contacts = await this.getContacts();
    const domainNames = await this.parseDomainListResponse(
      await this.client.get("listDomains")
    );

    const domains = [];

    for (const domainName of domainNames) {
      domains.push(
        await this.parseDomainResponse(
          await this.client.get("getDomainInfo", {
            params: {
              domain: domainName,
            },
          }),
          contacts,
          domainName
        )
      );

      // Sleep between each domain info request so we don't get banned
      await new Promise((r) => setTimeout(r, this.sleep));
    }

    return domains;
  }

  async getContacts() {
    const response = await this.client.get("contactList");
    return await this.parseContactResponse(response);
  }

  async updateDomains(domains, operation, partialCallback) {
    const filteredDomains = domains.filter((d) => d.registrar === this.name);

    if (filteredDomains.length === 0) {
      return Promise.reject("No domains given!");
    }

    const result = {
      acceptedDomains: [],
      rejectedDomains: [],
    };

    // Supported bulk operations
    if (operation === updateOperations.NAMESERVERS) {
      // If its only one or bulk update, each domain will have the same nameServers
      // so use the first ones nameservers
      const ns = filteredDomains[0].nameServers;
      let currentChunk;
      try {
        await this.updateNameservers(
          filteredDomains.map((d) => d.domainName),
          ns,
          currentChunk
        );
        if (currentChunk && Array.isArray(currentChunk)) {
          currentChunk.forEach((domainName) => {
            result.acceptedDomains.push({
              domainName,
            });
          });
        }
      } catch (ex) {
        if (currentChunk && Array.isArray(currentChunk)) {
          currentChunk.forEach((domainName) => {
            result.rejectedDomains.push({
              domainName,
              statusCode: ex.response.status,
            });
          });
        }
      }

      return result;
    }

    // Individual operations
    for (const domain of filteredDomains) {
      try {
        if (operation === updateOperations.CONTACTS) {
          const contacts = [
            domain.contactAdmin,
            domain.contactBilling,
            domain.contactRegistrant,
            domain.contactTech,
          ];
          const uniqueContacts = dedupe(contacts, "contactId");
          for (const contact of uniqueContacts) {
            await this.updateContact(contact);
          }
          result.acceptedDomains.push({
            domainName: domain.domainName,
          });
        }
      } catch (ex) {
        result.rejectedDomains.push({
          domainName: domain.domainName,
          statusCode: ex.response.status,
        });
      }
    }

    return result;
  }

  async updateAutoRenew(domain) {
    let response;
    if (domain.hasAutoRenewal) {
      response = await this.client.get("addAutoRenewal", {
        params: {
          domain: domain.domainName,
        },
      });
    } else {
      response = await this.client.get("removeAutoRenewal", {
        params: {
          domain: domain.domainName,
        },
      });
    }

    return this.parseResponse(response);
  }

  async updateContact(contact) {
    const response = await this.client.get("contactUpdate", {
      params: {
        contact_id: contact.contactId,
        fn: contact.firstName,
        ln: contact.lastName,
        ad: `${contact.addressLineOne} ${contact.addressLineTwo}`,
        cy: contact.city,
        st: contact.state,
        zp: contact.postalCode,
        ct: contact.country,
        em: contact.email,
        ph: contact.phone,
      },
    });

    return this.parseResponse(response);
  }

  async updatePrivacy(domain) {
    let response;
    if (domain.hasPrivacy) {
      response = await this.client.get("addPrivacy", {
        params: {
          domain: domain.domainName,
        },
      });
    } else {
      response = await this.client.get("removePrivacy", {
        params: {
          domain: domain.domainName,
        },
      });
    }

    return this.parseResponse(response);
  }

  async updateNameservers(domainNames, nameServers, currentChunk) {
    // Namesilo supports updating up to 200 domains at once, so
    // we have to do them in batches of 200

    // Convert domainNames to batches of 200
    const chunks = chunkArray(domainNames, this.nameServerChunkSize);

    for (const chunk of chunks) {
      currentChunk = chunk;
      // Namesilo expects a comma delimited string of domains
      const params = {
        domain: chunk.join(","),
      };

      nameServers.forEach((nameServer, index) => {
        if (index > 12) {
          return;
        }
        params[`ns${index + 1}`] = nameServer;
      });

      await this.client.get("changeNameServers", {
        params,
      });

      await sleep(this.sleep);
    }
  }

  /**
   * Supports parsing any response and returns the reply. We don't care about the header
   * part of the response, I can't see how that is ever useful to us.
   * @access private
   * @param {*} response
   */
  parseResponse(response) {
    const data = JSON.parse(
      xmlToJs.xml2json(response.data, this.xmlToJsonOptions)
    );

    return data.namesilo.reply;
  }

  /**
   * @access private
   * @param {*} response
   * @param {*} contacts
   * @param {*} domainName
   */
  async parseDomainResponse(response, contacts, domainName) {
    const reply = this.parseResponse(response);

    if (reply.code._text !== this.successCode) {
      return Promise.reject(
        `Invalid at parseDomainResponse, response code is ${reply.code._text} with domainName ${domainName}`
      );
    }

    const findContact = (id) => {
      return contacts.find((c) => c.contactId === id);
    };

    const nameServers = [];

    if (reply.nameservers && Array.isArray(reply.nameservers.nameserver)) {
      reply.nameservers.nameserver.forEach((ns) => {
        nameServers.push(ns._text);
      });
    }

    return {
      registrar: this.name,
      domainName,
      contactAdmin: findContact(reply.contact_ids?.administrative._text),
      contactBilling: findContact(reply.contact_ids?.billing._text),
      contactRegistrant: findContact(reply.contact_ids?.registrant._text),
      contactTech: findContact(reply.contact_ids?.technical._text),
      expiryDate: new Date(reply.expires?._text),
      registrationDate: new Date(reply.created?._text),
      hasPrivacy: reply.private?._text === "Yes",
      locked: reply.locked?._text === "Yes",
      nameServers,
      hasAutoRenewal: reply.auto_renew._text === "Yes",
    };
  }

  /**
   * @access private
   * @param {*} response
   */
  async parseDomainListResponse(response) {
    const reply = this.parseResponse(response);

    if (reply.code?._text !== this.successCode) {
      return Promise.reject(
        `Invalid request, response code is ${reply.code._text}`
      );
    }

    const parsedDomains = [];

    if (reply.domains && Array.isArray(reply.domains.domain)) {
      reply.domains.domain.forEach((d) => {
        parsedDomains.push(d._text);
      });
    }

    return parsedDomains;
  }

  /**
   * @access private
   * @param {*} response
   */
  parseContactResponse(response) {
    const reply = this.parseResponse(response);

    // @todo Handle multiple response codes
    if (reply.code?._text !== this.successCode) {
      return Promise.reject(
        `Invalid request, response code is ${reply.code._text}`
      );
    }

    const contacts = [];

    const parseContact = (contact) => {
      contacts.push({
        contactId: contact.contact_id?._text,
        addressLineOne: contact.address?._text,
        addressLineTwo: contact.address2?._text,
        city: contact.city?._text,
        country: contact.country?._text,
        postalCode: contact.zip?._text,
        state: contact.state?._text,
        email: contact.email?._text,
        firstName: contact.first_name?._text,
        lastName: contact.last_name?._text,
        organization: contact.company?._text,
        phone: contact.phone?._text,
      });
    };

    // Sometimes reply.contact will be an array and sometimes not
    if (!Array.isArray(reply.contact)) {
      contacts.push(parseContact(reply.contact));
    } else {
      reply.contact.forEach((contact) => {
        contacts.push(contact);
      });
    }

    return contacts;
  }

  async check() {
    // Again, the only way to test if the api key is valid is to call the least
    // expensive API operation, which in Namesilo's case is contactList afaik
    const response = await this.client.get(
      `contactList?version=${this.apiVersion}&type=xml&key=${this.apiKey}`
    );

    const reply = this.parseResponse(response);

    // 110 status code means invalid API key
    if (reply.code?._text === "110") {
      return Promise.reject("Invalid API key");
    }

    return Promise.resolve(true);
  }

  getName() {
    return this.name;
  }
}
