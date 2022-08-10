import {Observable} from "rxjs";
import {PlateMenuItem} from "../modules/plate-menu-items/plate-menu-item";
import {Plate} from "../modules/plates/plate.interface";

export interface ApiConnector {

  getPlate(id: string): Observable<any>;

  getPlates(): Observable<any[]>;

  addPlate(config: Plate): Observable<any>;

  updatePlate(config: Plate): Observable<any>;

  removePlate(id: string): Observable<any>;

  getOrder(id: string): Observable<any>;

  getOrders(): Observable<any[]>;

  addOder(order: PlateMenuItem): Observable<any>;

  addOrders(orders: PlateMenuItem[]): Observable<any>;

  updateOrder(order: PlateMenuItem): Observable<any>;

  removeOrder(id: string): Observable<any>;

  removeOrders(ids: string[]): Observable<any>;

  getMenuItems(): Observable<any[]>;
}
