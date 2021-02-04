import { ipcMain } from "electron";
import { mainFileStore } from "../mainFileStore";

const log = require("electron-log");

/**
 * Registers ipc handlers for the file store. Use these instead of using store directly in renderer!
 */
export default function () {
  ipcMain.handle("file-store-init", (e, encryptionKey) => {
    log.debug("Received file-store-init");
    return mainFileStore.init(encryptionKey);
  });
  ipcMain.handle("file-store-get", (e, name, defaultValue) => {
    log.debug("Received file-store-get, name: ", name);
    return mainFileStore.get(name, defaultValue);
  });
  ipcMain.on("file-store-set", (e, name, value) => {
    log.debug("Received file-store-set handle, name:", name);
    mainFileStore.set(name, value);
  });
  ipcMain.on("file-store-remove", (e, name) => {
    log.debug("Received file-store-remove, name: ", name);
    mainFileStore.remove(name);
  });
}
