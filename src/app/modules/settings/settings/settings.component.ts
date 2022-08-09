import {Component, Inject, OnInit} from '@angular/core';
import {I18nService} from "../../../services/i18n.service";
import {ApiConnector} from "../../../services/api-connector";
import {Observable} from "rxjs";
import {Plate} from "../../plates/plate.interface";
import {PlateService} from "../../plates/services/plate.service";

@Component({
  selector: 'settings',
  template: `
    <h3>{{i18n.SETTINGS.TITLE}}</h3>
    <main>
      <section id="plate-settings__container">
        <ng-container *ngFor="let plate of plates$ | async">
          <plate-info [config]="plate"
                      (delete)="onDelete($event)"
          ></plate-info>
        </ng-container>
      </section>
    </main>
  `,
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  public readonly i18n: any;

  public plates$: Observable<Plate[]> = new Observable<[]>();

  constructor(public i18nService: I18nService,
              private _platesService: PlateService) {
    this.i18n = i18nService.instance;
  }

  ngOnInit(): void {
    this.plates$ = this._platesService.plates$;
  }

  public onDelete(id: string): void {
    this._platesService.delete(id).subscribe(
      () => this._platesService.getAll().subscribe());
  }

}
