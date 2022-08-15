import {Injectable} from '@angular/core';
import {RequestService} from "../../shared/service/request.service";
import {CRUDService} from "../../shared/interface/crud-service.interface";
import {ApiResourceEnum} from "../../shared/service/api-resource.enum";
import {BehaviorSubject, map, Observable} from "rxjs";
import {Plate, PlateInterface} from "../plate.interface";
import {HttpClient} from "@angular/common/http";
import {I18nService} from "../../../services/i18n.service";
import {PlateMenuItem} from "../../plate-menu-items/plate-menu-item";

@Injectable({
  providedIn: 'root'
})
export class PlateService extends RequestService implements CRUDService<Plate> {

  public plates$: BehaviorSubject<Plate[]> = new BehaviorSubject([] as Plate[]);

  private readonly _i18n: any;

  constructor(private _http: HttpClient, private _i18nService: I18nService) {
    super(ApiResourceEnum.PLATE);
    this._i18n = _i18nService.instance;
  }

  public create(dto: Plate): Observable<Plate> {
    return this._http.post(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return this._evaluateStatus(res);
      })
    );
  }

  public delete(id: string): Observable<any> {
    return this._http.delete(this._getUrl(id), RequestService.baseHttpOptions);
  }

  public getAll(): Observable<Array<Plate>> {
    return this._http.get(this._getUrl(), RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        const plates: Plate[] = ((res || []) as Plate[]).map(p => {
          return this._evaluateStatus(p);
        });

        this.plates$.next(plates);
        return plates;
      })
    );
  }

  public getById(id: string): Observable<Plate> {
    return this._http.get(this._getUrl(id), RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return this._evaluateStatus(res);
      })
    );
  }

  public getStatusById(id: string): Observable<PlateMenuItem[]> {
    return this._http.get(this._getUrl() + `/status/${id}`, RequestService.baseHttpOptions)
      .pipe(
        map((res: any) => (res || []) as PlateMenuItem[])
      );
  }

  public update(dto: Plate): Observable<Plate> {
    return this._http.put(this._getUrl(), dto, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return this._evaluateStatus(res);
      })
    );
  }

  public switch(id: string, enable: boolean): Observable<Plate> {
    return this._http.patch(this._getUrl(id) + `?enable=${enable}`, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return this._evaluateStatus(res);
      })
    );
  }

  private _evaluateStatus(config: Plate): Plate {
    if (!config.slot)
      config.slot = [0, 0];

    const used: number = config.slot[0];
    const total: number = config.slot[1];
    let label: string = `${used}/${total} `;

    if (used < total) {
      config._severity = "success";
      label = label + this._i18n.PLATE.FREE;
    } else {
      config._severity = "danger";
      label = label + this._i18n.PLATE.FULL;
    }

    config._status = label;

    config.mode = config.enabled ? PlateInterface.On : PlateInterface.Off;

    return config;
  }
}
