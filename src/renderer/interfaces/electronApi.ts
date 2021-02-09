export interface ElectronApi {
  send(channel, ...args);
  invoke<TResponse>(channel, ...args): Promise<TResponse>;
  receive(channel, callback: Function);
  openExternalLink(href, options?);
}
