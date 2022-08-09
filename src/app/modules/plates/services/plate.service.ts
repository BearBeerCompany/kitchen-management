import {Injectable} from '@angular/core';
import {RequestService} from "../../shared/service/request.service";
import {CRUDService} from "../../shared/interface/crud-service.interface";
import {ApiResourceEnum} from "../../shared/service/api-resource.enum";
import {map, Observable} from "rxjs";
import {Plate} from "../plate.interface";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class PlateService extends RequestService implements CRUDService<Plate>{

  constructor(private _http: HttpClient) {
    super(ApiResourceEnum.PLATE);
  }

  create(dto: Plate): Observable<Plate> {
    return this._http.post(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as Plate
      })
    );
  }

  delete(id: string): Observable<any> {
    return this._http.delete(this._getUrl(id), RequestService.baseHttpOptions);
  }

  getAll(parentId?: string): Observable<Array<Plate>> {
    return this._http.get(this._getUrl(), RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || []) as Plate[];
      })
    );
  }

  getById(id: string): Observable<Plate> {
    return this._http.get(this._getUrl(id), RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as Plate;
      })
    );
  }

  update(dto: Plate): Observable<Plate> {
    return this._http.put(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as Plate
      })
    );
  }
}
