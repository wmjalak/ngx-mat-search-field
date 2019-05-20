import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SearchFieldService, SearchFieldItem } from 'ngx-mat-search-field';

export interface ResultItem {
  id: number;
  name: string;
  location: string;
}

@Injectable()
export class UserService implements SearchFieldService {
  constructor(private http: HttpClient) {}

  /**
   * Fetch data and transform it to SearchFieldItem array
   * @param namespaceIdentifier element name property
   * @param search search text
   * @param size result-set max-size
   * @param skip skip from the beginning
   */
  getSearchFieldItems(
    namespaceIdentifier: string,
    search: string,
    size: number,
    skip: number
  ): Observable<SearchFieldItem[]> {
    const fileName = namespaceIdentifier === 'user-search' ? 'users' : 'hobbies';
    search = search.toLowerCase();
    return this.http.get(`./assets/${fileName}.json`).pipe(
      map((data: ResultItem[]) =>
        data
          .filter(
            (userItem: ResultItem) =>
              userItem.name.toLowerCase().indexOf(search) > -1 || search === ''
          )
          .map((item: ResultItem) => {
            if (item.location) {
              return new SearchFieldItem(item.id, `${item.name}|${item.location}`);
            } else {
              return new SearchFieldItem(item.id, `${item.name}`);
            }
          })
      ),
      map(data => {
        return data.slice(skip, size + skip);
      })
    );
  }
}
