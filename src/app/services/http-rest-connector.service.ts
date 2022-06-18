import {Injectable} from '@angular/core';
import {ApiConnector} from "./api-connector";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class HttpRestConnectorService implements ApiConnector {

  constructor() {
  }

  addPlate(): Observable<any> {
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
