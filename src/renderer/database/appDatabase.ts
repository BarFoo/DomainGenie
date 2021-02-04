import Dexie from "dexie";
import type { Domain } from "./domain";

export class AppDatabase extends Dexie {
  domains: Dexie.Table<Domain, string>;

  // Change this when adding new tables to the database in future
  // @todo: Explore alternative ways to handle version number
  public static readonly APP_DATABASE_VERSION = 1;

  constructor() {
    super("DomainGenie");
    this.version(AppDatabase.APP_DATABASE_VERSION).stores({
      domains: ` 
        &domainName, 
        registrar, 
        registrationDate,
        expiryDate`,
    });
  }
}
