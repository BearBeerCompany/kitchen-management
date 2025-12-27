import {Component, ElementRef, EventEmitter, Input, NgModule, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
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
import {DelayThresholdsService} from "../../../services/delay-thresholds.service";

@Component({
  selector: 'plate',
  templateUrl: './plate.component.html',
  styleUrls: ['./plate.component.scss']
})
export class PlateComponent implements OnInit, OnChanges, OnDestroy {

  @Input() public config!: Plate;
  @Input() public plateList: Plate[] = [];
  @Input() public queue!: ReactiveQueue<PlateMenuItem>;
  @Input() public showItemDelays: boolean = false;

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
  
  // Delay tracking
  public maxDelayMinutes: number = 0;
  public avgDelayMinutes: number = 0;
  public delaySeverity: 'success' | 'warning' | 'danger' = 'success';

  private queue$: Subscription = new Subscription();
  private _display_chunk: number = 20;
  private _delayUpdateInterval: any;

  constructor(public i18nService: I18nService,
              private _route: ActivatedRoute,
              private _elementRef: ElementRef,
              private _router: Router,
              private _delayThresholdsService: DelayThresholdsService) {
    this.i18n = i18nService.instance;
    this._elementRef.nativeElement.style.setProperty("--items-chunk", this._display_chunk);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    // Quando config viene settato o cambia, carica la view mode
    if (changes['config'] && changes['config'].currentValue) {
      this.loadViewModeFromStorage();
    }
  }

  public ngOnInit(): void {
    // Carica view mode da localStorage se config è già disponibile
    if (this.config?.id) {
      this.loadViewModeFromStorage();
    }
    
    this._route.params.subscribe(
      params => {
        this.showExpand = !params["id"];
        this.readonly = !this.showExpand;
        
        // Ricarica view mode dopo aver settato showExpand
        if (this.config?.id) {
          this.loadViewModeFromStorage();
        }
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
        
        // Calcola il ritardo ogni volta che cambiano gli items
        this.calculateDelay();
      })
    );

    // Aggiorna il ritardo ogni minuto
    this._delayUpdateInterval = setInterval(() => {
      this.calculateDelay();
    }, 60000); // 60 secondi

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
    if (this._delayUpdateInterval) {
      clearInterval(this._delayUpdateInterval);
    }
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

  public onViewMode(mode?: 'rows' | 'columns') {
    // Se non è specificato il mode, togglea tra rows e columns
    if (!mode) {
      this.viewMode = this.viewMode === 'rows' ? 'columns' : 'rows';
    } else {
      this.viewMode = mode;
    }
    
    // Salva in localStorage
    localStorage.setItem(`plate_viewMode_${this.config?.id || 'default'}`, this.viewMode);
    
    if (this.showExpand) {
      this.viewModeChange.emit(this.viewMode);
    }
  }

  private loadViewModeFromStorage(): void {
    if (!this.config?.id) {
      // Se non c'è ancora config, usa default
      this.viewMode = 'columns';
      return;
    }
    
    // Se è nella vista carousel (showExpand = true), forza sempre rows
    if (this.showExpand) {
      this.viewMode = 'rows';
      return;
    }
    
    // Se è espansa, carica da localStorage
    const savedViewMode = localStorage.getItem(`plate_viewMode_${this.config.id}`);
    if (savedViewMode === 'rows' || savedViewMode === 'columns') {
      this.viewMode = savedViewMode;
    } else {
      // Default per vista espansa: columns
      this.viewMode = 'columns';
    }
  }

  /**
   * Calcola il ritardo degli ordini in Progress
   * Ritardo = tempo trascorso dalla creazione dell'ordine
   */
  public calculateDelay(): void {
    if (!this.progressItems || this.progressItems.length === 0) {
      this.maxDelayMinutes = 0;
      this.avgDelayMinutes = 0;
      this.delaySeverity = 'success';
      return;
    }

    const now = new Date().getTime();
    const delays: number[] = [];

    for (const item of this.progressItems) {
      if (item.createdDate) {
        const createdTime = new Date(item.createdDate).getTime();
        const delayMs = now - createdTime;
        const delayMinutes = Math.floor(delayMs / 60000); // converti in minuti
        delays.push(delayMinutes);
      }
    }

    if (delays.length === 0) {
      this.maxDelayMinutes = 0;
      this.avgDelayMinutes = 0;
      this.delaySeverity = 'success';
      return;
    }

    // Calcola max e media
    this.maxDelayMinutes = Math.max(...delays);
    this.avgDelayMinutes = Math.floor(delays.reduce((a, b) => a + b, 0) / delays.length);

    // Determina il colore in base al ritardo massimo usando le soglie configurabili
    this.delaySeverity = this._delayThresholdsService.getSeverity(this.maxDelayMinutes);
  }

  /**
   * Formatta il tempo in formato leggibile (es. "15min" o "1h 30min")
   */
  public getDelayLabel(): string {
    if (this.maxDelayMinutes === 0) {
      return '';
    }

    const hours = Math.floor(this.maxDelayMinutes / 60);
    const minutes = this.maxDelayMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  }

  /**
   * Ottiene il tooltip con informazioni dettagliate sul ritardo
   */
  public getDelayTooltip(): string {
    if (this.progressItems.length === 0) {
      return '';
    }

    return `Ritardo Max: ${this.getDelayLabel()}\nRitardo Medio: ${this.formatMinutes(this.avgDelayMinutes)}\nOrdini in Corso: ${this.progressItems.length}`;
  }

  private formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}min`;
    } else {
      return `${mins}min`;
    }
  }

  /**
   * Calcola se il colore di background è scuro usando la formula della luminosità relativa
   * @param color - Il colore in formato hex (es: #FF5733)
   * @returns true se il colore è scuro, false altrimenti
   */
  public isColorDark(color: string | undefined): boolean {
    if (!color) return false;
    
    // Rimuove il # se presente
    const hex = color.replace('#', '');
    
    // Converte in RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calcola la luminosità relativa usando la formula standard
    // https://www.w3.org/TR/WCAG20/#relativeluminancedef
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Se la luminosità è minore di 0.5, il colore è scuro
    return luminance < 0.5;
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
