import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ItemEvent, mode, PlateInterface} from "../plate.interface";
import {I18nService} from "../../../services/i18n.service";
import {Plate} from "./plate.model";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Routing} from "../../../app-routing.module";
import {ActivatedRoute} from "@angular/router";
import {ReactiveQueue} from "../../shared/class/reactive-queue";
import {Order, Status} from "../../orders/order";
import {Subscription} from "rxjs";

@Component({
  selector: 'plate',
  templateUrl: './plate.component.html',
  styleUrls: ['./plate.component.scss']
})
export class PlateComponent implements OnInit, OnDestroy {

  @Input() public config!: Plate;
  @Input() public plateList: Plate[] = [];
  @Input() public queue!: ReactiveQueue<Order>;

  @Output() public onNew: EventEmitter<Plate> = new EventEmitter<Plate>(true);
  @Output() public onItemEvent: EventEmitter<ItemEvent> = new EventEmitter<ItemEvent>(false);

  public readonly i18n: any;

  public icon: string = "pi-plus";
  public plateMode: typeof PlateInterface = mode();
  public form?: FormGroup | undefined;
  public showExpand: boolean = true;
  public badgeSize: string = "large";
  public badgeColor: string = "info";
  public showOverlay: boolean = false;
  public progressItems: Order[] = [];
  public todoItems: Order[] = [];

  private queue$: Subscription = new Subscription();

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

    this.queue$.add(this.queue?.values$?.subscribe((items: Order[] = []) => {
      this.progressItems = [];
      this.todoItems = [];
      for (const i of items) {
        if (i.status === Status.Progress)
          this.progressItems.push(i);
        else
          this.todoItems.push(i);
      }
      if (this.todoItems.length == 0) {
        this.showOverlay = false;
        }
      })
    );
  }

  public ngOnDestroy(): void {
    this.queue$.unsubscribe();
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

  public discardForm(): void {
    this.config.mode = PlateInterface.Skeleton;
  }

  public expandTab(): void {
    app.openNewTab(Routing.Plates, this.config.name!);
  }

  public onBadgeMouseEnter(): void {
    this.badgeSize = "xlarge";
    this.badgeColor = "danger";
  }

  public onBadgeMouseLeave(): void {
    if (!this.showOverlay) {
      this.badgeSize = "large";
      this.badgeColor = "info";
    }
  }

  public onBadgeMouseClick(): void {
    this.showOverlay = !this.showOverlay;
    if (this.showOverlay)
      this.onBadgeMouseEnter();
    else
      this.onBadgeMouseLeave();
  }

  public handleItemEvent(event: ItemEvent) {
    event.plateId = this.config.name!;

    this.onItemEvent.emit(event);
  }

  public onItemStart(item: Order) {
    const event: ItemEvent = {
      action: Status.Progress,
      item: item,
      plateId: this.config.name!
    }

    this.onItemEvent.emit(event);
  }
}
