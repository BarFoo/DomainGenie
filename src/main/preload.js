import { contextBridge, ipcRenderer, shell } from "electron";

contextBridge.exposeInMainWorld("electronApi", {
  send: (channel, ...args) => {
    let validChannels = ["file-store-set", "file-store-remove"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  invoke: (channel, ...args) => {
    let validChannels = [
      "file-store-init",
      "file-store-get",
      "check-registrars",
      "get-all-domains",
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
  receive: (channel, func) => {
    let validChannels = [];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  openExternalLink: (href, options) => {
    shell.openExternal(href, options);
  },
});
