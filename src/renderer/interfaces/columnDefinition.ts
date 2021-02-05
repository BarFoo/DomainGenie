export interface ColumnDefinition {
  key: string;
  headerText: string;
  formatter?: Function;
  hasEmphasis?: boolean;
  hasLight?: boolean;
}
