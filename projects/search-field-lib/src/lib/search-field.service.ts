import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SearchFieldItem } from './search-field-item';

@Injectable()
export abstract class SearchFieldService {
  abstract getSearchFieldItems(name: string, search: string, size: number, skip: number): Observable<SearchFieldItem[]>;
}
