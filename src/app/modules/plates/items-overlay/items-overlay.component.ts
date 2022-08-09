import {Component, EventEmitter, Input, Output} from '@angular/core';
import {PlateMenuItem} from "../../plate-menu-items/plate-menu-item";
import {I18nService} from "../../../services/i18n.service";

@Component({
  selector: 'items-overlay',
  templateUrl: './items-overlay.component.html',
  styleUrls: ['./items-overlay.component.scss']
})
export class ItemsOverlayComponent {

  public readonly i18n: any;

  @Input() public items: PlateMenuItem[] = [];
  @Input() public hideCloseButton: boolean = false;

  @Output() public onClose: EventEmitter<void> = new EventEmitter<void>(false);
  @Output() public onRun: EventEmitter<PlateMenuItem> = new EventEmitter<PlateMenuItem>(false);

  constructor(public i18nService: I18nService) {
    this.i18n = i18nService.instance;
  }
}
