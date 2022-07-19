import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {ApiConnector} from "../../../services/api-connector";
import {Plate} from "../plate/plate.model";

@Component({
  selector: 'page',
  template: `
    <div class="page-container">
      <plate [config]="config"></plate>
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

  private _subs: Subscription = new Subscription();
  private _id?: string;

  constructor(private _route: ActivatedRoute,
              @Inject('ApiConnector') private _apiConnector: ApiConnector) {
  }

  public ngOnInit(): void {
    const rootComponent: HTMLElement | null = document.getElementById("navbar-id");
    if (rootComponent)
      rootComponent.remove();

    this._subs.add(this._route.params.subscribe(
      params => {
        this._id = params["id"];
      }
    ));

    this._subs.add(this._apiConnector.getPlate(this._id!)
      .subscribe((plate: Plate) => {
        this.config = plate;
      }));
  }

  public ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

}
