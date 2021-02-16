import { ipcMain } from "electron";
import { mainFileStore } from "../mainFileStore";

/**
 * Registers ipc handlers for the file store. Use these instead of using store directly in renderer!
 */
export default function () {
  ipcMain.handle("fileStoreInit", (e, encryptionKey) => {
    return mainFileStore.init(encryptionKey);
  });
  ipcMain.handle("fileStoreGet", (e, name, defaultValue) => {
    return mainFileStore.get(name, defaultValue);
  });
  ipcMain.on("fileStoreSet", (e, name, value) => {
    mainFileStore.set(name, value);
  });
  ipcMain.on("fileStoreRemove", (e, name) => {
    mainFileStore.remove(name);
  });
}
