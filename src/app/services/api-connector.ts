import {Observable} from "rxjs";
import {Order} from "../modules/orders/order";
import {Plate} from "../modules/plates/plate.interface";

export interface ApiConnector {

  getPlate(id: string): Observable<any>;

  getPlates(): Observable<any[]>;

  addPlate(config: Plate): Observable<any>;

  updatePlate(config: Plate): Observable<any>;

  removePlate(id: string): Observable<any>;

  getOrder(id: string): Observable<any>;

  getOrders(): Observable<any[]>;

  addOder(order: Order): Observable<any>;

  addOrders(orders: Order[]): Observable<any>;

  updateOrder(order: Order): Observable<any>;

  removeOrder(id: string): Observable<any>;

  removeOrders(ids: string[]): Observable<any>;

  getMenuItems(): Observable<any[]>;
}
