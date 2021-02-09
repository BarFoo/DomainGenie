export interface DomainFilters {
  name?: string;
  nameServer?: string;
  onlyShowEmptyNameServers?: boolean;
  expires?: number;
  orderBy: string;
  isDescending: boolean;
}
