import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SearchFieldDataSource, SearchFieldResult } from 'ngx-mat-search-field';

import { UserService } from './user.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  form: FormGroup;

  dataSource: SearchFieldDataSource;

  formControl1: FormControl;

  constructor(formBuilder: FormBuilder, private userService: UserService) {

    this.formControl1 = new FormControl({ value: '', disabled: false }, Validators.required);

    this.form = new FormGroup({
      user1: this.formControl1,
      user2: new FormControl('', Validators.required)
    });

    this.form.valueChanges.subscribe(item => {
      console.log(item);
    });

    this.dataSource = {
      search(search: string, size: number, skip: number): Observable<SearchFieldResult> {
        return userService.getCharacters(search, size, skip);
      }
    };

    setTimeout(() => {
      // this.formControl1.enable();
    }, 2000);

  }
}
