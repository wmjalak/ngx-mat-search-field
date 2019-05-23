import { Observable } from 'rxjs';

export interface SearchFieldInfo {
  count: number;
}

export interface SearchFieldItem {
  title: string;
  value: any;
}

export interface SearchFieldResult {
  info: SearchFieldInfo;
  items: SearchFieldItem[];
}

export interface SearchFieldDataSource {
  search: (search: string, size: number, skip: number) => Observable<SearchFieldResult>;
}
