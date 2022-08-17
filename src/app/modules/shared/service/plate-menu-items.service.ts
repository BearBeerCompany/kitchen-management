import {map, Observable} from "rxjs";
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Category, MenuItem, MenuItemExtended, PlateMenuItem} from '../../plate-menu-items/plate-menu-item';
import { CRUDService } from "../interface/crud-service.interface";
import { RequestService } from "./request.service";
import { ApiResourceEnum } from "./api-resource.enum";
import {TreeNode} from "primeng/api";

@Injectable()
export class PlateMenuItemsService extends RequestService implements CRUDService<PlateMenuItem> {

  constructor(private _http: HttpClient) {
    super(ApiResourceEnum.PLATE_MENU_ITEM);
  }

  public getAll(completed: boolean = false): Observable<PlateMenuItem[]> {
    return this._http.get(this._getUrl() + `?statuses=${completed ? 'DONE,CANCELLED' : 'TODO,PROGRESS'}`, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || []) as PlateMenuItem[];
      })
    );
  }

  public getById(id: string): Observable<PlateMenuItem> {
    return this._http.get(this._getUrl(id), RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as PlateMenuItem;
      })
    );
  }

  public getByIds(ids: string[]): Observable<PlateMenuItem[]> {
    return this._http.post(`${this._getUrl()}/ids`, ids, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as PlateMenuItem[];
      })
    );
  }

  public create(dto: PlateMenuItem): Observable<PlateMenuItem> {
    return this._http.post(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as PlateMenuItem;
      })
    );
  }

  public createAll(dtoList: PlateMenuItem[]): Observable<PlateMenuItem[]> {
    return this._http.post(`${this._getUrl()}/list`, dtoList, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as PlateMenuItem[];
      })
    );
  }

  public update(dto: PlateMenuItem): Observable<PlateMenuItem> {
    return this._http.put(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as PlateMenuItem;
      })
    );
  }

  public updateAll(dtoList: PlateMenuItem[]): Observable<PlateMenuItem[]> {
    return this._http.put(`${this._getUrl()}/list`, dtoList, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || {}) as PlateMenuItem[];
      })
    );
  }

  public delete(id: string): Observable<any> {
    const httpOptions = {
      ...RequestService.baseHttpOptions,
      body: id
    };
    return this._http.delete(`${this._getUrl()}`, httpOptions).pipe(
      map((res: any) => {
        return (res || {});
      })
    );
  }

  public deleteAll(ids: string[]): Observable<any> {
    const httpOptions = {
      ...RequestService.baseHttpOptions,
      body: ids
    };
    return this._http.delete(`${this._getUrl()}/list`, httpOptions).pipe(
      map((res: any) => {
        return (res || {});
      })
    );
  }

  public getUnassigned(): Observable<PlateMenuItem[]> {
    return this._http.get(this._getUrl() + `/unassigned`, RequestService.baseHttpOptions)
      .pipe(
        map((res: any) => (res || []) as PlateMenuItem[])
      );
  }

  public static getMenuItemNode(categories: Category[], menuItem: MenuItem): TreeNode {
    return {
      label: menuItem.name,
      data: menuItem,
      parent: {
        data: categories.find(category => category.id === menuItem.categoryId)
      }
    };
  }

  public static getCategoryMenuItemTreeNodeOptions(categories: Category[], items: MenuItem[]): TreeNode[] {
    const optionsTree: TreeNode[] = [];
    optionsTree.push(...categories.map(category => {
      return  {
        key: category.id,
        label: category.name,
        data: category,
        expandedIcon: 'pi pi-folder-open',
        collapsedIcon: 'pi pi-folder',
        selectable: false,
        children: []
      } as TreeNode;
    }));

    items.forEach(item => {
      const itemNode = {
        key: item.id,
        label: item.name,
        data: item,
        icon: 'pi pi-file'
      };
      const itemCategoryNode = optionsTree.find(node => node.key === item.categoryId);
      if (itemCategoryNode) {
        itemCategoryNode.children?.push(itemNode);
      }
    });

    return optionsTree;
  }

  public static getCategoryMenuItemTreeNodes(categories: Category[], items: MenuItem[]): Category[] {
    const treeNodes: any[] = [];
    treeNodes.push(...categories.map(category => {
      return  {
        ...category,
        menuItems: []
      } as TreeNode;
    }));

    items.forEach(item => {
      const itemNode = {
        ...item,
        selected: false
      } as MenuItemExtended;
      const itemCategoryNode = treeNodes.find(node => node.id === item.categoryId);
      if (itemCategoryNode) {
        itemNode.category = {
          id: itemCategoryNode.id,
          name: itemCategoryNode.name,
          description: itemCategoryNode.description,
          color: itemCategoryNode.color
        };
        itemCategoryNode.menuItems?.push(itemNode);
      }
    });

    return treeNodes;
  }

  public static createFakeId(): string {
    let id = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 5; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
}
