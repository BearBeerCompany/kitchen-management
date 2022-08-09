import {Component, Inject, OnInit} from '@angular/core';
import {I18nService} from "../../../services/i18n.service";
import {ApiConnector} from "../../../services/api-connector";
import {Observable} from "rxjs";
import {Plate, PlateInterface} from "../../plates/plate.interface";
import {PlateService} from "../../plates/services/plate.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'settings',
  template: `
    <h3>{{i18n.SETTINGS.TITLE}}</h3>
    <main>
      <section id="plate-settings__container">
        <ng-container *ngFor="let plate of plates$ | async">
          <plate-info [config]="plate"
                      (delete)="onDelete($event)"
                      (edit)="showDialog($event)"
          ></plate-info>
        </ng-container>
      </section>
    </main>
    <p-dialog header="Modifica Piastra"
              [style]="{height: '80vh'}"
              [(visible)]="display"
              [draggable]="false">
      <form (ngSubmit)="onSubmit()" [formGroup]="form!">
        <h3>{{i18n.PLATE.FORM.TITLE}}</h3>
        <label>{{i18n.PLATE.FORM.NAME}}</label>
        <input formControlName="name"
               pInputText
               type="text">
        <label>{{i18n.PLATE.FORM.COLOR}}</label>
        <p-colorPicker [inline]="true"
                       formControlName="color"></p-colorPicker>
        <label>{{i18n.PLATE.FORM.NUMBER}}</label>
        <p-inputNumber [max]="200"
                       [min]="0"
                       [showButtons]="true"
                       formControlName="number"></p-inputNumber>
        <div id="confirmForm">
          <button (click)="discardForm()"
                  [label]="i18n.COMMON.UNDO"
                  class="p-button-secondary" pButton pRipple
                  type="button"></button>
          <button [disabled]="form?.valid ? !form?.valid : true"
                  [label]="i18n.COMMON.SAVE"
                  class="p-button-success" pButton pRipple
                  type="submit"></button>
        </div>
      </form>
    </p-dialog>
  `,
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  public readonly i18n: any;

  public display: boolean = false;
  public selectedPlate?: Plate;
  public plates$: Observable<Plate[]> = new Observable<[]>();
  public form?: FormGroup | undefined;

  constructor(public i18nService: I18nService,
              private _platesService: PlateService) {
    this.i18n = i18nService.instance;
  }

  ngOnInit(): void {
    this.plates$ = this._platesService.plates$;

    this.form = new FormGroup({
      name: new FormControl("", Validators.required),
      color: new FormControl("", Validators.required),
      number: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")])
    });
  }

  public onDelete(id: string): void {
    this._platesService.delete(id).subscribe(
      () => this._platesService.getAll().subscribe());
  }

  public onSubmit(): void {
    this._platesService.update({
      ...this.form?.value,
      enabled: true,
      slot: [0, this.form?.get("number")?.value],
      id: this.selectedPlate?.id
    }).subscribe(
      _ => this._platesService.getAll().subscribe(_ => this.display = false));
  }

  public discardForm(): void {
    this.form?.reset();
    this.display = false;
  }

  public showDialog(id: string) {
    this._platesService.getById(id).subscribe(
      (plate: Plate) => {
        this.selectedPlate = plate;
        this.form = new FormGroup({
          name: new FormControl(plate.name, Validators.required),
          color: new FormControl(plate.color, Validators.required),
          number: new FormControl(plate.slot![1], [Validators.required, Validators.pattern("^[0-9]*$")])
        });
        this.display = true;
      }
    );
  }

}
