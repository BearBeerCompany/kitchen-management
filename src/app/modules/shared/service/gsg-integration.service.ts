import { Injectable } from "@angular/core";
import { RequestService } from "./request.service";
import { HttpClient } from "@angular/common/http";
import { ApiResourceEnum } from "./api-resource.enum";
import { Observable, map } from "rxjs";
import { GsgIntegrationResult } from "../interface/gsg-integration.interface";

@Injectable({
  providedIn: 'root'
})
export class GsgIntegrationService extends RequestService {
  
  constructor(private _http: HttpClient) {
    super(ApiResourceEnum.GSG_INTEGRATION);
  }

  public initGsg(): Observable<GsgIntegrationResult> {
    return this._http.post(this._getUrl() + `/init`, RequestService.baseHttpOptions).pipe(
      map((res: any) => {
        return (res) as GsgIntegrationResult;
      })
    );
  }

}