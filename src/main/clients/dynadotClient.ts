/**
 * The Dynadot API client.
 *
 * @todo Some of the clients have now become similar in parts, review this.
 */
import axios, { AxiosInstance, AxiosResponse } from "axios";
import xmlJs from "xml-js";
import type { Contact } from "../interfaces/contact";
import { chunkArray, dedupe, sleep } from "../utils";
import type { RegistrarClient } from "./registrarClient";
import callingCodes from "../data/callingCodes";
import type { DomainUpdate } from "../interfaces/domainUpdate";

export default class DynadotClient implements RegistrarClient {
  private name: string = "Dynadot";
  private xmlToJsonOptions: any;
  private client: AxiosInstance;

  // How long to sleep in milliseconds between each update request
  private sleep: number = 125;

  // The maximum amount of domains that can be set at one time
  private nameServerChunkSize: number = 100;
  private autoRenewalChunkSize: number = 100;
  private privacyChunkSize: number = 100;

  constructor(keys) {
    const baseURL = "https://api.dynadot.com/";
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

  async updateDomains(
    domainNames: string[],
    data: DomainUpdate,
    progressCallback: Function
  ) {
    if (data.nameServers) {
      await this.updateNameServers(domainNames, data.nameServers, (chunk) => {
        chunk.forEach((domainName) => {
          progressCallback(domainName);
        });
      });
    }

    if ("hasPrivacy" in data) {
      await this.updatePrivacy(domainNames, data.hasPrivacy, (chunk) => {
        chunk.forEach((domainName) => {
          progressCallback(domainName);
        });
      });
    }

    if ("hasAutoRenewal" in data) {
      await this.updateAutoRenewal(
        domainNames,
        data.hasAutoRenewal,
        (chunk) => {
          chunk.forEach((domainName) => {
            progressCallback(domainName);
          });
        }
      );
    }

    if (
      data.contactRegistrant &&
      data.contactAdmin &&
      data.contactBilling &&
      data.contactTech
    ) {
      // With dynadot we don't update per domain, we simply update the contacts based
      // on their type. These contacts are unique to all domains, so use the passed in
      // contact ids instead here, and update each one of its type.
      const contacts = [
        data.contactAdmin,
        data.contactBilling,
        data.contactRegistrant,
        data.contactTech,
      ];
      const uniqueContacts = dedupe(contacts, "contactId");
      for (const contact of uniqueContacts) {
        await this.updateContact(contact);

        // Sleep between contact updates so we don't get banned
        await sleep(this.sleep);
      }
    } else if(data.contact && data.contactIds) {
      // Bulk update, also use the corresponding contact ids to update
      const uniqueContactIds = [...new Set(data.contactIds)];
      for(const contactId of uniqueContactIds) {
        await this.updateContact({
          contactId: contactId,
          ...data.contact
        });
        await sleep(this.sleep);
      }
    }
  }

  validateKeys() {
    // There sadly isn't a better way than calling contact_list command in order to check
    // that the key is valid, this is because every other API command I checked requires
    // some data other than this one.
    // This will return a rejection/throw error if the key is invalid
    return this.getContacts();
  }

  getName(): string {
    return this.name;
  }

  private async getContacts() {
    const response = await this.client.get("api3.xml", {
      params: {
        command: "contact_list",
      },
    });
    return await this.parseContactResponse(response);
  }

  private async updateContact(contact: Contact) {

    contact.phone = contact.phone.replace(".", "");
    const phoneParts = this.getPhoneParts(contact.phone);

    const params = {
      command: "edit_contact",
      contact_id: contact.contactId,
      name: `${contact.firstName} ${contact.lastName}`.trim(),
      email: contact.email,
      address1: contact.addressLineOne,
      city: contact.city,
      state: contact.state,
      zip: contact.postalCode,
      country: contact.country,
      phonecc: phoneParts.cc,
      phonenum: phoneParts.num
    };

    if(contact.addressLineTwo && contact.addressLineTwo.trim() !== "") {
      params["address2"] = contact.addressLineTwo;
    }

    await this.client.get("api3.xml", { params});

    // Uncomment the following in testing.. WE CAN'T HAVE THIS IN PRODUCTION!
    // Dynadot throws an error if THERE ARE NO CHANGES and its always just a -1 success code :facepalm:

    /*const data = JSON.parse(xmlJs.xml2json(response.data, this.xmlToJsonOptions));

    // We can't throw an error here,
    if(data?.EditContactResponse?.EditContactHeader?.SuccessCode?._text !== "0") {
      throw new Error("Failed updating contact with Dynadot");
    }*/
  }

  private getPhoneParts(phone: string) {
    const parts = {
      cc: "",
      num: "",
    };
    for (const code of Object.entries(callingCodes)) {
      if (phone.startsWith(code[1])) {
        parts.cc = code[1].replace("+", "");
        parts.num = phone.substring(code[1].length, phone.length);
        break;
      }
    }
    return parts;
  }

  /**
   * Update the nameservers for one or more domains.
   * @param {string[]} domainNames
   * @param {string}
   */
  private async updateNameServers(
    domainNames: string[],
    nameServers: string[],
    chunkCallback: Function
  ) {
    // Dynadot supports batches of 100 domains at a time
    const chunks = chunkArray(domainNames, this.nameServerChunkSize);

    for (const chunk of chunks) {
      const params = {
        command: "set_ns",
        domain: chunk.join(","),
      };

      nameServers.forEach((nameServer, index) => {
        if (index > 11) {
          return;
        }
        params[`ns${index + 1}`] = nameServer;
      });

      const setNSResponse = await this.client.get("api3.xml", {
        params,
      });

      if (!this.isValidNameServerResponse(setNSResponse)) {
        throw Error("Invalid name server request");
      }

      if (chunkCallback) {
        chunkCallback(chunk);
      }

      await sleep(this.sleep);
    }
  }

  private async updateAutoRenewal(
    domainNames: string[],
    hasAutoRenewal: boolean,
    chunkCallback: Function
  ) {
    const chunks = chunkArray(domainNames, this.autoRenewalChunkSize);

    for (const chunk of chunks) {
      const params = {
        command: "set_renew_option",
        domain: chunk.join(","),
        renew_option: hasAutoRenewal ? "auto" : "donot",
      };

      const setRenewOptionResponse = await this.client.get("api3.xml", {
        params,
      });

      if (!this.isValidRenewResponse(setRenewOptionResponse)) {
        throw Error("Invalid set renew request");
      }

      if (chunkCallback) {
        chunkCallback(chunk);
      }

      await sleep(this.sleep);
    }
  }

  private async updatePrivacy(
    domainNames: string[],
    hasPrivacy: boolean,
    chunkCallback: Function
  ) {
    const chunks = chunkArray(domainNames, this.privacyChunkSize);

    for (const chunk of chunks) {
      const params = {
        command: "set_privacy",
        domain: chunk.join(","),
        option: hasPrivacy ? "full" : "off",
      };

      const setPrivacyResponse = await this.client.get("api3.xml", {
        params,
      });

      if (!this.isValidPrivacyResponse(setPrivacyResponse)) {
        throw Error("Invalid privacy request");
      }

      if (chunkCallback) {
        chunkCallback(chunk);
      }

      await sleep(this.sleep);
    }
  }

  private async parseContactResponse(
    response: AxiosResponse
  ): Promise<Contact[]> {
    const data = JSON.parse(
      xmlJs.xml2json(response.data, this.xmlToJsonOptions)
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
        phone: `+${rawContact.PhoneCc?._text}.${rawContact.PhoneNum?._text}`,
      });
    });

    return contacts;
  }

  /**
   * Parses a raw domain response into our expected format
   * @param {*} response The domains response to parse
   * @param {*} contacts Already parsed contacts array
   */
  private async parseDomainInfoResponse(
    response: AxiosResponse,
    contacts: Contact[]
  ) {
    const data = JSON.parse(
      xmlJs.xml2json(response.data, this.xmlToJsonOptions)
    );
    const header = data.ListDomainInfoResponse.ListDomainInfoHeader;

    if (header.Status === undefined || header.ResponseCode._text === "-1") {
      return Promise.reject("Unauthorized");
    }

    const domains = [];

    const findContact = (contactType) => {
      if (contactType && contactType.ContactId) {
        return contacts.find(
          (c) => c.contactId == contactType.ContactId?._text
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
   * Checks if a given name server response is valid
   * @access private
   * @param {*} response
   */
  private async isValidNameServerResponse(response: AxiosResponse) {
    const data = JSON.parse(
      xmlJs.xml2json(response.data, this.xmlToJsonOptions)
    );

    return data.SetNsResponse.SetNsHeader.SuccessCode._text === "0";
  }

  /**
   * Checks if a given renew response is valid
   * @access private
   * @param {*} response
   */
  private async isValidRenewResponse(response: AxiosResponse) {
    const data = JSON.parse(
      xmlJs.xml2json(response.data, this.xmlToJsonOptions)
    );

    return (
      data.SetRenewOptionResponse.SetRenewOptionHeader.SuccessCode._text === "0"
    );
  }

  /**
   * Checks if a given privacy response is valid
   * @access private
   * @param {*} response
   */
  private async isValidPrivacyResponse(response: AxiosResponse) {
    const data = JSON.parse(
      xmlJs.xml2json(response.data, this.xmlToJsonOptions)
    );

    return data.SetPrivacyResponse.SetPrivacyHeader.SuccessCode._text === "0";
  }
}
