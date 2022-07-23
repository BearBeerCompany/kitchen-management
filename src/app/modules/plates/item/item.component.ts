import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ItemEvent} from "../plate.interface";
import {MenuItem, Status} from "../../orders/order";

@Component({
  selector: 'item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent {

  @Input() public config!: MenuItem;

  @Output() public onDoneEvent: EventEmitter<ItemEvent> = new EventEmitter<ItemEvent>(false);
  @Output() public onCancelEvent: EventEmitter<ItemEvent> = new EventEmitter<ItemEvent>(false);

  public onDone(): void {
    this.onDoneEvent.emit({
      action: Status.Done,
      item: this.config
    } as ItemEvent);
  }

  public onCancel(): void {
    const event: ItemEvent = {
      action: Status.Cancelled,
      item: this.config
    } as ItemEvent;

    //TODO: Handle moved or re-queued reasons

    this.onCancelEvent.emit(event);
  }

}
