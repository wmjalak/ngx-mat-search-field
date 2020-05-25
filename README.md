ngx-mat-search-field
========================

[![npm](https://img.shields.io/npm/v/ngx-mat-search-field.svg?maxAge=2592000?style=flat-square)](https://www.npmjs.com/package/ngx-mat-search-field)
[![npm](https://img.shields.io/npm/dm/ngx-mat-search-field.svg)](https://www.npmjs.com/package/ngx-mat-search-field)


Angular 9 component providing an input field for searching.

## Try it

Demo running at:

https://stackblitz.com/edit/ngx-mat-search-field-demo

## Installation

```
npm i ngx-mat-search-field
```

## API

`import { SearchFieldModule } from 'ngx-mat-search-field'`<br>
`selector: ngx-mat-search-field`

### @Inputs()

| Input            | Type    | Required                   | Description                                                                                               |
| ---------------- | ------- | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| dataSource           | object  | **YES**                    | the search field's source of data which is provided as a search-function |
| prefetch     | boolean  | Optional, default: true     | if true, it prefetches the data, if false, the data is fetched when the field gets focused  |
| maxRows     | number  | Optional, default: 8     | number of items in one fetch  |

## Usage

Import the `SearchFieldModule` in your `app.module.ts`:
```typescript
import { SearchFieldModule } from 'ngx-mat-search-field';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    ReactiveFormsModule,
    SearchFieldModule
  ],
})
export class AppModule {}
```

Provide a DataSource that defines the `search` method:

```typescript
import { SearchFieldDataSource, SearchFieldResult } from 'ngx-mat-search-field';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

  searchFieldDataSource: SearchFieldDataSource;

  constructor(private userService: UserService) {
    this.searchFieldDataSource = {
      search(search: string, size: number, skip: number): Observable<SearchFieldResult> {
        return userService.getUsers(search, size, skip);
      }
    };
  }
}
```

Use it in your component:

```html
<mat-form-field>
  <ngx-mat-search-field
    [dataSource]="searchFieldDataSource"
    placeholder="User"
  ></ngx-mat-search-field>
</mat-form-field>
```

## Development

### Development server

Run `ng serve` for a dev server to test the library. Navigate to `http://localhost:4200/`.

### Build

Run `npm run build-lib` to build the search-field project. The build artifacts will be stored in the `dist/` directory.

### Build and NPM Package

Run `npm run package` to build and package the search-field project. The build artifacts will be stored in the `dist/` directory.
