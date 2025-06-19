import {Component, ElementRef, EventEmitter, Input, NgModule, OnDestroy, OnInit, Output} from '@angular/core';
import {ItemEvent, mode, Plate, PlateInterface} from "../plate.interface";
import {I18nService} from "../../../services/i18n.service";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Routing} from "../../../app-routing.module";
import {ActivatedRoute, Router, RouterModule} from "@angular/router";
import {ReactiveQueue} from "../../shared/class/reactive-queue";
import {PlateMenuItem, Status} from "../../plate-menu-items/plate-menu-item";
import {Subscription} from "rxjs";
import {CommonModule} from "@angular/common";
import {TooltipModule} from "primeng/tooltip";
import {TagModule} from "primeng/tag";
import {BadgeModule} from "primeng/badge";
import {InputTextModule} from "primeng/inputtext";
import {ColorPickerModule} from "primeng/colorpicker";
import {InputNumberModule} from "primeng/inputnumber";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {ItemComponentModule} from "../item/item.component";
import {ItemsOverlayComponentModule} from "../items-overlay/items-overlay.component";
import {ItemOverlayRowComponentModule} from "../item-overlay-row/item-overlay-row.component";
import {MenuModule} from "primeng/menu";
import {MenuItem} from 'primeng/api';

@Component({
  selector: 'plate',
  templateUrl: './plate.component.html',
  styleUrls: ['./plate.component.scss']
})
export class PlateComponent implements OnInit, OnDestroy {

  @Input() public config!: Plate;
  @Input() public plateList: Plate[] = [];
  @Input() public queue!: ReactiveQueue<PlateMenuItem>;

  get chunk(): number {
    return this._display_chunk;
  }

  @Input() set chunk(value: number) {
    this._display_chunk = value;
    this._elementRef.nativeElement.style.setProperty("--items-chunk", value);
  }

  @Output() public onNew: EventEmitter<Plate> = new EventEmitter<Plate>(true);
  @Output() public onItemEvent: EventEmitter<ItemEvent> = new EventEmitter<ItemEvent>(false);
  @Output() public viewModeChange: EventEmitter<'rows'|'columns'> = new EventEmitter<'rows'|'columns'>();

  public readonly i18n: any;

  public icon: string = "pi-plus";
  public plateMode: typeof PlateInterface = mode();
  public form?: FormGroup | undefined;
  public showExpand: boolean = true;
  public readonly: boolean = false;
  public badgeSize: string = "large";
  public badgeColor: string = "info";
  public showOverlay: boolean = false;
  public showSortOverlay: boolean = false;
  public progressItems: PlateMenuItem[] = [];
  public todoItems: PlateMenuItem[] = [];
  public sortingOptions: MenuItem[] = [];
  public selectedSortingType: SortType = "DATE_ASC";
  public viewMode: 'rows' | 'columns' = 'rows';

  private queue$: Subscription = new Subscription();
  private _display_chunk: number = 20;

  constructor(public i18nService: I18nService,
              private _route: ActivatedRoute,
              private _elementRef: ElementRef,
              private _router: Router) {
    this.i18n = i18nService.instance;
    this._elementRef.nativeElement.style.setProperty("--items-chunk", this._display_chunk);
    this.viewMode = this.showExpand ? 'rows' : 'columns';
  }

  public ngOnInit(): void {
    this._route.params.subscribe(
      params => {
        this.showExpand = !params["id"];
        this.readonly = !this.showExpand;
        this.viewMode = 'columns'; // default is columns view mode for expanded plate
      }
    );

    this.queue$.add(this.queue?.values$?.subscribe((items: PlateMenuItem[] = []) => {
        this.progressItems = [];
        this.todoItems = [];
        for (const i of items) {
          if (i.status === Status.Progress)
            this.progressItems.push(i);
          else
            this.todoItems.push(i);
        }
        if (this.todoItems.length == 0) {
          this.showOverlay = false;
        }
      })
    );

    this.sortingOptions = [{
      label: 'Ordine',
      items: [
        {
          label: 'Crescente',
          icon: 'pi pi-sort-numeric-down',
          command: event => this.sort('ORDER_ASC'),
        },
        {
          label: 'Decrescente',
          icon: 'pi pi-sort-numeric-up-alt',
          command: event => this.sort('ORDER_DESC'),
        }
      ]
    },
      {
        label: 'Data Creazione',
        items: [
          {
            label: 'Crescente',
            icon: 'pi pi-sort-amount-up',
            command: event => this.sort('DATE_ASC'),
          },
          {
            label: 'Decrescente',
            icon: 'pi pi-sort-amount-down-alt',
            command: event => this.sort('DATE_DESC'),
          }
        ]
      }];

      this.viewMode = this.config.viewMode || 'rows';
  }

  public ngOnDestroy(): void {
    this.queue$.unsubscribe();
  }

  public onMouseEnter(): void {
    setTimeout(() => this.icon = "pi-plus-circle", 300);
  }

  public onMouseLeave(): void {
    setTimeout(() => this.icon = "pi-plus", 500);
  }

  public sort(type: SortType) {
    this.selectedSortingType = type;
    switch (type) {
      case "DATE_ASC":
        this.progressItems.sort((a: PlateMenuItem, b: PlateMenuItem) => {
          if (new Date(a.createdDate!) < new Date(b.createdDate!))
            return -1;
          else
            return 1;
        })
        this.todoItems.sort((a: PlateMenuItem, b: PlateMenuItem) => {
          if (new Date(a.createdDate!) < new Date(b.createdDate!))
            return -1;
          else
            return 1;
        })
        break;
      case "DATE_DESC":
        this.progressItems.sort((a: PlateMenuItem, b: PlateMenuItem) => {
          if (new Date(a.createdDate!) > new Date(b.createdDate!))
            return -1;
          else
            return 1;
        })
        this.todoItems.sort((a: PlateMenuItem, b: PlateMenuItem) => {
          if (new Date(a.createdDate!) > new Date(b.createdDate!))
            return -1;
          else
            return 1;
        })
        break;
      case "ORDER_ASC":
        this.progressItems.sort((a: PlateMenuItem, b: PlateMenuItem) => {
          if (a.orderNumber! < b.orderNumber!)
            return -1;
          else
            return 1;
        })
        this.todoItems.sort((a: PlateMenuItem, b: PlateMenuItem) => {
          if (a.orderNumber! < b.orderNumber!)
            return -1;
          else
            return 1;
        })
        break;
      case "ORDER_DESC":
        this.progressItems.sort((a: PlateMenuItem, b: PlateMenuItem) => {
          if (a.orderNumber! > b.orderNumber!)
            return -1;
          else
            return 1;
        })
        this.todoItems.sort((a: PlateMenuItem, b: PlateMenuItem) => {
          if (a.orderNumber! > b.orderNumber!)
            return -1;
          else
            return 1;
        })
        break;
      default:
        break;
    }

    if (this.showSortOverlay)
      this.showSortOverlay = false;
  }

  public onSubmit(): void {
    this.onNew.emit({
      name: this.form?.get("name")?.value,
      color: this.form?.get("color")?.value,
      slot: [0, this.form?.get("number")?.value],
      mode: PlateInterface.On
    } as Plate);
  }

  public loadForm(): void {
    this.form = new FormGroup({
      name: new FormControl("", Validators.required),
      color: new FormControl("", Validators.required),
      number: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")])
    });
    this.config.mode = PlateInterface.Form;
  }

  public discardForm(): void {
    this.config.mode = PlateInterface.Skeleton;
  }

  public expandTab(): void {
    window.open(`#/${Routing.Plates}/${this.config.id!}`, '_blank');
  }

  public onBadgeMouseEnter(): void {
    this.badgeSize = "xlarge";
    this.badgeColor = "danger";
  }

  public onBadgeMouseLeave(): void {
    if (!this.showOverlay) {
      this.badgeSize = "large";
      this.badgeColor = "info";
    }
  }

  public onBadgeMouseClick(): void {
    this.showOverlay = !this.showOverlay;
    if (this.showOverlay)
      this.onBadgeMouseEnter();
    else
      this.onBadgeMouseLeave();
  }

  public handleItemEvent(event: ItemEvent) {
    event.plateId = this.config.id!;

    this.onItemEvent.emit(event);
  }

  public onItemStart(item: PlateMenuItem) {
    const event: ItemEvent = {
      action: Status.Progress,
      item: item,
      plateId: this.config.id!
    }

    this.onItemEvent.emit(event);
  }

  public onViewMode(mode: 'rows' | 'columns') {
    this.viewMode = mode;
    if (this.showExpand) {
      this.viewModeChange.emit(mode);
    }
  }
}

@NgModule({
  imports: [
    CommonModule,
    TooltipModule,
    TagModule,
    BadgeModule,
    ReactiveFormsModule,
    InputTextModule,
    ColorPickerModule,
    InputNumberModule,
    ButtonModule,
    RippleModule,
    ItemComponentModule,
    ItemsOverlayComponentModule,
    ItemOverlayRowComponentModule,
    RouterModule,
    MenuModule
  ],
  declarations: [PlateComponent],
  exports: [PlateComponent]
})
export class PlateComponentModule {
}

export type SortType = 'ORDER_DESC' | 'ORDER_ASC' | 'DATE_DESC' | 'DATE_ASC';
