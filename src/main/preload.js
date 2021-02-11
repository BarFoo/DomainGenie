import { contextBridge, ipcRenderer, shell } from "electron";

/**
 * This context bridge safely exposes various operations on the backend
 * via the means of whitelisting channel names. These are available
 * to the renderer via window.electronApi.
 */
contextBridge.exposeInMainWorld("electronApi", {
  send: (channel, ...args) => {
    let validChannels = [
      "fileStoreSet",
      "fileStoreRemove",
      "checkRegistrars",
      "getAllDomains",
      "updateDomains",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  invoke: (channel, ...args) => {
    let validChannels = ["fileStoreInit", "fileStoreGet"];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
  receive: (channel, func) => {
    let validChannels = [
      "checkedRegistrar",
      "getAllDomainsCompleted",
      "getAllDomainsUpdate",
      "checkRegistrarsCompleted",
      "updateDomainsPartial",
      "updateDomainsRegistrar",
      "updateDomainsCompleted",
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  openExternalLink: (href, options) => {
    shell.openExternal(href, options);
  },
});
