import {Component, OnDestroy, OnInit} from '@angular/core';
import {PlateService} from '../services/plate.service';
import {PlateQueueManagerService} from '../services/plate-queue-manager.service';
import {Plate} from '../plate.interface';
import {PlateMenuItem, Status} from '../../plate-menu-items/plate-menu-item';
import {Subscription} from 'rxjs';
import {I18nService} from '../../../services/i18n.service';
import {DelayThresholdsService} from '../../../services/delay-thresholds.service';
import {StatsService} from '../../shared/service/stats.service';
import {Stats, StatsChart} from '../../shared/interface/stats.interface';
import {MessageService} from 'primeng/api';

interface PlateStats {
  plate: Plate;
  progressCount: number;
  todoCount: number;
  maxDelayMinutes: number;
  avgDelayMinutes: number;
  oldestOrderTime: Date | null;
  progressItems: PlateMenuItem[];
}

interface GlobalStats {
  totalProgress: number;
  totalTodo: number;
  totalPlates: number;
  activePlates: number;
  avgDelayAllPlates: number;
  maxDelayAllPlates: number;
  criticalOrders: number; // ordini oltre 20 minuti
}

@Component({
  selector: 'plates-summary',
  templateUrl: './plates-summary.component.html',
  styleUrls: ['./plates-summary.component.scss']
})
export class PlatesSummaryComponent implements OnInit, OnDestroy {

  public readonly i18n: any;
  public loading: boolean = true;
  public platesStats: PlateStats[] = [];
  public globalStats: GlobalStats = {
    totalProgress: 0,
    totalTodo: 0,
    totalPlates: 0,
    activePlates: 0,
    avgDelayAllPlates: 0,
    maxDelayAllPlates: 0,
    criticalOrders: 0
  };

  // Statistiche ordini per periodo
  public selectedStats?: Stats;
  public statsData: StatsChart | undefined;
  public dateFrom: Date = new Date();
  public dateTo: Date = new Date();
  public statsLoading: boolean = false;
  public showEmpty: boolean = false;

  // Grafici aggiuntivi
  public plateWorkloadChartData: any;
  public plateDelayChartData: any;
  public chartOptions: any;

  // Soglie dinamiche per la leggenda
  public get warningThreshold(): number {
    return this._delayThresholdsService.getThresholds().warning;
  }

  public get dangerThreshold(): number {
    return this._delayThresholdsService.getThresholds().danger;
  }

  private _updateInterval: any;
  private _subscriptions: Subscription = new Subscription();

  constructor(
    private _plateService: PlateService,
    private _plateQueueManager: PlateQueueManagerService,
    private _i18nService: I18nService,
    private _delayThresholdsService: DelayThresholdsService,
    private _statsService: StatsService,
    private _messageService: MessageService
  ) {
    this.i18n = _i18nService.instance;
    
    // Opzioni comuni per i grafici
    this.chartOptions = {
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 11
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: {
              size: 11
            }
          },
          grid: {
            display: false
          }
        }
      }
    };
  }

  ngOnInit(): void {
    // Carica le piastre e inizializza le code prima di caricare i dati
    this._plateService.getAll().subscribe(plates => {
      // Controlla se le code sono già inizializzate
      const queuesInitialized = plates.every(plate => 
        plate.id ? this._plateQueueManager.getQueue(plate.id) : true
      );

      if (!queuesInitialized) {
        // Inizializza le code se non sono state ancora caricate
        this._plateQueueManager.load(plates).subscribe(() => {
          this.loadData();
        });
      } else {
        // Le code sono già inizializzate, carica direttamente i dati
        this.loadData();
      }
    });
    
    // Carica le statistiche di oggi all'avvio
    this._subscriptions.add(
      this._statsService.getTodayStats().subscribe((stats: Stats[]) => {
        if (stats.length > 0) {
          this._loadDiagramData(stats);
        }
      })
    );
    
    // Aggiorna ogni 30 secondi
    this._updateInterval = setInterval(() => {
      this.loadData();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
    }
    this._subscriptions.unsubscribe();
  }

  loadData(): void {
    this.loading = true;
    
    this._plateService.getAll().subscribe(plates => {
      this.platesStats = [];
      let totalDelays: number[] = [];
      
      const enabledPlates = plates.filter(p => p.id && p.enabled);
      
      // Verifica che tutte le code siano inizializzate
      const allQueuesReady = enabledPlates.every(plate => 
        this._plateQueueManager.getQueue(plate.id!)
      );
      
      if (!allQueuesReady) {
        // Se le code non sono pronte, ricaricale
        this._plateQueueManager.load(plates).subscribe(() => {
          this.processPlatesData(enabledPlates, totalDelays);
        });
      } else {
        this.processPlatesData(enabledPlates, totalDelays);
      }
    });
  }

  private processPlatesData(plates: Plate[], totalDelays: number[]): void {
    plates.forEach(plate => {
      if (plate.id) {
        const queue = this._plateQueueManager.getQueue(plate.id);
        if (!queue) {
          return; // Skip if queue is not initialized
        }
        const items = queue.values;
        
        const progressItems = items.filter((i: PlateMenuItem) => i.status === Status.Progress);
        const todoItems = items.filter((i: PlateMenuItem) => i.status === Status.Todo);
        
        const stats = this.calculatePlateStats(plate, progressItems);
        this.platesStats.push({
          plate,
          progressCount: progressItems.length,
          todoCount: todoItems.length,
          ...stats
        });
        
        // Aggiungi ai ritardi totali
        if (stats.maxDelayMinutes > 0) {
          totalDelays.push(stats.maxDelayMinutes);
        }
      }
    });
    
    // Calcola statistiche globali
    this.calculateGlobalStats(totalDelays);
    
    // Ordina per ritardo massimo decrescente
    this.platesStats.sort((a, b) => b.maxDelayMinutes - a.maxDelayMinutes);
    
    // Genera i grafici delle piastre
    this.generatePlateCharts();
    
    this.loading = false;
  }

  private calculatePlateStats(plate: Plate, progressItems: PlateMenuItem[]): {
    maxDelayMinutes: number;
    avgDelayMinutes: number;
    oldestOrderTime: Date | null;
    progressItems: PlateMenuItem[];
  } {
    if (progressItems.length === 0) {
      return {
        maxDelayMinutes: 0,
        avgDelayMinutes: 0,
        oldestOrderTime: null,
        progressItems: []
      };
    }

    const now = new Date().getTime();
    const delays: number[] = [];
    let oldestTime: Date | null = null;

    progressItems.forEach(item => {
      if (item.createdDate) {
        const createdTime = new Date(item.createdDate);
        const delayMs = now - createdTime.getTime();
        const delayMinutes = Math.floor(delayMs / 60000);
        delays.push(delayMinutes);
        
        if (!oldestTime || createdTime < oldestTime) {
          oldestTime = createdTime;
        }
      }
    });

    return {
      maxDelayMinutes: delays.length > 0 ? Math.max(...delays) : 0,
      avgDelayMinutes: delays.length > 0 ? Math.floor(delays.reduce((a, b) => a + b, 0) / delays.length) : 0,
      oldestOrderTime: oldestTime,
      progressItems
    };
  }

  private calculateGlobalStats(totalDelays: number[]): void {
    this.globalStats = {
      totalProgress: this.platesStats.reduce((sum, s) => sum + s.progressCount, 0),
      totalTodo: this.platesStats.reduce((sum, s) => sum + s.todoCount, 0),
      totalPlates: this.platesStats.length,
      activePlates: this.platesStats.filter(s => s.progressCount > 0 || s.todoCount > 0).length,
      avgDelayAllPlates: totalDelays.length > 0 ? 
        Math.floor(totalDelays.reduce((a, b) => a + b, 0) / totalDelays.length) : 0,
      maxDelayAllPlates: totalDelays.length > 0 ? Math.max(...totalDelays) : 0,
      criticalOrders: this.platesStats.reduce((sum, s) => 
        sum + s.progressItems.filter(item => {
          if (!item.createdDate) return false;
          const delayMinutes = Math.floor((new Date().getTime() - new Date(item.createdDate).getTime()) / 60000);
          const thresholds = this._delayThresholdsService.getThresholds();
          return delayMinutes >= thresholds.danger;
        }).length, 0)
    };
  }

  getDelaySeverity(minutes: number): 'success' | 'warning' | 'danger' {
    return this._delayThresholdsService.getSeverity(minutes);
  }

  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  }

  formatDateTime(date: Date | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  refreshData(): void {
    this.loadData();
  }

  private generatePlateCharts(): void {
    if (this.platesStats.length === 0) {
      this.plateWorkloadChartData = undefined;
      this.plateDelayChartData = undefined;
      return;
    }

    // Ordina le piastre per nome per una visualizzazione più ordinata
    const sortedStats = [...this.platesStats].sort((a, b) => 
      (a.plate.name || '').localeCompare(b.plate.name || '')
    );

    // Grafico 1: Carico di lavoro per piastra (ordini in corso + in coda)
    const plateNames = sortedStats.map(s => s.plate.name);
    const progressCounts = sortedStats.map(s => s.progressCount);
    const todoCounts = sortedStats.map(s => s.todoCount);

    this.plateWorkloadChartData = {
      labels: plateNames,
      datasets: [
        {
          label: 'In Corso',
          backgroundColor: '#2196f3',
          data: progressCounts
        },
        {
          label: 'In Coda',
          backgroundColor: '#ff9800',
          data: todoCounts
        }
      ]
    };

    // Grafico 2: Ritardi medi per piastra
    // Mostra solo le piastre con ordini attivi
    const platesWithOrders = sortedStats.filter(s => s.progressCount > 0);
    
    if (platesWithOrders.length > 0) {
      const plateNamesWithDelays = platesWithOrders.map(s => s.plate.name);
      const avgDelays = platesWithOrders.map(s => s.avgDelayMinutes);
      const maxDelays = platesWithOrders.map(s => s.maxDelayMinutes);

      // Colori dinamici basati sulla severità del ritardo medio
      const backgroundColors = avgDelays.map(delay => {
        const severity = this.getDelaySeverity(delay);
        switch (severity) {
          case 'success': return '#4caf50';
          case 'warning': return '#ff9800';
          case 'danger': return '#f44336';
          default: return '#9e9e9e';
        }
      });

      this.plateDelayChartData = {
        labels: plateNamesWithDelays,
        datasets: [
          {
            label: 'Ritardo Medio (min)',
            backgroundColor: backgroundColors,
            data: avgDelays
          }
        ]
      };
    } else {
      this.plateDelayChartData = undefined;
    }
  }

  searchByDate(): void {
    this.statsLoading = true;
    // Reset stato precedente
    this.showEmpty = false;
    this.selectedStats = undefined;
    this.statsData = undefined;
    
    this._subscriptions.add(
      this._statsService.getStats(StatsService.getDateFormatted(this.dateFrom),
      StatsService.getDateFormatted(this.dateTo))
      .subscribe({
        next: (stats: Stats[]) => {
          if (stats.length > 0) {
            this._loadDiagramData(stats);
          } else {
            this.showEmpty = true;
          }
          this.statsLoading = false;
        }, error: () => {
          this._messageService.add({
            severity: 'error',
            summary: 'Caricamento Statistiche',
            detail: `Errore durante il caricamento delle statistiche per i giorni selezionati`
          });
          this.showEmpty = true;
          this.statsLoading = false;
        }
      })
    );
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
    this.statsData = {
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
}
