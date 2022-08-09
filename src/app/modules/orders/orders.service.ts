import {map, Observable} from "rxjs";
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Order} from './order';
import { CRUDService } from "../shared/interface/crud-service.interface";
import { RequestService } from "../shared/service/request.service";
import { ApiResourceEnum } from "../shared/service/api-resource.enum";

@Injectable()
export class OrdersService extends RequestService implements CRUDService<Order> {

  constructor(private _http: HttpClient) {
    super(ApiResourceEnum.KITCHEN_MENU_ITEM);
  }

  public getAll(parentId?: string): Observable<Order[]> {
    return this._http.get(this._getUrl(), RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || []) as Order[];
      })
    );
  }

  public getById(id: string): Observable<Order> {
    return this._http.get(this._getUrl(id), RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as Order;
      })
    );
  }

  public create(dto: Order): Observable<Order> {
    return this._http.post(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as Order
      })
    );
  }

  public update(dto: Order): Observable<Order> {
    return this._http.put(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as Order
      })
    );
  }

  public delete(id: string): Observable<any> {
    return this._http.delete(this._getUrl(id), RequestService.baseHttpOptions);
  }

  // getOrders(): Observable<Order[]> {
  //   return this.http.get<any>('assets/orders.json')
  //     .pipe(
  //       map(res => res.data as Order[])
  //     );
  // }

  // fixme remove
  createId(): string {
    let id = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 5; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
}
