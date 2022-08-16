import {Component, EventEmitter, Input, NgModule, OnInit, Output} from '@angular/core';
import {PlateMenuItem, Status} from "../../plate-menu-items/plate-menu-item";
import {ItemEvent, Plate, PlateItemStatus, PlateMenuItemAction} from "../plate.interface";
import {MenuItem as PrimeMenuItem} from "primeng/api/menuitem";
import {CommonModule} from "@angular/common";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {TooltipModule} from "primeng/tooltip";

@Component({
  selector: 'item-overlay-row',
  templateUrl: './item-overlay-row.component.html',
  styleUrls: ['./item-overlay-row.component.scss']
})
export class ItemOverlayRowComponent implements OnInit {

  @Input() public item!: PlateMenuItem;
  @Input() public plateList: Plate[] = [];
  @Input() public hideCloseButton: boolean = false;
  @Input() public enableActions: boolean = false;

  @Output() public onActionEvent: EventEmitter<ItemEvent> = new EventEmitter<ItemEvent>(false);
  @Output() public onRun: EventEmitter<PlateMenuItem> = new EventEmitter<PlateMenuItem>(false);

  public deleteOverlay: boolean = false;
  public showPlateList: boolean = false;
  public actionOptions: PrimeMenuItem[] = [];

  constructor() {
    this.actionOptions = [
      {
        icon: 'pi pi-trash',
        label: 'Elimina',
        command: () => {
          this.onCancel(Status.Cancelled);
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

  ngOnInit(): void {
  }

  public toggleOverlay(): void {
    this.deleteOverlay = !this.deleteOverlay;
    this.showPlateList = false;
  }

  public onCancel(status: PlateMenuItemAction): void {
    const event: ItemEvent = {
      action: status,
      item: this.item
    } as ItemEvent;

    this.onActionEvent.emit(event);
    this.toggleOverlay();
  }

  public onPlateMoved(plate: Plate): void {
    const event: ItemEvent = {
      action: PlateItemStatus.Moved,
      item: this.item,
      nextId: plate.id
    } as ItemEvent;

    this.onActionEvent.emit(event);
    this.toggleOverlay();
  }

}

@NgModule({
  declarations: [ItemOverlayRowComponent],
  imports: [CommonModule, ButtonModule, RippleModule, TooltipModule],
  exports: [ItemOverlayRowComponent]
})
export class ItemOverlayRowComponentModule {
}
