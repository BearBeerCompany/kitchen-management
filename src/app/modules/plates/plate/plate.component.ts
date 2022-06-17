import {Component, Input} from '@angular/core';
import {mode, PlateMode} from "../plate-mode";
import {I18N} from "../../../../assets/i18n-ita";

@Component({
  selector: 'plate',
  templateUrl: './plate.component.html',
  styleUrls: ['./plate.component.scss']
})
export class PlateComponent {

  public icon: string = "pi-plus";
  public plateMode: typeof PlateMode = mode();
  public i18n = I18N;

  @Input() mode?: PlateMode;

  public onMouseEnter(): void {
    setTimeout(() => this.icon = "pi-plus-circle", 300);
  }

  public onMouseLeave(): void {
    setTimeout(() => this.icon = "pi-plus", 500);
  }

}
