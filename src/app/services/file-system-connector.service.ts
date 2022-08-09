import {Injectable} from '@angular/core';
import {ApiConnector} from "./api-connector";
import {map, Observable} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {I18nService} from "./i18n.service";
import {Plate, PlateInterface} from "../modules/plates/plate.interface";
import {MenuItem, PlateMenuItem} from "../modules/plate-menu-items/plate-menu-item";

@Injectable({
  providedIn: 'root'
})
export class FileSystemConnectorService implements ApiConnector {

  public readonly i18n: any;

  constructor(private _i18nService: I18nService) {
    this.i18n = _i18nService.instance;
  }

  getPlate(id: string): Observable<Plate | undefined> {
    return fromPromise(fs.readPlate(id)).pipe(map(p => this._evaluateStatus(p)));
  }

  addPlate(config: Plate): Observable<Plate | undefined> {
    return fromPromise(fs.addPlate(config)).pipe(map(p => this._evaluateStatus(p)));
  }

  getPlates(): Observable<any[]> {
    return fromPromise(fs.readPlates())
      .pipe(
        map((plates: Plate[]) => {
          return plates.map(p => this._evaluateStatus(p));
        })
      );
  }

  removePlate(id: string): Observable<Plate | undefined> {
    return fromPromise(fs.deletePlate(id));
  }

  updatePlate(config: Plate): Observable<Plate | undefined> {
    return fromPromise(fs.updatePlate(config)).pipe(map(p => this._evaluateStatus(p)));
  }

  private _evaluateStatus(config: Plate): Plate {
    if (!config.slot)
      config.slot = [0, 0];

    const used: number = config.slot[0];
    const total: number = config.slot[1];
    let label: string = `${used}/${total} `;

    if (used < total) {
      config._severity = "success";
      label = label + this.i18n.PLATE.FREE;
    } else {
      config._severity = "danger";
      label = label + this.i18n.PLATE.FULL;
    }

    config._status = label;

    config.mode = config?.mode ?? PlateInterface.On;

    return config;
  }

  addOder(order: PlateMenuItem): Observable<PlateMenuItem | undefined> {
    return fromPromise(fs.addOrder(order));
  }

  addOrders(orders: PlateMenuItem[]): Observable<PlateMenuItem | undefined> {
    return fromPromise(fs.addOrders(orders));
  }

  getOrder(id: string): Observable<PlateMenuItem | undefined> {
    return fromPromise(fs.readOrder(id));
  }

  getOrders(): Observable<PlateMenuItem[]> {
    return fromPromise(fs.readOrders());
  }

  removeOrder(id: string): Observable<boolean> {
    return fromPromise(fs.deleteOrder(id));
  }

  removeOrders(ids: string[]): Observable<boolean> {
    return fromPromise(fs.deleteOrders(ids));
  }

  updateOrder(order: PlateMenuItem): Observable<PlateMenuItem | undefined> {
    return fromPromise(fs.updateOrder(order));
  }

  getMenuItems(): Observable<MenuItem[]> {
    return fromPromise(fs.readMenuItems());
  }
}
