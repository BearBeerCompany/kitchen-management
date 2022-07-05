import { map, Observable } from "rxjs";
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Order } from './order';

@Injectable()
export class OrdersService {

    constructor(private http: HttpClient) {}

    getOrders(): Observable<Order[]> {
        return this.http.get<any>('assets/orders.json')
                .pipe(
                    map(res => res.data as Order[])
                );
    }
}