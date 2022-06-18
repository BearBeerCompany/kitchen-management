import {Injectable} from '@angular/core';
import {ApiConnector} from "./api-connector";
import {Observable} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";

@Injectable({
  providedIn: 'root'
})
export class FileSystemConnectorService implements ApiConnector {


  constructor() {

  }

  addPlate(): Observable<any> {
    return fromPromise(fs.fileAdd());
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
