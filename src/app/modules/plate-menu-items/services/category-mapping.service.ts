import {Injectable} from "@angular/core";
import {RequestService} from "../../shared/service/request.service";
import {CRUDService} from "../../shared/interface/crud-service.interface";
import {CategoryMapping} from "../plate-menu-item";
import {HttpClient} from "@angular/common/http";
import {ApiResourceEnum} from "../../shared/service/api-resource.enum";
import {map, Observable} from "rxjs";

@Injectable({
  providedIn: "root"
})
export class CategoryMappingService extends RequestService implements CRUDService<CategoryMapping> {

  constructor(private _http: HttpClient) {
    super(ApiResourceEnum.CATEGORY_MAPPING);
  }

  public getAll(): Observable<CategoryMapping[]> {
    return this._http.get(this._getUrl(), RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || []) as CategoryMapping[];
      })
    );
  }

  public getById(id: string): Observable<CategoryMapping> {
    return this._http.get(this._getUrl(id), RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as CategoryMapping;
      })
    );
  }

  public create(dto: CategoryMapping): Observable<CategoryMapping> {
    return this._http.post(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as CategoryMapping;
      })
    );
  }

  public update(dto: CategoryMapping): Observable<CategoryMapping> {
    return this._http.put(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as CategoryMapping;
      })
    );
  }

  public delete(id: string): Observable<any> {
    return this._http.delete(this._getUrl(id), RequestService.baseHttpOptions);
  }
}
