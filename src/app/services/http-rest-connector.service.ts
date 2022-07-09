import {Injectable} from '@angular/core';
import {ApiConnector} from "./api-connector";
import {map, Observable} from "rxjs";
import {Plate} from "../modules/plates/plate/plate.model";
import {HttpClient} from "@angular/common/http";

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

  public getPlates(): Observable<any[]> {
    // fixme temporary
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
}
