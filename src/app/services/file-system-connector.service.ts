import {Injectable} from '@angular/core';
import {ApiConnector} from "./api-connector";
import {Observable} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {Plate} from "../modules/plates/plate/plate.model";

@Injectable({
  providedIn: 'root'
})
export class FileSystemConnectorService implements ApiConnector {

  getPlate(id: string): Observable<any> {
    return fromPromise(fs.readPlate(id));
  }

  addPlate(config: Plate): Observable<any> {
    return fromPromise(fs.addPlate(config));
  }

  getPlates(): Observable<any[]> {
    return fromPromise(fs.readPlates());
  }

  removePlate(id: string): Observable<any> {
    return fromPromise(fs.deletePlate(id));
  }

  updatePlate(config: Plate): Observable<any> {
    return fromPromise(fs.updatePlate(config));
  }
}
