import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {Plate} from "../plate.interface";
import {PlateService} from "../services/plate.service";
import {PlateMenuItem} from "../../plate-menu-items/plate-menu-item";
import {ReactiveQueue} from "../../shared/class/reactive-queue";

@Component({
  selector: 'page',
  template: `
    <div class="page-container">
      <plate [config]="config" [queue]="queue"></plate>
    </div>
  `,
  styles: [`
    .page-container {
      // reset default height with full page mode component
      height: 100vh !important;
      max-height: 100vh !important;

      padding: 3%;

      overflow-y: hidden;
    }
  `]
})
export class PlatePageComponent implements OnInit, OnDestroy {

  public config!: Plate;
  public queue: ReactiveQueue<PlateMenuItem> = new ReactiveQueue<PlateMenuItem>();

  private _subs: Subscription = new Subscription();
  private _id?: string;

  constructor(private _route: ActivatedRoute,
              private _plateService: PlateService) {
  }

  public ngOnInit(): void {
    this._subs.add(this._route.params.subscribe(
      params => {
        this._id = params["id"];
      }
    ));

    this._subs.add(this._plateService.getById(this._id!)
      .subscribe((plate: Plate) => {
        this.config = plate;
        this._plateService.getStatusById(this._id!).subscribe({
          next: (items: PlateMenuItem[]) => {
            this.queue.values = items;
            this.queue.refresh()
          }
        })
      }));
  }

  public ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

}
