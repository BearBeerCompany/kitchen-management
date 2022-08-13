import {Injectable} from '@angular/core';
import {map, Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {ApiResourceEnum} from "../../shared/service/api-resource.enum";
import {RequestService} from "../../shared/service/request.service";
import {CRUDService} from "../../shared/interface/crud-service.interface";
import {MenuItem} from "../plate-menu-item";

@Injectable({
  providedIn: "root"
})
export class MenuItemsService extends RequestService implements CRUDService<MenuItem> {

  constructor(private _http: HttpClient) {
    super(ApiResourceEnum.KITCHEN_MENU_ITEM);
  }

  public getAll(parentId?: string): Observable<MenuItem[]> {
    return this._http.get(this._getUrl(), RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || []) as MenuItem[];
      })
    );
  }

  public getById(id: string): Observable<MenuItem> {
    return this._http.get(this._getUrl(id), RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as MenuItem;
      })
    );
  }

  public create(dto: MenuItem): Observable<MenuItem> {
    return this._http.post(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as MenuItem
      })
    );
  }

  public update(dto: MenuItem): Observable<MenuItem> {
    return this._http.put(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as MenuItem
      })
    );
  }

  public delete(id: string): Observable<any> {
    return this._http.delete(this._getUrl(id), RequestService.baseHttpOptions);
  }

  // getMenuItems(): Observable<TreeNode[]> {
  //   return this.http.get<any>('assets/menu-items.json')
  //     .pipe(
  //       map(res => res.data as TreeNode[])
  //     );
  // }
}
