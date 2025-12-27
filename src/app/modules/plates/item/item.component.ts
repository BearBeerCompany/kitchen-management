import {Component, EventEmitter, Input, NgModule, OnInit, Output} from '@angular/core';
import {ItemEvent, Plate, PlateMenuItemAction, PlateItemStatus} from "../plate.interface";
import {PlateMenuItem, Status} from "../../plate-menu-items/plate-menu-item";
import {MenuItem as PrimeMenuItem} from 'primeng/api';
import {CommonModule} from "@angular/common";
import {RippleModule} from "primeng/ripple";
import {ButtonModule} from "primeng/button";
import {TooltipModule} from "primeng/tooltip";
import {TagModule} from "primeng/tag";
import {DelayThresholdsService} from "../../../services/delay-thresholds.service";

@Component({
  selector: 'item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent implements OnInit {

  @Input() public config!: PlateMenuItem;
  @Input() public plateList: Plate[] = [];
  @Input() public readonly: boolean = false;
  @Input() public showDelay: boolean = true; // default true per vista espansa
  @Input() public currentPlate?: Plate; // Configurazione della piastra corrente

  @Output() public onDoneEvent: EventEmitter<ItemEvent> = new EventEmitter<ItemEvent>(false);
  @Output() public onCancelEvent: EventEmitter<ItemEvent> = new EventEmitter<ItemEvent>(false);

  public deleteOptions: PrimeMenuItem[] = [];
  public deleteOverlay: boolean = false;
  public showPlateList: boolean = false;
  
  // Delay tracking per item
  public delayMinutes: number = 0;
  public delaySeverity: 'success' | 'warning' | 'danger' = 'success';

  constructor(private _delayThresholdsService: DelayThresholdsService) {}

  public ngOnInit(): void {
    this.calculateItemDelay();
    this.deleteOptions = [
      {
        icon: 'pi pi-trash',
        label: 'Elimina',
        command: () => {
          this.onCancel(Status.Cancelled);
        }
      },
      {
        icon: 'pi pi-undo',
        label: 'Rimetti in Attesa',
        command: () => {
          this.onCancel(Status.Todo);
        }
      },
      {
        icon: 'pi pi-directions',
        label: 'Sposta in altra Piastra',
        command: () => {
          this.showPlateList = true;
        }
      },
      {
        icon: 'pi pi-chevron-up',
        label: 'Annulla',
        command: () => {
          this.toggleOverlay();
        }
      },
    ];
  }

  public onDone(): void {
    this.onDoneEvent.emit({
      action: Status.Done,
      item: this.config
    } as ItemEvent);
  }

  public onCancel(status: PlateMenuItemAction): void {
    const event: ItemEvent = {
      action: status,
      item: this.config
    } as ItemEvent;

    this.onCancelEvent.emit(event);
    this.toggleOverlay();
  }

  public toggleOverlay(): void {
    this.deleteOverlay = !this.deleteOverlay;
    this.showPlateList = false;
  }

  public onPlateMoved(plate: Plate): void {
    const event: ItemEvent = {
      action: PlateItemStatus.Moved,
      item: this.config,
      nextId: plate.id,
      plateId: '' // Sarà impostato dal componente parent
    } as ItemEvent;

    this.onCancelEvent.emit(event);
    this.toggleOverlay();
  }

  public onQuickMove(): void {
    if (!this.currentPlate?.quickMoveEnabled || !this.currentPlate?.quickMoveTargetPlateId) {
      return;
    }

    const targetPlate = this.plateList.find(p => p.id === this.currentPlate?.quickMoveTargetPlateId);
    if (targetPlate) {
      const event: ItemEvent = {
        action: PlateItemStatus.Moved,
        item: this.config,
        nextId: targetPlate.id,
        plateId: '' // Sarà impostato dal componente parent
      } as ItemEvent;
      
      this.onCancelEvent.emit(event);
    }
  }

  public getTargetPlateName(): string {
    if (!this.currentPlate?.quickMoveTargetPlateId) {
      return '';
    }
    const targetPlate = this.plateList.find(p => p.id === this.currentPlate?.quickMoveTargetPlateId);
    return targetPlate?.name || '';
  }

  public getNotes(config: PlateMenuItem): string {
    let result = '';
    if (config.orderNotes && config.orderNotes.length) {
      result = config.orderNotes.trim();
    }
    if (config.notes && config.notes.length) {
      if (result.length) result += ' / ';
      result += config.notes.trim();
    }
    return result;
  }

  /**
   * Calcola il ritardo per questo specifico item
   */
  private calculateItemDelay(): void {
    if (!this.config?.createdDate) {
      this.delayMinutes = 0;
      this.delaySeverity = 'success';
      return;
    }

    const now = new Date().getTime();
    const createdTime = new Date(this.config.createdDate).getTime();
    const delayMs = now - createdTime;
    this.delayMinutes = Math.floor(delayMs / 60000);

    // Determina la severità usando le soglie configurabili
    this.delaySeverity = this._delayThresholdsService.getSeverity(this.delayMinutes);
  }

  /**
   * Formatta i minuti in stringa leggibile
   */
  public getDelayLabel(): string {
    if (this.delayMinutes < 60) {
      return `${this.delayMinutes}min`;
    }
    const hours = Math.floor(this.delayMinutes / 60);
    const mins = this.delayMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
}

@NgModule({
  imports: [CommonModule, RippleModule, ButtonModule, TooltipModule, TagModule],
  declarations: [ItemComponent],
  exports: [ItemComponent]
})
export class ItemComponentModule{
}
