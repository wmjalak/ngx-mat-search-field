import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SearchFieldDataSource, SearchFieldResult } from 'ngx-mat-search-field';

import { ComicService } from './comic.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  form: FormGroup;

  dataSource: SearchFieldDataSource;

  constructor(formBuilder: FormBuilder, private comicService: ComicService) {
    this.form = formBuilder.group({
      user1: '',
      user2: ''
    });

    this.form.valueChanges.subscribe(item => {
      console.log(item);
    });

    this.dataSource = {
      search(search: string, size: number, skip: number): Observable<SearchFieldResult> {
        return comicService.getCharacters(search, size, skip);
      }
    };
  }
}
