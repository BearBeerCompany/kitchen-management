import {Component, EventEmitter, Input, NgModule, OnInit, Output} from '@angular/core';
import {ItemEvent, Plate, PlateMenuItemAction, PlateItemStatus} from "../plate.interface";
import {PlateMenuItem, Status} from "../../plate-menu-items/plate-menu-item";
import {MenuItem as PrimeMenuItem} from 'primeng/api';
import {CommonModule} from "@angular/common";
import {RippleModule} from "primeng/ripple";
import {ButtonModule} from "primeng/button";
import {TooltipModule} from "primeng/tooltip";

@Component({
  selector: 'item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent implements OnInit {

  @Input() public config!: PlateMenuItem;
  @Input() public plateList: Plate[] = [];
  @Input() public readonly: boolean = false;

  @Output() public onDoneEvent: EventEmitter<ItemEvent> = new EventEmitter<ItemEvent>(false);
  @Output() public onCancelEvent: EventEmitter<ItemEvent> = new EventEmitter<ItemEvent>(false);

  public deleteOptions: PrimeMenuItem[] = [];
  public deleteOverlay: boolean = false;
  public showPlateList: boolean = false;

  public ngOnInit(): void {
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
      nextId: plate.id
    } as ItemEvent;

    this.onCancelEvent.emit(event);
    this.toggleOverlay();
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
}

@NgModule({
  imports: [CommonModule, RippleModule, ButtonModule, TooltipModule],
  declarations: [ItemComponent],
  exports: [ItemComponent]
})
export class ItemComponentModule{
}
