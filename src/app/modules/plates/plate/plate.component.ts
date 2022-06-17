import {Component, Input} from '@angular/core';
import {mode, PlateMode} from "../plate-mode";
import {I18nService} from "../../../services/i18n.service";

@Component({
  selector: 'plate',
  templateUrl: './plate.component.html',
  styleUrls: ['./plate.component.scss']
})
export class PlateComponent {

  public icon: string = "pi-plus";
  public plateMode: typeof PlateMode = mode();
  public readonly i18n: any;

  @Input() mode?: PlateMode;

  constructor(public i18nService: I18nService) {
    this.i18n = i18nService.instance;
  }

  @Input() set color(value: string) {
    document.documentElement.style.setProperty('--plate-color', value);
  }

  public onMouseEnter(): void {
    setTimeout(() => this.icon = "pi-plus-circle", 300);
  }

  public onMouseLeave(): void {
    setTimeout(() => this.icon = "pi-plus", 500);
  }

}
