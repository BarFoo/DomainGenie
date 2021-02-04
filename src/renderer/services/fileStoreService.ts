/**
 * A service responsible for communicating with the main process file store.
 *
 * This is simply a wrapper around different ipc channels.
 */
export default class FileStoreService {
  init(encryptionKey: string): Promise<boolean> {
    return window.electronApi.invoke("file-store-init", encryptionKey);
  }
  get<T>(name: string, defaultValue?: T): Promise<T> {
    return window.electronApi.invoke("file-store-get", name, defaultValue);
  }
  set(name: string, value: any) {
    window.electronApi.send("file-store-set", name, value);
  }
  remove(name: string) {
    window.electronApi.send("file-store-remove", name);
  }
}
