import {Component, OnDestroy, OnInit} from '@angular/core';
import {I18nService} from "../../../services/i18n.service";
import {Subscription} from "rxjs";
import {Plate} from "../../plates/plate.interface";
import {PlateService} from "../../plates/services/plate.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ConfirmationService, MessageService} from "primeng/api";
import { GsgIntegrationService } from '../../shared/service/gsg-integration.service';
import { GsgIntegrationResult } from '../../shared/interface/gsg-integration.interface';
import { DelayThresholdsService, DelayThresholds } from '../../../services/delay-thresholds.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'settings',
  templateUrl: 'settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {

  public readonly i18n: any;

  public display: boolean = false;
  public isEditMode: boolean = false;
  public selectedPlate?: Plate;
  public plates: Plate[] = [];
  public form?: FormGroup | undefined;
  public showNotify: boolean = false;
  public showItemDelays: boolean = false;
  public delayThresholds: DelayThresholds = { warning: 10, danger: 20 };
  public isDarkTheme: boolean = false;

  // Color Picker Palette
  public primaryColors: string[] = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'
  ];

  private subs: Subscription = new Subscription();

  constructor(public i18nService: I18nService,
              private _platesService: PlateService,
              private _messageService: MessageService,
              private _gsgIntegrationService: GsgIntegrationService,
              private _confirmationService: ConfirmationService,
              private _delayThresholdsService: DelayThresholdsService,
              private _themeService: ThemeService) {
    this.i18n = i18nService.instance;
  }

  public ngOnInit(): void {
    this._platesService.getAll().subscribe(plates => this.plates = plates);
    this._loadSettingsFromLocalStorage();
    this.delayThresholds = this._delayThresholdsService.getThresholds();
    this.isDarkTheme = this._themeService.getCurrentTheme() === 'dark';

    this.form = new FormGroup({
      name: new FormControl("", Validators.required),
      color: new FormControl("", Validators.required),
      number: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")])
    });
  }

  public ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  public onGSGInit() {
    this._confirmationService.confirm({
      message: `Confermi di voler inizializzare categorie e voci di menù da GSG?\nCosì perderai i dati di ordini, categorie e voci di menù!`,
      accept: () => {
        this.subs.add(
          this._gsgIntegrationService.initGsg().subscribe((res: GsgIntegrationResult) => {
            console.log(res);
            this._messageService.add({
              severity: 'success',
              summary: 'App inizializzata',
              detail: `L'applicazione è stata inizializzata da GSG correttamente`
            });
          })
        );
      }
    });
  }

  public onDelete(id: string): void {
    this._platesService.delete(id).subscribe(
      () => this._platesService.getAll().subscribe(plates => this.plates = plates));
  }

  public onSubmit(): void {
    if (this.isEditMode) {
      // Update existing plate
      this._platesService.update({
        ...this.form?.value,
        enabled: true,
        slot: [0, this.form?.get("number")?.value],
        id: this.selectedPlate?.id
      }).subscribe(
        _ => {
          this._messageService.add({
            severity: 'success',
            summary: 'Piastra Modificata',
            detail: `La piastra "${this.form?.value.name}" è stata modificata con successo`
          });
          this._platesService.getAll().subscribe(plates => {
            this.plates = plates;
            this.display = false;
          });
        });
    } else {
      // Create new plate
      this._platesService.create({
        ...this.form?.value,
        enabled: false,
        slot: [0, this.form?.get("number")?.value]
      }).subscribe(
        _ => {
          this._messageService.add({
            severity: 'success',
            summary: 'Piastra Creata',
            detail: `La piastra "${this.form?.value.name}" è stata creata con successo`
          });
          this._platesService.getAll().subscribe(plates => {
            this.plates = plates;
            this.display = false;
          });
        });
    }
  }

  public discardForm(): void {
    this.form?.reset();
    this.display = false;
  }

  public showCreateDialog(): void {
    this.isEditMode = false;
    this.selectedPlate = undefined;
    this.form = new FormGroup({
      name: new FormControl("", Validators.required),
      color: new FormControl("#3b82f6", Validators.required),
      number: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")])
    });
    this.display = true;
  }

  public showEditDialog(id: string) {
    this.isEditMode = true;
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

  public onSwitchPlate(event: { id: string, enable: boolean }) {
    this._platesService.switch(event.id, event.enable)
      .subscribe({
        next: (plate: Plate) => {
          this._messageService.add({
            severity: 'success',
            summary: `Piastra ${plate.enabled ? 'Accesa' : 'Spenta'}`,
            detail: `${plate.name} è stata ${plate.enabled ? 'accesa' : 'spenta'} con successo`
          });
          this._platesService.getAll().subscribe(plates => this.plates = plates)
        },
        error: (error) => {
          this._messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: `La piastra non è vuota, spostare tutti gli ordini prima di spegnerla`
          });
        }
      })
  }

  private _loadSettingsFromLocalStorage(): void {
    const savedShowNotify = localStorage.getItem('plates_showNotify');
    const savedShowItemDelays = localStorage.getItem('plates_showItemDelays');
    
    if (savedShowNotify !== null) {
      this.showNotify = savedShowNotify === 'true';
    }
    
    if (savedShowItemDelays !== null) {
      this.showItemDelays = savedShowItemDelays === 'true';
    }
  }

  public onThemeChange(): void {
    const newTheme = this.isDarkTheme ? 'dark' : 'light';
    this._themeService.setTheme(newTheme);
    this._messageService.add({
      severity: 'success',
      summary: 'Tema cambiato',
      detail: `Tema ${this.isDarkTheme ? 'scuro' : 'chiaro'} attivato`,
      life: 2000
    });
  }

  public onShowNotifyChange(): void {
    localStorage.setItem('plates_showNotify', this.showNotify.toString());
    this._messageService.add({
      severity: 'success',
      summary: 'Impostazioni salvate',
      detail: `Notifiche audio ${this.showNotify ? 'attivate' : 'disattivate'}`,
      life: 2000
    });
  }

  public onShowItemDelaysChange(): void {
    localStorage.setItem('plates_showItemDelays', this.showItemDelays.toString());
    this._messageService.add({
      severity: 'success',
      summary: 'Impostazioni salvate',
      detail: `Visualizzazione ritardi item ${this.showItemDelays ? 'attivata' : 'disattivata'}`,
      life: 2000
    });
  }

  public onDelayThresholdChange(): void {
    // Validate that warning < danger
    if (this.delayThresholds.warning >= this.delayThresholds.danger) {
      this._messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'La soglia di avviso deve essere inferiore alla soglia di pericolo',
        life: 3000
      });
      // Reset to saved values
      this.delayThresholds = this._delayThresholdsService.getThresholds();
      return;
    }

    this._delayThresholdsService.setThresholds(this.delayThresholds);
    this._messageService.add({
      severity: 'success',
      summary: 'Impostazioni salvate',
      detail: `Soglie ritardi aggiornate: ${this.delayThresholds.warning}min (giallo), ${this.delayThresholds.danger}min (rosso)`,
      life: 3000
    });
  }

  public resetDelayThresholds(): void {
    this._delayThresholdsService.resetToDefaults();
    this.delayThresholds = this._delayThresholdsService.getThresholds();
    this._messageService.add({
      severity: 'info',
      summary: 'Impostazioni ripristinate',
      detail: 'Soglie ritardi ripristinate ai valori predefiniti',
      life: 2000
    });
  }

}
