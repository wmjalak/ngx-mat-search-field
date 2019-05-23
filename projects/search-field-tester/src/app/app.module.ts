import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material';

import { AppComponent } from './app.component';
import { ComicService } from './comic.service';
import { SearchFieldModule } from 'ngx-mat-search-field';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserAnimationsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    SearchFieldModule
  ],
  providers: [
    ComicService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
