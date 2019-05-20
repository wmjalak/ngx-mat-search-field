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
import {
  FormBuilder,
  FormControl,
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  NgControl
} from '@angular/forms';
import { Observable, of, merge, empty, Subject, fromEvent, pipe } from 'rxjs';
import {
  startWith,
  debounceTime,
  defaultIfEmpty,
  finalize,
  map,
  switchMap,
  takeUntil
} from 'rxjs/operators';

import { SearchFieldService } from './search-field.service';
import { SearchFieldItem } from './search-field-item';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import { MatFormFieldControl } from '@angular/material';

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
  @ViewChild('input') inputRef: ElementRef;
  @ViewChild('auto') autocompleteRef: MatAutocomplete;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;

  @Input() name: string;
  @Input() prefetch = 'true';
  _maxRows = 8;
  @Input()
  get maxRows() {
    return this._maxRows;
  }
  set maxRows(val: number) {
    this._maxRows = Number(val);
    this.stateChanges.next();
  }

  skipIndex = 0;
  readOnly = false;
  /**
   * formControl required object: tell the controlGroup, that data is refreshed (so poll it)
   */
  _onChange: (_: any) => void;

  @HostBinding() id = `app-custom-search-field-${SearchFieldComponent.nextId}`;

  _value: number;

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
  get value(): number {
    return this._value;
  }
  set value(val: number) {
    this._value = val;
    this.readOnly = this._value !== undefined;
    this.stateChanges.next();
    this._onChange(this._value);
  }

  /**
   * Return empty for Material
   */
  get empty(): boolean {
    // return this.lookupValue === '';
    return this.inputRef.nativeElement.value === '';
  }

  _focused = false;
  @Input() get focused() {
    return this._focused;
  }

  set focused(_focused: boolean) {
    if (_focused && this.prefetch === 'false') {
      this.autoCompleteControl.updateValueAndValidity();
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
  set disabled(dis) {
    this._disabled = coerceBooleanProperty(dis);
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
    private searchFieldService: SearchFieldService,
    private elRef: ElementRef<HTMLElement>
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
  }

  writeValue(obj: any): void {}

  registerOnChange(fn: (v: any) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {}

  setDisabledState(isDisabled: boolean): void {}

  getSearchFieldItems(): Observable<SearchFieldItem[]> {
    let lookupValue = this.autoCompleteControl.value;
    if (!lookupValue) {
      lookupValue = '';
    }
    this.isLoading = true;
    return this.searchFieldService
      .getSearchFieldItems(this.name, lookupValue, this.maxRows, this.skipIndex * this.maxRows)
      .pipe(finalize(() => (this.isLoading = false)));
  }

  ngOnInit() {
    this.initializeInputControl();
  }

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
            if (this.prefetch === 'false' && !this.focused) {
              return of([]); // return empty set by default
            }
            return this.getSearchFieldItems();
          } else {
            // if no value is present, return null
            return of(null);
          }
        })
      )
      .subscribe((fieldItems: SearchFieldItem[]) => {
        this.items = fieldItems;
      });
  }

  optionSelected(event: MatAutocompleteSelectedEvent) {
    const itemId = parseInt(event.option.id, 10);
    if (itemId === -1) {
      this.focused = false;
      return;
    }
    this.value = itemId;
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

  getSecondRow(value: string): string {
    return this.hasSecondRow(value) ? value.split('|')[1] : undefined;
  }

  clear() {
    this.value = undefined;
    this.autoCompleteControl.setValue('');
    this.inputRef.nativeElement.value = '';
  }

  autocompleteScroll() {
    setTimeout(() => {
      if (this.autocompleteRef && this.autocompleteTrigger && this.autocompleteRef.panel) {
        fromEvent(this.autocompleteRef.panel.nativeElement, 'scroll')
          .pipe(
            map(x => this.autocompleteRef.panel.nativeElement.scrollTop),
            takeUntil(this.autocompleteTrigger.panelClosingActions)
          )
          .subscribe((x: number) => {
            const scrollTop = this.autocompleteRef.panel.nativeElement.scrollTop;
            const scrollHeight = this.autocompleteRef.panel.nativeElement.scrollHeight;
            const elementHeight = this.autocompleteRef.panel.nativeElement.clientHeight;
            const atBottom = scrollHeight <= scrollTop + elementHeight;

            if (atBottom) {
              // reached the bottom
              this.skipIndex++; // increase skipping index
              this.getSearchFieldItems().subscribe((fieldItems: SearchFieldItem[]) => {
                this.items = [...this.items, ...fieldItems]; // add more items to the list
              });
            }
          });
      }
    });
  }
}
