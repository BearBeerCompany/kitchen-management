import {Injectable} from '@angular/core';
import {ApiConnector} from "./api-connector";
import {Observable} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {Plate} from "../modules/plates/plate/plate.model";

@Injectable({
  providedIn: 'root'
})
export class FileSystemConnectorService implements ApiConnector {


  constructor() {

  }

  addPlate(config: Plate): Observable<any> {
    return fromPromise(fs.fileAdd(config));
  }

  getPlates(): Observable<any[]> {
    return new Observable<any>();
  }

  removePlate(): Observable<any> {
    return new Observable<any>();
  }

  updatePlate(): Observable<any> {
    return new Observable<any>();
  }
}
