import { writable, readable, get } from "svelte/store";
import { AppDatabase } from "./database/appDatabase";
import type { Domain } from "./database/domain";
import FileStoreService from "./services/fileStoreService";
import RegistrarService from "./services/registrarService";

export const isCheckingRegistrars = writable(false);
export const isSyncingDomains = writable(false);
export const hasSyncCompleted = writable(false);
export const isUpdatingDomains = writable(false);

// State tracking if password is entered, used by the router
// pre-conditions, to prevent components from being loaded
// if password is invalid.
export const hasEnteredPassword = writable(false);

export const fileStoreService = readable<FileStoreService>(null, (set) =>
  set(new FileStoreService())
);
export const appDatabase = readable<AppDatabase>(null, (set) =>
  set(new AppDatabase())
);
export const registrarService = readable<RegistrarService>(null, (set) =>
  set(new RegistrarService())
);

// Intentionally to be used as a store for the current domain being edited
export const singleDomainEdit = writable<Domain>(null);
