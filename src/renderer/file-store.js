const Store = require("electron-store");
import { encryptionKey } from "./stores";

let store;

export const getFileStore = (name) => {
  if (store) {
    return store.get(name);
  } else {
    return null;
  }
};

export const setFileStore = (name, value) => {
  if (store) {
    return store.set(name, value);
  } else {
    throw new Error("Store isn't available!");
  }
};

encryptionKey.subscribe((newValue) => {
  try {
    // This is in a try catch because the encryption key could be incorrectly entered.
    // That is intended, so nothing wrong with silently failing here.
    store = new Store({
      encryptionKey: newValue,
    });
  } catch {}
});
