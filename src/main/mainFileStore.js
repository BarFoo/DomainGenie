const Store = require("electron-store");

class MainFileStore {
  store;

  /**
   * Initialize the store with the given encryption key. This can be used for both
   * initialization and resetting, though I may split the two out in future if needed.
   * @param {string} encryptionKey
   */
  init(encryptionKey) {
    let isValid = false;
    try {
      this.store = new Store({
        encryptionKey: encryptionKey,
      });
      this.store.set("check", true);
      isValid = true;
    } catch (ex) {
      this.store = undefined;
    }
    return Promise.resolve(isValid);
  }

  /**
   * Set the value to the given name in the store
   * @param {string} name
   * @param {*} value
   */
  set(name, value) {
    if (this.store) {
      this.store.set(name, value);
    } else {
      throw new Error("FileStore has not been initialized yet!");
    }
  }

  /**
   * Get the value of the given name from the store
   * @param {*} name
   */
  get(name, defaultValue) {
    if (this.store) {
      return this.store.get(name, defaultValue);
    } else {
      throw new Error("FileStore has not been initialized yet!");
    }
  }

  /**
   * Remove the given name from the store
   * @param {string} name
   */
  remove(name) {
    if (this.store) {
      this.store.remove(name);
    } else {
      throw new Error("FileStore has not been initialized yet!");
    }
  }
}

export const mainFileStore = new MainFileStore();
