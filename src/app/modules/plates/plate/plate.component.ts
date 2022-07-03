import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {mode, PlateMode} from "../plate-mode";
import {I18nService} from "../../../services/i18n.service";
import {Plate} from "./plate.model";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {Routing} from "../../../app-routing.module";

@Component({
  selector: 'plate',
  templateUrl: './plate.component.html',
  styleUrls: ['./plate.component.scss']
})
export class PlateComponent implements OnInit, OnDestroy {

  public readonly i18n: any;

  public icon: string = "pi-plus";
  public plateMode: typeof PlateMode = mode();
  public form?: FormGroup | undefined;

  private _routeSub: Subscription = new Subscription();
  private _id?: string;

  @Input() public config!: Plate;

  @Output() public onNew: EventEmitter<Plate> = new EventEmitter<Plate>(true);

  constructor(public i18nService: I18nService,
              private _route: ActivatedRoute) {
    this.i18n = i18nService.instance;
  }

  public ngOnInit(): void {
    this._routeSub = this._route.params.subscribe(
      params => {
        this._id = params["id"];
        if (!this._id) {
          this._id = this.config._id;
        }
      }
    );
  }

  public ngOnDestroy(): void {
    this._routeSub.unsubscribe();
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
      color: this.form?.get("color")?.value,
      slot: [0, this.form?.get("number")?.value],
      mode: PlateMode.On
    } as Plate);
  }

  public loadForm(): void {
    this.form = new FormGroup({
      name: new FormControl("", Validators.required),
      color: new FormControl("", Validators.required),
      number: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")])
    });
    this.config.mode = PlateMode.Form;
  }

  public discardForm() {
    this.config.mode = PlateMode.Skeleton;
  }

  public expandTab() {
    console.log("clicked");
    app.openNewTab(Routing.Plates, this._id!);
  }
}
