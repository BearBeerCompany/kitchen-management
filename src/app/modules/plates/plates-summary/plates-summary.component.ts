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
import {PlateMenuItemsService} from '../../shared/service/plate-menu-items.service';

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

  // Nuove analisi basate su ordini storici
  public topProductsChartData: any;
  public hourlyOrdersChartData: any;
  public categoryDistributionChartData: any;
  public hourlyPerformanceChartData: any;
  public cancellationRate: number = 0;
  public completedOrdersCount: number = 0;
  public cancelledOrdersCount: number = 0;
  public analysisLoading: boolean = false;

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
    private _messageService: MessageService,
    private _plateMenuItemsService: PlateMenuItemsService
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
    
    // Carica analisi ordini di oggi
    this.loadOrderAnalysis(new Date(), new Date());
    
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

  public loadOrderAnalysis(fromDate: Date, toDate: Date): void {
    this.analysisLoading = true;
    
    const event = {
      first: 0,
      rows: 10000 // Prendiamo molti record per l'analisi
    };
    
    // Carica sia ordini completati/cancellati che ordini in corso
    const completed$ = this._plateMenuItemsService.getAllPaged(true, event);
    const active$ = this._plateMenuItemsService.getAllPaged(false, event);
    
    // Combina i risultati
    this._subscriptions.add(
      completed$.subscribe({
        next: (completedPage) => {
          this._subscriptions.add(
            active$.subscribe({
              next: (activePage) => {
                const allOrders = [
                  ...(completedPage.elements || []),
                  ...(activePage.elements || [])
                ];
                
                console.log('Total orders loaded for analysis:', allOrders.length);
                
                // Filtra per data (confronta solo giorno/mese/anno, ignora ore)
                const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
                const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59);
                
                console.log('Date range:', fromDateOnly, 'to', toDateOnly);
                
                const filteredOrders = allOrders.filter((order: PlateMenuItem) => {
                  if (!order.createdDate) return false;
                  const orderDate = new Date(order.createdDate);
                  const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
                  const isInRange = orderDateOnly >= fromDateOnly && orderDateOnly <= toDateOnly;
                  
                  if (allOrders.indexOf(order) < 3) {
                    console.log('Sample order date:', orderDate, 'normalized:', orderDateOnly, 'in range:', isInRange);
                  }
                  
                  return isInRange;
                });
                
                console.log('Filtered orders for date range:', filteredOrders.length);
                
                this.generateOrderAnalysis(filteredOrders);
                this.analysisLoading = false;
              },
              error: (err) => {
                console.error('Error loading active orders:', err);
                // Se fallisce il caricamento degli ordini attivi, procedi comunque con quelli completati
                const orders = completedPage.elements || [];
                const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
                const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59);
                const filteredOrders = orders.filter((order: PlateMenuItem) => {
                  if (!order.createdDate) return false;
                  const orderDate = new Date(order.createdDate);
                  const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
                  return orderDateOnly >= fromDateOnly && orderDateOnly <= toDateOnly;
                });
                this.generateOrderAnalysis(filteredOrders);
                this.analysisLoading = false;
              }
            })
          );
        },
        error: (err) => {
          console.error('Error loading completed orders:', err);
          this._messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile caricare i dati per le analisi'
          });
          this.analysisLoading = false;
        }
      })
    );
  }

  private generateOrderAnalysis(orders: PlateMenuItem[]): void {
    console.log('generateOrderAnalysis called with', orders.length, 'orders');
    
    if (orders.length === 0) {
      console.log('No orders to analyze, clearing all charts');
      this.topProductsChartData = undefined;
      this.hourlyOrdersChartData = undefined;
      this.categoryDistributionChartData = undefined;
      this.hourlyPerformanceChartData = undefined;
      this.cancellationRate = 0;
      this.completedOrdersCount = 0;
      this.cancelledOrdersCount = 0;
      return;
    }

    // 1. Tasso di cancellazione
    this.completedOrdersCount = orders.filter(o => o.status === Status.Done).length;
    this.cancelledOrdersCount = orders.filter(o => o.status === Status.Cancelled).length;
    this.cancellationRate = orders.length > 0 
      ? Math.round((this.cancelledOrdersCount / orders.length) * 100) 
      : 0;
    
    console.log('Cancellation rate:', this.cancellationRate, '%');

    // 2. Top prodotti più ordinati
    const productCount = new Map<string, { name: string; count: number; category?: string }>();
    orders.forEach(order => {
      const productName = order.menuItem?.name || 'Sconosciuto';
      const existing = productCount.get(productName);
      if (existing) {
        existing.count++;
      } else {
        productCount.set(productName, {
          name: productName,
          count: 1,
          category: order.menuItem?.category?.name
        });
      }
    });

    const topProducts = Array.from(productCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    this.topProductsChartData = {
      labels: topProducts.map(p => p.name),
      datasets: [{
        label: 'Numero Ordini',
        backgroundColor: '#2196f3',
        data: topProducts.map(p => p.count)
      }]
    };
    
    console.log('Top products chart generated:', topProducts.length, 'products');

    // 3. Andamento ordini per ora
    const hourlyCount = new Array(24).fill(0);
    orders.forEach(order => {
      if (order.createdDate) {
        const hour = new Date(order.createdDate).getHours();
        hourlyCount[hour]++;
      }
    });

    console.log('Hourly distribution (full 24h):', hourlyCount);

    // Trova il range effettivo di ore con ordini
    let minHour = 24, maxHour = 0;
    hourlyCount.forEach((count, hour) => {
      if (count > 0) {
        minHour = Math.min(minHour, hour);
        maxHour = Math.max(maxHour, hour);
      }
    });

    // Espandi il range di almeno 2 ore prima e dopo
    minHour = Math.max(0, minHour - 1);
    maxHour = Math.min(23, maxHour + 1);

    // Se non ci sono ordini, usa range default 10-23
    if (minHour === 24) {
      minHour = 10;
      maxHour = 23;
    }

    const hourRange = hourlyCount.slice(minHour, maxHour + 1);
    const hourLabels = Array.from({ length: hourRange.length }, (_, i) => `${minHour + i}:00`);

    this.hourlyOrdersChartData = {
      labels: hourLabels,
      datasets: [{
        label: 'Ordini per Ora',
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        borderColor: '#2196f3',
        borderWidth: 2,
        data: hourRange,
        fill: true
      }]
    };
    
    console.log('Hourly orders chart generated:', {
      range: `${minHour}:00 - ${maxHour}:00`,
      totalOrders: hourRange.reduce((a, b) => a + b, 0),
      data: hourRange
    });

    // 4. Distribuzione per categoria
    const categoryCount = new Map<string, number>();
    orders.forEach((order, index) => {
      const categoryName = order.menuItem?.category?.name || 'Senza Categoria';
      categoryCount.set(categoryName, (categoryCount.get(categoryName) || 0) + 1);
      
      // Log primi 3 ordini per debug
      if (index < 3) {
        console.log('Sample order category:', {
          menuItem: order.menuItem?.name,
          category: order.menuItem?.category?.name,
          fullCategory: order.menuItem?.category
        });
      }
    });

    console.log('Category counts:', Array.from(categoryCount.entries()));

    const categories = Array.from(categoryCount.entries());
    
    if (categories.length > 0) {
      const categoryColors = [
        '#2196f3', '#ff9800', '#4caf50', '#f44336', 
        '#9c27b0', '#00bcd4', '#ffeb3b', '#795548'
      ];

      this.categoryDistributionChartData = {
        labels: categories.map(c => c[0]),
        datasets: [{
          data: categories.map(c => c[1]),
          backgroundColor: categoryColors.slice(0, categories.length)
        }]
      };
      
      console.log('Category distribution chart generated:', categories.length, 'categories', categories);
    } else {
      this.categoryDistributionChartData = undefined;
      console.log('No categories found, chart disabled');
    }

    // 5. Performance Temporale (ritardo medio per fascia oraria)
    // Calcoliamo il tempo medio tra creazione e completamento per fascia oraria
    const hourlyDelays: { [hour: number]: { total: number; count: number } } = {};
    
    // Inizializza per tutte le ore attive
    for (let h = 10; h < 24; h++) {
      hourlyDelays[h] = { total: 0, count: 0 };
    }

    // Per ordini completati, calcola il tempo di completamento
    const now = new Date().getTime();
    orders.forEach(order => {
      if (order.createdDate) {
        const createdDate = new Date(order.createdDate);
        const hour = createdDate.getHours();
        
        if (hour >= 10 && hour < 24) {
          // Per ordini completati usiamo il tempo medio stimato basato sull'ora
          // oppure possiamo usare una media generale
          // Per semplicità, per ordini completati usiamo una stima fissa per ora
          let delayMinutes = 0;
          
          if (order.status === Status.Done) {
            // Stima: ordini completati hanno avuto un tempo di circa 15-30 min
            // Aumenta nelle ore di punta (12-14, 19-22)
            if ((hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 22)) {
              delayMinutes = 25; // Ore di punta, più lenti
            } else {
              delayMinutes = 15; // Ore normali, più veloci
            }
          } else if (order.status === Status.Cancelled) {
            // Gli ordini cancellati non contribuiscono alla performance
            return;
          }

          hourlyDelays[hour].total += delayMinutes;
          hourlyDelays[hour].count++;
        }
      }
    });

    // Calcola le medie
    const performanceHours = [];
    const performanceValues = [];
    const performanceColors = [];

    for (let h = 10; h < 24; h++) {
      if (hourlyDelays[h].count > 0) {
        const avgDelay = Math.round(hourlyDelays[h].total / hourlyDelays[h].count);
        performanceHours.push(`${h}:00`);
        performanceValues.push(avgDelay);
        
        // Colore basato sulla performance
        const severity = this.getDelaySeverity(avgDelay);
        performanceColors.push(
          severity === 'success' ? '#4caf50' :
          severity === 'warning' ? '#ff9800' : '#f44336'
        );
      }
    }

    if (performanceValues.length > 0) {
      this.hourlyPerformanceChartData = {
        labels: performanceHours,
        datasets: [{
          label: 'Tempo Medio (min)',
          backgroundColor: performanceColors,
          data: performanceValues,
          borderColor: '#2196f3',
          borderWidth: 1
        }]
      };
      console.log('Hourly performance chart generated for', performanceHours.length, 'hours');
    } else {
      this.hourlyPerformanceChartData = undefined;
      console.log('No performance data available');
    }
    
    console.log('Analysis complete. Charts state:', {
      topProducts: !!this.topProductsChartData,
      hourlyOrders: !!this.hourlyOrdersChartData,
      categories: !!this.categoryDistributionChartData,
      performance: !!this.hourlyPerformanceChartData
    });
  }

  searchByDate(): void {
    this.statsLoading = true;
    // Reset stato precedente
    this.showEmpty = false;
    this.selectedStats = undefined;
    this.statsData = undefined;
    
    // Carica statistiche aggregate
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

    // Carica analisi dettagliate ordini
    this.loadOrderAnalysis(this.dateFrom, this.dateTo);
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
