import {Observable} from "rxjs";
import {Plate} from "../modules/plates/plate/plate.model";

export interface ApiConnector {

  getPlate(id: string): Observable<any>;

  getPlates(): Observable<any[]>;

  addPlate(config: Plate): Observable<any>;

  updatePlate(config: Plate): Observable<any>;

  removePlate(id: string): Observable<any>;
}
