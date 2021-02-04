export interface ElectronApi {
  send(channel, ...args);
  invoke<TResponse>(channel, ...args): Promise<TResponse>;
  receive(channel, ...args);
  openExternal(href, options?);
}
