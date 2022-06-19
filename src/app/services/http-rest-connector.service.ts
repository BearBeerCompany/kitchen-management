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

  addPlate(config: Plate): Observable<any> {
    return new Observable();
  }

  getPlates(): Observable<any[]> {
    return new Observable();
  }

  removePlate(): Observable<any> {
    return new Observable();
  }

  updatePlate(): Observable<any> {
    return new Observable();
  }
}
