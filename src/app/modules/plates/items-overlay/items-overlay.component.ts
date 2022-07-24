import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Order} from "../../orders/order";
import {I18nService} from "../../../services/i18n.service";

@Component({
  selector: 'items-overlay',
  templateUrl: './items-overlay.component.html',
  styleUrls: ['./items-overlay.component.scss']
})
export class ItemsOverlayComponent {

  public readonly i18n: any;

  @Input() public items: Order[] = [];
  @Input() public hideCloseButton: boolean = false;

  @Output() public onClose: EventEmitter<void> = new EventEmitter<void>(false);
  @Output() public onRun: EventEmitter<Order> = new EventEmitter<Order>(false);

  constructor(public i18nService: I18nService) {
    this.i18n = i18nService.instance;
  }
}
