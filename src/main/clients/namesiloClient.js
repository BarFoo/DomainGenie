const axios = require("axios");
const xmlToJs = require("xml-js");

export default class NamesiloClient {
  constructor(keys) {
    const baseURL = "https://www.namesilo.com/api/";
    this.name = "NameSilo";
    this.apiKey = keys.apiKey;
    this.apiVersion = 1;
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
    });
  }

  async getDomains() {
    /**
     * Ok so NameSilo's API is awkward..
     */
  }

  /**
   * Parses a raw domain response into our expected format
   * @param {*} response The domains response to parse
   */
  async parseDomains(response) {}

  check() {}

  getName() {
    return this.name;
  }
}
