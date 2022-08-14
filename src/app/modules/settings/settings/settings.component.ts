import {Component, OnDestroy, OnInit} from '@angular/core';
import {I18nService} from "../../../services/i18n.service";
import {Observable, Subscription} from "rxjs";
import {Plate} from "../../plates/plate.interface";
import {PlateService} from "../../plates/services/plate.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {StatsService} from "../../shared/service/stats.service";
import {Stats, StatsChart} from "../../shared/interface/stats.interface";
import {Status} from "../../plate-menu-items/plate-menu-item";
import {MessageService} from "primeng/api";

@Component({
  selector: 'settings',
  templateUrl: 'settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {

  public readonly i18n: any;

  public display: boolean = false;
  public selectedPlate?: Plate;
  public plates$: Observable<Plate[]> = new Observable<[]>();
  public form?: FormGroup | undefined;
  public selectedStats?: Stats;
  public data: StatsChart | undefined;
  public dateFrom: Date = new Date();
  public dateTo: Date = new Date()
  public loading: boolean = false;
  public showEmpty: boolean = false;

  private statsSub: Subscription = new Subscription();

  constructor(public i18nService: I18nService,
              private _platesService: PlateService,
              private _statsService: StatsService,
              private _messageService: MessageService) {
    this.i18n = i18nService.instance;
  }

  public ngOnInit(): void {
    this.plates$ = this._platesService.plates$;

    this.form = new FormGroup({
      name: new FormControl("", Validators.required),
      color: new FormControl("", Validators.required),
      number: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")])
    });

    this.statsSub = this._statsService.getTodayStats().subscribe((stats: Stats[]) => {
      this._loadDiagramData(stats);
    });
  }

  public ngOnDestroy(): void {
    this.statsSub.unsubscribe();
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

  public searchByDate(): void {
    this.loading = true;
    this.statsSub = this._statsService.getStats(StatsService.getDateFormatted(this.dateFrom),
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
      });
  }


  private _loadDiagramData(stats: Stats[]) {
    this.showEmpty = false;
    this.selectedStats = stats[0];
    this.data = {
      labels: ['Attesa', 'In Corso', 'Completati', 'Cancellati'],
      datasets: [
        {
          data: [this.selectedStats.statusCount[Status.Todo],
            this.selectedStats.statusCount[Status.Progress],
            this.selectedStats.statusCount[Status.Done],
            this.selectedStats.statusCount[Status.Cancelled]],
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
}
