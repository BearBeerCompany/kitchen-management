import {Injectable} from '@angular/core';
import {RequestService} from "./request.service";
import {ApiResourceEnum} from "./api-resource.enum";
import {Stats} from "../interface/stats.interface";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class StatsService extends RequestService {

  constructor(private _http: HttpClient) {
    super(ApiResourceEnum.STATS);
  }

  public getStats(from: string, to?: string | null): Observable<Stats[]> {
    return this._http.get(this._getUrl() + `?from=${from}${to != null ? '&to=' + to : ''}`, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res || []) as Stats[];
      })
    );
  }

  public getTodayStats(): Observable<Stats[]> {
    const date: Date = new Date();
    const from: string = StatsService.getDateFormatted(date);
    return this.getStats(from, null);
  }

  public static getDateFormatted(date: Date): string {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }
}
