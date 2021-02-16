import Store from "electron-store";

class MainFileStore {
  store: Store;

  /**
   * Initialize the store with the given encryption key. This can be used for both
   * initialization and resetting, though I may split the two out in future if needed.
   * @param {string} encryptionKey
   */
  init(encryptionKey: string) {
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
  set(name: string, value: any) {
    if (this.store) {
      this.store.set(name, value);
    } else {
      throw new Error("FileStore has not been initialized yet!");
    }
  }

  /**
   * Get the value of the given name from the store
   * @param {string} name
   * @param {*} defaultValue
   */
  get(name: string, defaultValue?: any) {
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
  remove(name: string) {
    if (this.store) {
      this.store.reset(name);
    } else {
      throw new Error("FileStore has not been initialized yet!");
    }
  }
}

export const mainFileStore = new MainFileStore();
