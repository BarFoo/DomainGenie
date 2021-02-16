export interface DomainFilters {
  orderBy: string;
  isDescending: boolean;
  name?: string;
  nameServer?: string;
  onlyShowEmptyNameServers?: boolean;
  onlyShowNoAutoRenewal?: boolean;
  onlyShowWithAutoRenewal?: boolean;
  onlyShowNoPrivacy?: boolean;
  onlyShowWithPrivacy?: boolean;
  expires?: number;
}
