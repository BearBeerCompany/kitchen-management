import {Injectable} from "@angular/core";
import {RequestService} from "../../shared/service/request.service";
import {CRUDService} from "../../shared/interface/crud-service.interface";
import {Category} from "../plate-menu-item";
import {HttpClient} from "@angular/common/http";
import {ApiResourceEnum} from "../../shared/service/api-resource.enum";
import {map, Observable} from "rxjs";

@Injectable()
export class CategoryService extends RequestService implements CRUDService<Category> {

  constructor(private _http: HttpClient) {
    super(ApiResourceEnum.CATEGORY);
  }

  public getAll(parentId?: string): Observable<Category[]> {
    return this._http.get(this._getUrl(), RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || []) as Category[];
      })
    );
  }

  public getById(id: string): Observable<Category> {
    return this._http.get(this._getUrl(id), RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as Category;
      })
    );
  }

  public create(dto: Category): Observable<Category> {
    return this._http.post(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as Category
      })
    );
  }

  public update(dto: Category): Observable<Category> {
    return this._http.put(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as Category
      })
    );
  }

  public delete(id: string): Observable<any> {
    return this._http.delete(this._getUrl(id), RequestService.baseHttpOptions);
  }

}
