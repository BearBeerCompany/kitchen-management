import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MenuItem} from "../../orders/order";
import {I18nService} from "../../../services/i18n.service";

@Component({
  selector: 'items-overlay',
  templateUrl: './items-overlay.component.html',
  styleUrls: ['./items-overlay.component.scss']
})
export class ItemsOverlayComponent {

  public readonly i18n: any;

  @Input() public items: MenuItem[] = [];

  @Output() public onClose: EventEmitter<void> = new EventEmitter<void>(false);
  @Output() public onRun: EventEmitter<string> = new EventEmitter<string>(false);

  constructor(public i18nService: I18nService) {
    this.i18n = i18nService.instance;
  }
}
