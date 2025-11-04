import {Component, OnDestroy, OnInit} from '@angular/core';
import {I18nService} from "../../../services/i18n.service";
import {Observable, Subscription} from "rxjs";
import {Plate} from "../../plates/plate.interface";
import {PlateService} from "../../plates/services/plate.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {StatsService} from "../../shared/service/stats.service";
import {Stats, StatsChart} from "../../shared/interface/stats.interface";
import {Status} from "../../plate-menu-items/plate-menu-item";
import {ConfirmationService, MessageService} from "primeng/api";
import { GsgIntegrationService } from '../../shared/service/gsg-integration.service';
import { GsgIntegrationResult } from '../../shared/interface/gsg-integration.interface';

@Component({
  selector: 'settings',
  templateUrl: 'settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {

  public readonly i18n: any;

  public display: boolean = false;
  public selectedPlate?: Plate;
  public plates: Plate[] = [];
  public form?: FormGroup | undefined;
  public selectedStats?: Stats;
  public data: StatsChart | undefined;
  public dateFrom: Date = new Date();
  public dateTo: Date = new Date()
  public loading: boolean = false;
  public showEmpty: boolean = false;
  public showNotify: boolean = false;
  public showItemDelays: boolean = false;

  private subs: Subscription = new Subscription();

  constructor(public i18nService: I18nService,
              private _platesService: PlateService,
              private _statsService: StatsService,
              private _messageService: MessageService,
              private _gsgIntegrationService: GsgIntegrationService,
              private _confirmationService: ConfirmationService) {
    this.i18n = i18nService.instance;
  }

  public ngOnInit(): void {
    this._platesService.getAll().subscribe(plates => this.plates = plates);
    this._loadSettingsFromLocalStorage();

    this.form = new FormGroup({
      name: new FormControl("", Validators.required),
      color: new FormControl("", Validators.required),
      number: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")])
    });

    this.subs.add(
      this._statsService.getTodayStats().subscribe((stats: Stats[]) => {
        this._loadDiagramData(stats);
      })
    );
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
    this._platesService.update({
      ...this.form?.value,
      enabled: true,
      slot: [0, this.form?.get("number")?.value],
      id: this.selectedPlate?.id
    }).subscribe(
      _ => this._platesService.getAll().subscribe(plates => {
        this.plates = plates;
        this.display = false;
      }));
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

  public searchByDate(): void {
    this.loading = true;
    this.subs.add(
      this._statsService.getStats(StatsService.getDateFormatted(this.dateFrom),
      StatsService.getDateFormatted(this.dateTo))
      .subscribe({
        next: (stats: Stats[]) => {
          if (stats.length > 0)
            this._loadDiagramData(stats);
          else
            this.showEmpty = true;

          this.loading = false;
        }, error: () => {
          this._messageService.add({
            severity: 'error',
            summary: 'Caricamento Statistiche',
            detail: `Errore durante il caricamento delle statistiche per i giorni selezionati`
          });
          this.loading = false;
        }
      })
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

  private _loadDiagramData(stats: Stats[]) {
    this.showEmpty = false;
    this.selectedStats = stats[0];

    if (this.selectedStats && stats.length > 1) {
      stats.slice(1).forEach((stats: Stats) => {
        this.selectedStats!.count! += stats.count;
        this.selectedStats!.statusCount[Status.Todo] += stats.statusCount[Status.Todo];
        this.selectedStats!.statusCount[Status.Progress] += stats.statusCount[Status.Progress];
        this.selectedStats!.statusCount[Status.Done] += stats.statusCount[Status.Done];
        this.selectedStats!.statusCount[Status.Cancelled] += stats.statusCount[Status.Cancelled];
      });
    }
    this.data = {
      labels: ['Attesa', 'In Corso', 'Completati', 'Cancellati'],
      datasets: [
        {
          data: [
            this.selectedStats.statusCount[Status.Todo],
            this.selectedStats.statusCount[Status.Progress],
            this.selectedStats.statusCount[Status.Done],
            this.selectedStats.statusCount[Status.Cancelled]
          ],
          backgroundColor: [
            "#0d91e8",
            "#f6dd38",
            "#5ff104",
            "#f31919",
          ]
        }
      ]
    };
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
}
