# ngx-mat-search-field

Angular component providing an input field for searching.

## Try it

## Getting started

Install `ngx-mat-search-field` to your project:
```
npm install ngx-mat-search-field
```

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

Create the service that implements `SearchFieldService`:
```typescript
import { SearchFieldService, SearchFieldItem } from 'ngx-mat-search-field';

@Injectable()
export class TestService implements SearchFieldService {

  getSearchFieldItems(
    namespaceIdentifier: string,
    search: string,
    size: number,
    skip: number
  ): Observable<SearchFieldItem[]> {

    const testData: SearchFieldItem[] = [
      {
        id: 1,
        title: 'Test Item 1'
      },
      {
        id: 2,
        title: 'Test Item 2'
      }
    ];

    const result = testData.filter(
      item => item.title.toLowerCase().indexOf(search) > -1 || search === ''
    );
    return of(result);
}
```
Provide the service `SearchFieldService` in your `app.module.ts`:
```typescript
providers: [
  {
    provide: SearchFieldService,
    useClass: TestService
  }
]
```

Use the component in your code:

```html
<mat-form-field>
  <ngx-mat-search-field
    placeholder="Test items">
  </ngx-mat-search-field>
</mat-form-field>
```


## Properties

| Name  | Description |
| :---- | :---------- |
| `prefetch` | When `true` the data is prefetched. When `false` the data is fetched when field gets focused. |

## Development

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.1.

### Development server

Run `ng serve` for a dev server to test the library. Navigate to `http://localhost:4200/`.

### Build

Run `npm run build-lib` to build the search-field project. The build artifacts will be stored in the `dist/` directory.

### Build and NPM Package

Run `npm run package` to build and package the search-field project. The build artifacts will be stored in the `dist/` directory.
