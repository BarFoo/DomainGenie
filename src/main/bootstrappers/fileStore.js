import { ipcMain } from "electron";
import { mainFileStore } from "../mainFileStore";

const log = require("electron-log");

/**
 * Registers ipc handlers for the file store. Use these instead of using store directly in renderer!
 */
export default function () {
  ipcMain.handle("file-store-init", (e, encryptionKey) => {
    return mainFileStore.init(encryptionKey);
  });
  ipcMain.handle("file-store-get", (e, name, defaultValue) => {
    return mainFileStore.get(name, defaultValue);
  });
  ipcMain.on("file-store-set", (e, name, value) => {
    mainFileStore.set(name, value);
  });
  ipcMain.on("file-store-remove", (e, name) => {
    mainFileStore.remove(name);
  });
}
