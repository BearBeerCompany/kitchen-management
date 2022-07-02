import {Injectable} from '@angular/core';
import {ApiConnector} from "./api-connector";
import {Observable} from "rxjs";
import {Plate} from "../modules/plates/plate/plate.model";

@Injectable({
  providedIn: 'root'
})
export class HttpRestConnectorService implements ApiConnector {

  constructor() {
  }

  public getPlate(id: string): Observable<any> {
    return new Observable();
  }

  public addPlate(config: Plate): Observable<any> {
    return new Observable();
  }

  public getPlates(): Observable<any[]> {
    return new Observable();
  }

  public removePlate(id: string): Observable<any> {
    return new Observable();
  }

  public updatePlate(config: Plate): Observable<any> {
    return new Observable();
  }
}
