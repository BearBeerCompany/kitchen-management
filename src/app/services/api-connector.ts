import {Observable} from "rxjs";

export interface ApiConnector {

  getPlates(): Observable<any[]>;

  addPlate(): Observable<any>;

  updatePlate(): Observable<any>;

  removePlate(): Observable<any>;
}
