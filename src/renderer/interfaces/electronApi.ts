export interface ElectronApi {
  send(channel: string, ...args);
  invoke<TResponse>(channel, ...args): Promise<TResponse>;
  receive(channel: string, callback: Function);
  openExternalLink(href: string, options?);
  stopListening(channel: string);
}
