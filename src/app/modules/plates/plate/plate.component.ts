import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {mode, PlateInterface} from "../plate.interface";
import {I18nService} from "../../../services/i18n.service";
import {Plate} from "./plate.model";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Routing} from "../../../app-routing.module";
import {ActivatedRoute} from "@angular/router";
import {ReactiveQueue} from "../../shared/class/reactive-queue";
import {MenuItem} from "../../orders/order";

@Component({
  selector: 'plate',
  templateUrl: './plate.component.html',
  styleUrls: ['./plate.component.scss']
})
export class PlateComponent implements OnInit {

  public readonly i18n: any;

  public icon: string = "pi-plus";
  public plateMode: typeof PlateInterface = mode();
  public form?: FormGroup | undefined;
  public showExpand: boolean = true;

  @Input() public config!: Plate;
  @Input() public queue!: ReactiveQueue<MenuItem>;

  @Output() public onNew: EventEmitter<Plate> = new EventEmitter<Plate>(true);

  constructor(public i18nService: I18nService,
              private _route: ActivatedRoute) {
    this.i18n = i18nService.instance;
  }

  public ngOnInit(): void {
    this._route.params.subscribe(
      params => {
        this.showExpand = !params["id"];
      }
    );
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
      mode: PlateInterface.On
    } as Plate);
  }

  public loadForm(): void {
    this.form = new FormGroup({
      name: new FormControl("", Validators.required),
      color: new FormControl("", Validators.required),
      number: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")])
    });
    this.config.mode = PlateInterface.Form;
  }

  public discardForm() {
    this.config.mode = PlateInterface.Skeleton;
  }

  public expandTab() {
    app.openNewTab(Routing.Plates, this.config._id!);
  }
}
