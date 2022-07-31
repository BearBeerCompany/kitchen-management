import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ItemEvent, PlateItemAction, PlateItemStatus} from "../plate.interface";
import {Order, Status} from "../../orders/order";
import {MenuItem as PrimeMenuItem} from 'primeng/api';
import {Plate} from "../plate/plate.model";

@Component({
  selector: 'item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent implements OnInit {

  @Input() public config!: Order;
  @Input() public plateList: Plate[] = [];

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

  public onCancel(status: PlateItemAction): void {
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
      nextId: plate.name
    } as ItemEvent;

    this.onCancelEvent.emit(event);
    this.toggleOverlay();
  }
}
