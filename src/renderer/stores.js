import { writable, readable } from "svelte/store";

export const encryptionKey = writable();
export const defaultDateFormat = readable("MMM DD YYYY");
