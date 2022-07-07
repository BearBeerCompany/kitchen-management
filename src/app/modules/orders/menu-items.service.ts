import {Injectable} from '@angular/core';
import {map, Observable} from "rxjs";
import {TreeNode} from "primeng/api";
import {HttpClient} from "@angular/common/http";

@Injectable()
export class MenuItemsService {

  constructor(private http: HttpClient) { }

  getMenuItems(): Observable<TreeNode[]> {
    return this.http.get<any>('assets/menu-items.json')
      .pipe(
        map(res => res.data as TreeNode[])
      );
  }
}
