import { UpdateOperation } from "../constants";
import { chunkArray, dedupe, sleep } from "../utils";
import axios, { AxiosInstance } from "axios";
import xmlJs from "xml-js";
import type { RegistrarClient } from "./registrarClient";
import type { Domain } from "../interfaces/domain";
import type { Contact } from "../interfaces/contact";
import callingCodes from "../data/callingCodes";
import type { DomainUpdate } from "../interfaces/domainUpdate";

export default class NamesiloClient implements RegistrarClient {
  private name: string = "NameSilo";

  // How long to sleep, in milliseconds, between each getDomainInfo request
  // so we don't get bannned, or between other operations
  private sleepTime: number = 125;

  // Ahh the challenges of merging different registrars all with different APIs
  private successCode: string = "300";
  private invalidApiKeyCode: string = "110";

  private nameServerChunkSize: number = 200;
  private xmlToJsonOptions: any;
  private client: AxiosInstance;

  constructor(keys) {
    const baseURL = "https://www.namesilo.com/api/";

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

  async getDomains(): Promise<Domain[]> {
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
      await new Promise((r) => setTimeout(r, this.sleepTime));
    }

    return domains;
  }

  async updateDomains(
    domainNames: string[],
    data: DomainUpdate,
    partialCallback: Function
  ) {
    if (data.nameServers) {
      await this.updateNameServers(domainNames, data.nameServers, (chunk) => {
        chunk.forEach((domainName) => {
          partialCallback(domainName);
        });
      });
    }

    if (
      data.contactAdmin &&
      data.contactBilling &&
      data.contactRegistrant &&
      data.contactTech
    ) {
      const contacts = [
        data.contactAdmin,
        data.contactBilling,
        data.contactRegistrant,
        data.contactTech,
      ];
      const uniqueContacts = dedupe(contacts, "contactId");
      for (const contact of uniqueContacts) {
        await this.updateContact(contact);
        await sleep(this.sleepTime);
      }
    } else if(data.contact && data.contactIds) {
      // Bulk update, also use the corresponding contact ids to update
      const uniqueContactIds = [...new Set(data.contactIds)];
      for(const contactId of uniqueContactIds) {
        await this.updateContact({
          contactId: contactId,
          ...data.contact
        });
        await sleep(this.sleepTime);
      }
    }

    if ("hasAutoRenewal" in data) {
      for (const domainName of domainNames) {
        await this.updateAutoRenewal(domainName, data.hasAutoRenewal);

        await sleep(this.sleepTime);
      }
    }

    if ("hasPrivacy" in data) {
      for (const domainName of domainNames) {
        await this.updatePrivacy(domainName, data.hasPrivacy);
        await sleep(this.sleepTime);
      }
    }
  }

  private async getContacts() {
    const response = await this.client.get("contactList");
    return await this.parseContactResponse(response);
  }

  private async updateContact(contact: Contact) {
    const response = await this.client.get("contactUpdate", {
      params: {
        contact_id: contact.contactId,
        fn: contact.firstName,
        ln: contact.lastName,
        ad: `${contact.addressLineOne} ${contact.addressLineTwo}`.trim(),
        cy: contact.city,
        st: contact.state,
        zp: contact.postalCode,
        ct: contact.country,
        em: contact.email,
        ph: this.stripPhoneCc(contact.phone),
      },
    });

    const reply = this.parseResponse(response);

    if (reply.code._text !== this.successCode) {
      throw new Error(reply.code._text);
    }
  }

  private stripPhoneCc(phone: string) {
    for (const code of Object.entries(callingCodes)) {
      if (phone.startsWith(code[1])) {
        phone = phone.substring(code[1].length, phone.length);
        break;
      }
    }
    phone = phone.replace("+", "").replace(".", "");

    return phone;
  }

  private async updateNameServers(
    domainNames: string[],
    nameServers: string[],
    chunkCallback: Function
  ) {
    // Namesilo supports updating up to 200 domains at once, so
    // we have to do them in batches of 200

    // Convert domainNames to batches of 200
    const chunks = chunkArray(domainNames, this.nameServerChunkSize);

    for (const chunk of chunks) {
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

      const response = await this.client.get("changeNameServers", {
        params,
      });

      const reply = this.parseResponse(response);

      if (reply.code._text !== this.successCode) {
        throw new Error(reply.code._text);
      }

      chunkCallback(chunk);

      await sleep(this.sleepTime);
    }
  }

  private async updatePrivacy(domainName: string, hasPrivacy: boolean) {
    let response;
    if (hasPrivacy) {
      response = await this.client.get("addPrivacy", {
        params: {
          domain: domainName,
        },
      });
    } else {
      response = await this.client.get("removePrivacy", {
        params: {
          domain: domainName,
        },
      });
    }

    const reply = this.parseResponse(response);

    if (reply.code._text !== this.successCode) {
      throw new Error(reply.code._text);
    }
  }

  private async updateAutoRenewal(domainName: string, autoRenew: boolean) {
    let response;
    if (autoRenew) {
      response = await this.client.get("addAutoRenewal", {
        params: {
          domain: domainName,
        },
      });
    } else {
      response = await this.client.get("removeAutoRenewal", {
        params: {
          domain: domainName,
        },
      });
    }

    const reply = this.parseResponse(response);

    if (reply.code?._text !== this.successCode) {
      throw new Error(reply.code._text);
    }
  }

  /**
   * Supports parsing any response and returns the reply. We don't care about the header
   * part of the response, I can't see how that is ever useful to us.
   * @access private
   * @param {*} response
   */
  private parseResponse(response) {
    const data = JSON.parse(
      xmlJs.xml2json(response.data, this.xmlToJsonOptions)
    );

    return data.namesilo.reply;
  }

  /**
   * @access private
   * @param {*} response
   * @param {*} contacts
   * @param {*} domainName
   * @returns Reply
   */
  private async parseDomainResponse(response, contacts, domainName) {
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
  private async parseDomainListResponse(response) {
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
  private parseContactResponse(response) {
    const reply = this.parseResponse(response);

    // @todo Handle multiple response codes
    if (reply.code?._text !== this.successCode) {
      return Promise.reject(
        `Invalid request, response code is ${reply.code._text}`
      );
    }

    const contacts = [];

    const parseContact = (contact) => {
      // NameSilo doesn't return a calling code or anything.. we just insert the + and . character
      // so it conforms to our format, and if they save with this it gets parsed at the other end.
      // It's very messy yes and I will think of a better way than this.
      let phoneNumber: string = contact.phone?._text ?? null;
      if(phoneNumber) {
        // Just in case NS go funky on us..
        phoneNumber = phoneNumber.replace("+", "").replace(".", "");
        phoneNumber = `+${phoneNumber.slice(0, 2)}.${phoneNumber.slice(2)}`;
      }
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
        phone: phoneNumber,
      });
    };

    // Sometimes reply.contact will be an array and sometimes not
    if (!Array.isArray(reply.contact)) {
      contacts.push(parseContact(reply.contact));
    } else {
      reply.contact.forEach((c) => {
        contacts.push(parseContact(c));
      });
    }

    return contacts;
  }

  async validateKeys() {
    // Again, the only way to test if the api key is valid is to call the least
    // expensive API operation, which in Namesilo's case is contactList afaik
    const response = await this.client.get("contactList");
    const reply = this.parseResponse(response);

    // 110 status code means invalid API key
    if (reply.code._text === this.invalidApiKeyCode) {
      return Promise.reject("Invalid API key");
    }
  }

  getName() {
    return this.name;
  }
}
