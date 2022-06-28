import {Component, Inject, OnInit} from '@angular/core';
import {I18nService} from "../../../services/i18n.service";
import {Plate} from "../../plates/plate/plate.model";
import {ApiConnector} from "../../../services/api-connector";
import {Observable} from "rxjs";

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  public readonly i18n: any;

  public plates$: Observable<Plate[]> = new Observable<[]>();

  constructor(public i18nService: I18nService,
              @Inject('ApiConnector') private _apiConnector: ApiConnector) {
    this.i18n = i18nService.instance;
  }

  ngOnInit(): void {
    this.plates$ = this._apiConnector.getPlates();
  }

}
