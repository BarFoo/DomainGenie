import type { NameFilterType } from "../constants/nameFilterType";

export interface DomainFilters {
  name?: string;
  nameType?: NameFilterType;
  expires?: number;
  orderBy: string;
  isDescending: boolean;
}
