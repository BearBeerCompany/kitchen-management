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

  getPlate(id: string): Observable<any> {
    return new Observable();
  }

  addPlate(config: Plate): Observable<any> {
    return new Observable();
  }

  getPlates(): Observable<any[]> {
    return new Observable();
  }

  removePlate(id: string): Observable<any> {
    return new Observable();
  }

  updatePlate(config: Plate): Observable<any> {
    return new Observable();
  }
}
