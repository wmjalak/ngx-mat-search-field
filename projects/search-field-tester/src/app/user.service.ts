import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SearchFieldService, SearchFieldItem } from 'ngx-mat-search-field';

export interface UserItem {
  id: number;
  name: string;
  location: string;
}

@Injectable()
export class UserService implements SearchFieldService {
  constructor(private http: HttpClient) {}

  getSearchFieldItems(
    namespaceIdentifier: string,
    search: string,
    size: number,
    skip: number
  ): Observable<SearchFieldItem[]> {
    // console.log(namespaceIdentifier);
    search = search.toLowerCase();
    return this.http.get('./assets/users.json').pipe(
      map((data: UserItem[]) =>
        data
          .filter(
            (userItem: UserItem) =>
              userItem.name.toLowerCase().indexOf(search) > -1 || search === ''
          )
          .map((item: UserItem) => {
            if (item.location) {
              return new SearchFieldItem(item.id, `${item.name}|${item.location}`);
            } else {
              return new SearchFieldItem(item.id, `${item.name}`);
            }
          })
      ),
      map(data => {
        const result = data.slice(skip, size + skip);
        return result;
      })
    );
  }
}
