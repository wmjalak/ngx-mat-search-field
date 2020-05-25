import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  Component,
  forwardRef,
  OnInit,
  OnDestroy,
  AfterViewInit,
  Injector,
  Input,
  HostBinding,
  ElementRef,
  ViewChild,
  Optional,
  Self
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import {
  FormBuilder,
  FormControl,
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  NgControl
} from '@angular/forms';
import { Observable, of, Subject, fromEvent } from 'rxjs';
import {
  startWith,
  debounceTime,
  finalize,
  switchMap,
  takeUntil,
} from 'rxjs/operators';

import { SearchFieldItem, SearchFieldDataSource, SearchFieldResult } from './types';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import { MatFormFieldControl } from '@angular/material/form-field';

@Component({
  // tslint:disable-next-line:component-select§or
  selector: 'ngx-mat-search-field',
  templateUrl: './search-field.component.html',
  styleUrls: ['./search-field.component.css'],

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchFieldComponent),
      multi: true
    },
    {
      provide: MatFormFieldControl,
      useExisting: SearchFieldComponent
    }
  ]
})
export class SearchFieldComponent
  implements ControlValueAccessor, MatFormFieldControl<number>, OnInit, OnDestroy, AfterViewInit {
  static nextId = 0;

  /**
   * MatFormField required object: tell the parent to run changeDetection
   */
  stateChanges = new Subject<void>();

  // @ViewChild('input') inputField: MatInput;
  @ViewChild('input') inputRef!: ElementRef;
  @ViewChild('auto') autocompleteRef!: MatAutocomplete;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger!: MatAutocompleteTrigger;

  _dataSource: SearchFieldDataSource;
  @Input()
  get dataSource(): SearchFieldDataSource {
    return this._dataSource;
  }
  set dataSource(val: SearchFieldDataSource) {
    this._dataSource = val;
  }

  @Input() name: string;
  @Input() prefetch = 'true';
  private _maxRows = 8;
  @Input()
  get maxRows() {
    return this._maxRows;
  }
  set maxRows(val: number) {
    this._maxRows = Number(val);
    this.stateChanges.next();
  }

  skipIndex = 0;
  resultCount = 0;
  readOnly = false;
  /**
   * formControl required object: tell the controlGroup, that data is refreshed (so poll it)
   */
  _onChange: (_: any) => void;

  @HostBinding() id = `app-custom-search-field-${SearchFieldComponent.nextId}`;

  _value: any;

  /**
   * MatFormField (required) self-explaining attributes
   */
  readonly autofilled: boolean;
  private _disabled = false;
  // focused = false;

  errorState = false;
  controlType = 'app-custom-search-field';

  @HostBinding('attr.aria-describedby') describedBy = '';
  private _required = false;

  /**
   * value setter and getter
   *
   * we need to implement stateChanges (Material) and call the formControl callback on change as well.
   */
  @Input()
  get value(): any {
    return this._value;
  }
  set value(val: any) {
    this._value = val;
    this.readOnly = this._value !== undefined;
    this.stateChanges.next();
    if (this._onChange) {
      this._onChange(this._value);
    }
  }

  /**
   * Return empty for Material
   */
  get empty(): boolean {
    return this.inputRef ? this.inputRef.nativeElement.value === '' : true;
  }

  _focused = false;
  @Input() get focused() {
    return this._focused;
  }

  set focused(_focused: boolean) {
    if (_focused) {
      if (!this.isPrefetch()) {
        this.autoCompleteControl.updateValueAndValidity();
      }
      this.autocompleteScroll(); // https://github.com/angular/components/issues/13650
    }
    this._focused = _focused;
  }

  /**
   * The Material "floating label" effect, we do not really use this.
   */
  @HostBinding('class.floating')
  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  @Input()
  get required() {
    return this._required;
  }
  set required(req) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }

  @Input()
  get disabled() {
    return this._disabled;
  }
  set disabled(dis: boolean) {
    this._disabled = coerceBooleanProperty(dis);
    this._disabled ? this.autoCompleteControl.disable() : this.autoCompleteControl.enable();
    this.stateChanges.next();
  }

  // defining placeholder as an attribute for custom element
  private _placeholder: string;
  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  ngControl = null;
  touched: boolean;
  isLoading = false;

  autoComplete$: Observable<SearchFieldItem[]> = null;
  autoCompleteControl = new FormControl();
  items: SearchFieldItem[] = [];

  setDescribedByIds(ids: string[]): void {
    this.describedBy = ids.join(' ');
  }

  onContainerClick(event: MouseEvent): void {}

  getSearchItems = (lookup: string) => {};

  constructor(
    // @Optional() @Self() public ngControl: NgControl,
    fb: FormBuilder,
    private fm: FocusMonitor,
    public injector: Injector,
    private elRef: ElementRef<HTMLElement>,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer
  ) {
    fm.monitor(elRef.nativeElement, true).subscribe(origin => {
      this.focused = !!origin;
      this.stateChanges.next();
    });

    // // Setting the value accessor directly (instead of using
    // // the providers) to avoid running into a circular import.
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }

    iconRegistry.addSvgIconLiteral(
      'close',
      sanitizer.bypassSecurityTrustHtml(`
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
<path d="M0 0h24v24H0z" fill="none"/>
</svg>
      `)
    );
    this.initializeInputControl();
  }

  writeValue(obj: any): void {
    if (obj === undefined) {
      this.clear();
    } else if (obj !== '') {
      this.value = obj;
    }
  }

  registerOnChange(fn: (v: any) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {}

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    isDisabled ? this.autoCompleteControl.disable() : this.autoCompleteControl.enable();
  }

  getSearchFieldItems(skipIndex: number = 0): Observable<SearchFieldResult> {
    let lookupValue = this.autoCompleteControl.value;
    if (!lookupValue) {
      lookupValue = '';
    }
    if (this.dataSource) {
      this.isLoading = true;
      return this.dataSource
        .search(lookupValue, this.maxRows, skipIndex * this.maxRows)
        .pipe(finalize(() => (this.isLoading = false)));
    } else {
      return of(null);
    }
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.stateChanges.complete();
  }

  ngAfterViewInit() {}

  initializeInputControl() {
    this.autoCompleteControl.valueChanges
      .pipe(
        // prePipes,
        startWith(null),
        // delay emits
        debounceTime(300),
        // use switch map so as to cancel previous subscribed events, before creating new once
        switchMap(lookup => {
          if (this.value === undefined) {
            this.skipIndex = 0; // clear skipping index
            this.autocompleteRef._setScrollTop(0); // scroll back to top
            if ((!this.isPrefetch() && !this.focused) || this._disabled) {
              return of([]); // return empty set by default
            }
            return !this.hasItemsInList() || lookup !== undefined
              ? this.getSearchFieldItems()
              : of(null);
          } else {
            // if value is present, return null
            return of(null);
          }
        })
      )
      .subscribe((result: SearchFieldResult) => {
        this.handleSearchFieldResult(result);
      });
  }

  optionSelected(event: MatAutocompleteSelectedEvent) {
    this.value = event.option.id;
  }

  getTitle(value: string): string {
    if (value) {
      const splitted = value.split('|');
      return splitted.length > 1 ? splitted[0] : value;
    }
    return '';
  }

  hasSecondRow(value: string): boolean {
    return value ? value.split('|').length > 0 : false;
  }

  private hasItemsInList(): boolean {
    return this.items.length > 0;
  }

  private isPrefetch(): boolean {
    return this.prefetch ? this.prefetch !== 'false' : true;
  }

  getSecondRow(value: string): string {
    return this.hasSecondRow(value) ? value.split('|')[1] : undefined;
  }

  clear() {
    this.items = [];
    if (this.inputRef) {
      this.inputRef.nativeElement.value = '';
      this.inputRef.nativeElement.blur();
    }
    this.value = undefined;
    this.autoCompleteControl.setValue(undefined);
  }

  autocompleteScroll() {
    setTimeout(() => {
      if (this.autocompleteRef && this.autocompleteTrigger && this.autocompleteRef.panel) {
        fromEvent(this.autocompleteRef.panel.nativeElement, 'scroll')
          .pipe(
            takeUntil(this.autocompleteTrigger.panelClosingActions), // observe until closed
            debounceTime(200),
            switchMap(() => {

              const scrollTop = this.autocompleteRef.panel.nativeElement.scrollTop;
              const elementHeight = this.autocompleteRef.panel.nativeElement.clientHeight; // fixed value, normally 256
              const scrollHeight = this.autocompleteRef.panel.nativeElement.scrollHeight;

              const atBottom = scrollHeight <= scrollTop + elementHeight;
              if (atBottom && !this.isLoading && scrollTop !== 0) {
                this.skipIndex++; // increase skipping index
                return this.getSearchFieldItems(this.skipIndex);
              } else {
                return of(undefined);
              }
            })
          )
          .subscribe((result: SearchFieldResult) => {
            if (result) {
              this.handleSearchFieldResult(result);
            }
          });
      }
    });
  }

  handleSearchFieldResult(result: SearchFieldResult) {
    if (result && result.items) {
      this.items = this.skipIndex === 0 ? result.items : [...this.items, ...result.items];
      this.resultCount = result.info.count;
    } else {
      this.skipIndex = 0;
    }
  }
}
