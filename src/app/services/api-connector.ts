import {Observable} from "rxjs";
import {Plate} from "../modules/plates/plate/plate.model";

export interface ApiConnector {

  getPlates(): Observable<any[]>;

  addPlate(config: Plate): Observable<any>;

  updatePlate(): Observable<any>;

  removePlate(): Observable<any>;
}
