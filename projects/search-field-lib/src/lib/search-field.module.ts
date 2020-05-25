import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldControl } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';

import { SearchFieldComponent } from './search-field.component';

@NgModule({
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  declarations: [SearchFieldComponent],
  providers: [{ provide: MatFormFieldControl, useExisting: SearchFieldComponent }],
  exports: [SearchFieldComponent]
})
export class SearchFieldModule {}
