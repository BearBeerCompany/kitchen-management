import {Component, EventEmitter, Input, Output} from '@angular/core';
import {mode, PlateMode} from "../plate-mode";
import {I18nService} from "../../../services/i18n.service";
import {Plate} from "./plate.model";
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'plate',
  templateUrl: './plate.component.html',
  styleUrls: ['./plate.component.scss']
})
export class PlateComponent {

  public readonly i18n: any;

  public icon: string = "pi-plus";
  public plateMode: typeof PlateMode = mode();
  public form?: FormGroup | undefined;
  @Output()
  public onNew: EventEmitter<Plate> = new EventEmitter<Plate>(true);

  constructor(public i18nService: I18nService) {
    this.i18n = i18nService.instance;
  }

  private _config!: Plate;

  public get config(): Plate {
    return this._config;
  }

  @Input()
  public set config(value: Plate) {
    this._config = value;
    this._evaluateStatus();
  }

  public onMouseEnter(): void {
    setTimeout(() => this.icon = "pi-plus-circle", 300);
  }

  public onMouseLeave(): void {
    setTimeout(() => this.icon = "pi-plus", 500);
  }

  public onSubmit(): void {
    this.onNew.emit({
      name: this.form?.get("name")?.value,
      color: this.form?.get("color")?.value
    } as Plate);
  }

  public loadForm(): void {
    this.form = new FormGroup({
      name: new FormControl("", Validators.required),
      color: new FormControl("", Validators.required)
    });
    this._config.mode = PlateMode.Form;
  }

  public discardForm() {
    this._config.mode = PlateMode.Skeleton;
  }

  private _evaluateStatus() {
    if (!this.config.slot)
      return;

    const used: number = this.config.slot[0];
    const total: number = this.config.slot[1];
    let label: string = `${used}/${total} `;

    if (used < total) {
      this._config._severity = "success";
      label = label + this.i18n.PLATE.FREE;
    } else {
      this._config._severity = "danger";
      label = label + this.i18n.PLATE.FULL;
    }

    this._config._status = label;
  }
}
