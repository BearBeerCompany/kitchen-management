import {Injectable} from '@angular/core';
import {ApiConnector} from "./api-connector";
import {map, Observable, of} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {PlateMenuItem} from "../modules/plate-menu-items/plate-menu-item";
import {TreeNode} from "primeng/api";
import {Plate} from "../modules/plates/plate.interface";

@Injectable({
  providedIn: 'root'
})
export class HttpRestConnectorService implements ApiConnector {

  constructor(private http: HttpClient) {
  }

  public getPlate(id: string): Observable<any> {
    return new Observable();
  }

  public addPlate(config: Plate): Observable<any> {
    return new Observable();
  }

  public getPlates(): Observable<Plate[]> {
    // fixme temporary, used for mocked data
    return this.http.get<any>('assets/plates.json')
      .pipe(
        map(res => res.data as Plate[])
      );
  }

  public removePlate(id: string): Observable<any> {
    return new Observable();
  }

  public updatePlate(config: Plate): Observable<any> {
    return new Observable();
  }

  addOder(order: PlateMenuItem): Observable<any> {
    return new Observable();
  }

  addOrders(orders: PlateMenuItem[]): Observable<any> {
    // todo temporary, used for mocked data
    return of(true);
  }

  getOrder(id: string): Observable<PlateMenuItem> {
    return new Observable();
  }

  getOrders(): Observable<PlateMenuItem[]> {
    // todo temporary, used for mocked data
    return this.http.get<any>('assets/orders.json')
      .pipe(
        map(res => res.data as PlateMenuItem[])
      );
  }

  removeOrder(id: string): Observable<boolean> {
    // todo temporary, used for mocked data
    return of(true);
  }

  removeOrders(ids: string[]): Observable<boolean> {
    // todo temporary, used for mocked data
    return of(true);
  }

  updateOrder(order: PlateMenuItem): Observable<PlateMenuItem> {
    // todo temporary, used for mocked data
    return of(order);
  }

  getMenuItems(): Observable<TreeNode[]> {
    // todo temporary, used for mocked data
    return this.http.get<any>('assets/menu-items.json')
      .pipe(
        map(res => res.data as TreeNode[])
      );
  }
}
