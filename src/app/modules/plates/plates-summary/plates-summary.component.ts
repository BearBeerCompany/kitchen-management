import {Component, OnDestroy, OnInit} from '@angular/core';
import {PlateService} from '../services/plate.service';
import {PlateQueueManagerService} from '../services/plate-queue-manager.service';
import {Plate} from '../plate.interface';
import {PlateMenuItem, Status, Category} from '../../plate-menu-items/plate-menu-item';
import {Subscription} from 'rxjs';
import {I18nService} from '../../../services/i18n.service';
import {DelayThresholdsService} from '../../../services/delay-thresholds.service';
import {StatsService} from '../../shared/service/stats.service';
import {Stats, StatsChart} from '../../shared/interface/stats.interface';
import {MessageService} from 'primeng/api';
import {PlateMenuItemsService} from '../../shared/service/plate-menu-items.service';
import {CategoryService} from '../../plate-menu-items/services/category.service';
import {ThemeService} from '../../../services/theme.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registra il plugin datalabels globalmente
Chart.register(ChartDataLabels);

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
  public hourlyChartOptions: any; // Opzioni specifiche per grafico orario
  public doughnutChartOptions: any; // Opzioni specifiche per grafici a torta
  public stackedBarChartOptions: any; // Opzioni per grafici a barre impilate
  public horizontalBarChartOptions: any; // Opzioni per grafici a barre orizzontali

  // Nuove analisi basate su ordini storici
  public topProductsChartData: any;
  public hourlyOrdersChartData: any;
  public categoryDistributionChartData: any;
  public hourlyPerformanceChartData: any;
  public takeAwayDistributionChartData: any; // Nuovo: Asporto vs Tavolo
  public categoryByServiceChartData: any; // Nuovo: Categorie per Tipo Servizio
  public topStationsChartData: any; // Nuovo: Top Stazioni di Lavoro
  public takeAwayCount: number = 0;
  public dineInCount: number = 0;
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

  // Auto-refresh settings
  public autoRefreshEnabled: boolean = false;
  public autoRefreshInterval: number = 30000; // default 30 secondi
  public refreshIntervalOptions = [
    { label: '10 secondi', value: 10000 },
    { label: '30 secondi', value: 30000 },
    { label: '1 minuto', value: 60000 },
    { label: '2 minuti', value: 120000 },
    { label: '5 minuti', value: 300000 }
  ];

  private _updateInterval: any;
  private _autoRefreshInterval: any;
  private _subscriptions: Subscription = new Subscription();
  private readonly AUTO_REFRESH_STORAGE_KEY = 'summary_auto_refresh_settings';
  private _categoriesMap: Map<string, Category> = new Map();

  constructor(
    private _plateService: PlateService,
    private _plateQueueManager: PlateQueueManagerService,
    private _i18nService: I18nService,
    private _delayThresholdsService: DelayThresholdsService,
    private _statsService: StatsService,
    private _messageService: MessageService,
    private _plateMenuItemsService: PlateMenuItemsService,
    private _categoryService: CategoryService,
    private _themeService: ThemeService
  ) {
    this.i18n = _i18nService.instance;
    
    // Load auto-refresh settings from localStorage
    this._loadAutoRefreshSettings();
    
    // Initialize chart options based on current theme
    this._initChartOptions();
    
    // Subscribe to theme changes
    this._subscriptions.add(
      this._themeService.currentTheme$.subscribe(() => {
        this._initChartOptions();
        // Reload chart data to apply new theme colors
        if (this.platesStats.length > 0) {
          this.generatePlateCharts();
        }
      })
    );
  }

  ngOnInit(): void {
    // Carica le categorie per il grafico di distribuzione
    this._categoryService.getAll().subscribe(categories => {
      this._categoriesMap.clear();
      categories.forEach(cat => {
        if (cat.id) {
          this._categoriesMap.set(cat.id, cat);
        }
      });
      console.log('Categories loaded:', this._categoriesMap.size, 'categories');
    });
    
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
    
    // Avvia auto-refresh se abilitato
    if (this.autoRefreshEnabled) {
      this._startAutoRefresh();
    }
  }

  ngOnDestroy(): void {
    this._stopAutoRefresh();
    this._subscriptions.unsubscribe();
  }

  private _initChartOptions(): void {
    const isDark = this._themeService.getCurrentTheme() === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#1f2937';
    const gridColor = isDark ? 'rgba(226, 232, 240, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const tooltipBg = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(0, 0, 0, 0.8)';
    
    this.chartOptions = {
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            },
            color: textColor
          }
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: textColor,
          font: {
            weight: 'bold',
            size: 11
          },
          formatter: (value: any) => {
            return value;
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
            },
            color: textColor
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          ticks: {
            font: {
              size: 11
            },
            color: textColor
          },
          grid: {
            display: false
          }
        }
      }
    };

    // Opzioni specifiche per il grafico orario con padding ridotto
    this.hourlyChartOptions = {
      ...this.chartOptions,
      layout: {
        padding: {
          left: 0,
          right: 0,
          top: 10,
          bottom: 0
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 11
            },
            color: textColor,
            padding: 5
          },
          grid: {
            color: gridColor,
            drawBorder: true
          }
        },
        x: {
          ticks: {
            font: {
              size: 11
            },
            color: textColor,
            padding: 5,
            maxRotation: 0,
            minRotation: 0
          },
          grid: {
            display: false,
            drawBorder: true
          }
        }
      }
    };

    // Opzioni specifiche per grafici doughnut/pie (senza assi)
    this.doughnutChartOptions = {
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            },
            color: textColor
          }
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          }
        },
        datalabels: {
          color: '#ffffff',
          font: {
            weight: 'bold',
            size: 12
          },
          formatter: (value: any, context: any) => {
            // Calcola la percentuale
            const dataset = context.chart.data.datasets[0];
            const total = dataset.data.reduce((acc: number, val: number) => acc + val, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${value}\n(${percentage}%)`;
          },
          textAlign: 'center'
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };

    // Configurazione per grafici a barre impilate con etichette
    this.stackedBarChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true, 
          position: 'top',
          labels: {
            color: textColor
          }
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: '#ffffff',
          bodyColor: '#ffffff'
        },
        datalabels: {
          color: '#ffffff',
          font: {
            weight: 'bold',
            size: 10
          },
          formatter: (value: any) => {
            return value > 0 ? value : '';
          }
        }
      },
      scales: {
        x: { 
          stacked: true,
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        },
        y: { 
          stacked: true, 
          beginAtZero: true,
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        }
      }
    };

    // Configurazione per grafici a barre orizzontali con etichette
    this.horizontalBarChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: '#ffffff',
          bodyColor: '#ffffff'
        },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: textColor,
          font: {
            weight: 'bold',
            size: 11
          },
          formatter: (value: any) => {
            return value;
          }
        }
      },
      scales: {
        x: { 
          beginAtZero: true,
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        },
        y: {
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        }
      }
    };
  }

  loadData(): void {
    this.loading = true;
    
    this._plateService.getAll().subscribe(plates => {
      this.platesStats = [];
      let totalDelays: number[] = [];
      
      const enabledPlates = plates.filter(p => p.id && p.enabled);
      
      // Ricarica sempre le code per avere dati aggiornati
      this._plateQueueManager.load(plates).subscribe(() => {
        this.processPlatesData(enabledPlates, totalDelays);
      });
    });
  }

  private processPlatesData(plates: Plate[], totalDelays: number[]): void {
    // Svuota gli array prima di ripopolarli
    this.platesStats = [];
    totalDelays.length = 0;
    
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

  onAutoRefreshChange(): void {
    this._saveAutoRefreshSettings();
    
    if (this.autoRefreshEnabled) {
      this._startAutoRefresh();
      this._messageService.add({
        severity: 'success',
        summary: 'Auto-refresh Attivato',
        detail: `Aggiornamento automatico ogni ${this.autoRefreshInterval / 1000} secondi`,
        life: 3000
      });
    } else {
      this._stopAutoRefresh();
      this._messageService.add({
        severity: 'info',
        summary: 'Auto-refresh Disattivato',
        detail: 'Aggiornamento automatico disabilitato',
        life: 3000
      });
    }
  }

  onIntervalChange(): void {
    this._saveAutoRefreshSettings();
    
    if (this.autoRefreshEnabled) {
      this._stopAutoRefresh();
      this._startAutoRefresh();
      this._messageService.add({
        severity: 'info',
        summary: 'Intervallo Aggiornato',
        detail: `Aggiornamento ogni ${this.autoRefreshInterval / 1000} secondi`,
        life: 3000
      });
    }
  }

  private _startAutoRefresh(): void {
    this._stopAutoRefresh();
    this._autoRefreshInterval = setInterval(() => {
      this.loadData();
    }, this.autoRefreshInterval);
  }

  private _stopAutoRefresh(): void {
    if (this._autoRefreshInterval) {
      clearInterval(this._autoRefreshInterval);
      this._autoRefreshInterval = null;
    }
  }

  private _loadAutoRefreshSettings(): void {
    const savedSettings = localStorage.getItem(this.AUTO_REFRESH_STORAGE_KEY);
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        this.autoRefreshEnabled = settings.enabled || false;
        this.autoRefreshInterval = settings.interval || 30000;
      } catch (e) {
        console.error('Error loading auto-refresh settings:', e);
      }
    }
  }

  private _saveAutoRefreshSettings(): void {
    const settings = {
      enabled: this.autoRefreshEnabled,
      interval: this.autoRefreshInterval
    };
    localStorage.setItem(this.AUTO_REFRESH_STORAGE_KEY, JSON.stringify(settings));
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
      this.takeAwayDistributionChartData = undefined;
      this.categoryByServiceChartData = undefined;
      this.topStationsChartData = undefined;
      this.statsData = undefined; // Reset anche il grafico stati ordini
      this.selectedStats = undefined; // Reset il conteggio totale
      this.showEmpty = true; // Mostra messaggio "nessun ordine"
      this.cancellationRate = 0;
      this.completedOrdersCount = 0;
      this.cancelledOrdersCount = 0;
      this.takeAwayCount = 0;
      this.dineInCount = 0;
      return;
    }

    this.showEmpty = false;

    // 1. Distribuzione Stati Ordini (per date range selezionato)
    const todoCount = orders.filter(o => o.status === Status.Todo).length;
    const progressCount = orders.filter(o => o.status === Status.Progress).length;
    const doneCount = orders.filter(o => o.status === Status.Done).length;
    const cancelledCount = orders.filter(o => o.status === Status.Cancelled).length;

    // Aggiorna il conteggio totale per il badge "Ordini Totali"
    this.selectedStats = {
      count: orders.length,
      statusCount: {
        [Status.Todo]: todoCount,
        [Status.Progress]: progressCount,
        [Status.Done]: doneCount,
        [Status.Cancelled]: cancelledCount
      }
    } as Stats;

    this.statsData = {
      labels: ['Attesa', 'In Corso', 'Completati', 'Cancellati'],
      datasets: [
        {
          data: [todoCount, progressCount, doneCount, cancelledCount],
          backgroundColor: ['#0d91e8', '#f6dd38', '#5ff104', '#f31919']
        }
      ]
    };
    console.log('Stats distribution:', { todo: todoCount, progress: progressCount, done: doneCount, cancelled: cancelledCount });

    // 2. Tasso di cancellazione
    this.completedOrdersCount = orders.filter(o => o.status === Status.Done).length;
    this.cancelledOrdersCount = orders.filter(o => o.status === Status.Cancelled).length;
    this.cancellationRate = orders.length > 0 
      ? Math.round((this.cancelledOrdersCount / orders.length) * 100) 
      : 0;
    
    console.log('Cancellation rate:', this.cancellationRate, '%');

    // 3. Top prodotti più ordinati
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

    // 5. Distribuzione per categoria
    const categoryCount = new Map<string, number>();
    orders.forEach((order, index) => {
      // Usa categoryId per trovare la categoria dalla mappa
      const categoryId = order.menuItem?.categoryId;
      const category = categoryId ? this._categoriesMap.get(categoryId) : undefined;
      const categoryName = category?.name || 'Senza Categoria';
      categoryCount.set(categoryName, (categoryCount.get(categoryName) || 0) + 1);
      
      // Log primi 3 ordini per debug
      if (index < 3) {
        console.log('Sample order category (using categoryId):', {
          menuItem: order.menuItem?.name,
          categoryId: categoryId,
          categoryName: categoryName,
          categoryFound: !!category
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
    
    // 7. Distribuzione Asporto vs Tavolo
    this.takeAwayCount = 0;
    this.dineInCount = 0;
    
    orders.forEach(order => {
      // Considera null come dine-in (consumazione al tavolo)
      if (order.takeAway === true) {
        this.takeAwayCount++;
      } else {
        this.dineInCount++;
      }
    });

    if (this.takeAwayCount > 0 || this.dineInCount > 0) {
      this.takeAwayDistributionChartData = {
        labels: ['Asporto', 'Al Tavolo'],
        datasets: [{
          data: [this.takeAwayCount, this.dineInCount],
          backgroundColor: ['#ff9800', '#2196f3']
        }]
      };
      console.log('Take-away distribution:', {
        takeAway: this.takeAwayCount,
        dineIn: this.dineInCount,
        total: this.takeAwayCount + this.dineInCount
      });
    } else {
      this.takeAwayDistributionChartData = undefined;
    }

    // 8. Categorie per Tipo Servizio (Stacked)
    const categoryServiceMap = new Map<string, { takeAway: number; dineIn: number }>();
    
    orders.forEach(order => {
      const categoryId = order.menuItem?.categoryId;
      const category = categoryId ? this._categoriesMap.get(categoryId) : undefined;
      const categoryName = category?.name || 'Senza Categoria';
      
      if (!categoryServiceMap.has(categoryName)) {
        categoryServiceMap.set(categoryName, { takeAway: 0, dineIn: 0 });
      }
      
      const stats = categoryServiceMap.get(categoryName)!;
      if (order.takeAway === true) {
        stats.takeAway++;
      } else {
        stats.dineIn++;
      }
    });

    if (categoryServiceMap.size > 0) {
      const categoryNames = Array.from(categoryServiceMap.keys());
      const takeAwayData = categoryNames.map(cat => categoryServiceMap.get(cat)!.takeAway);
      const dineInData = categoryNames.map(cat => categoryServiceMap.get(cat)!.dineIn);

      this.categoryByServiceChartData = {
        labels: categoryNames,
        datasets: [
          {
            label: 'Asporto',
            backgroundColor: '#ff9800',
            data: takeAwayData
          },
          {
            label: 'Al Tavolo',
            backgroundColor: '#2196f3',
            data: dineInData
          }
        ]
      };
      console.log('Category by service chart generated:', categoryNames.length, 'categories');
    } else {
      this.categoryByServiceChartData = undefined;
    }

    // 9. Top Stazioni di Lavoro
    const stationCount = new Map<string, number>();
    
    orders.forEach(order => {
      const stationName = order.plate?.name || 'Sconosciuta';
      stationCount.set(stationName, (stationCount.get(stationName) || 0) + 1);
    });

    if (stationCount.size > 0) {
      // Ordina per numero di ordini e prendi top 10
      const sortedStations = Array.from(stationCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const stationColors = sortedStations.map(([_, count], index) => {
        // Usa i colori delle stazioni se disponibili, altrimenti colori default
        const colorPalette = ['#2196f3', '#ff9800', '#4caf50', '#f44336', '#9c27b0', 
                              '#00bcd4', '#ffeb3b', '#795548', '#607d8b', '#e91e63'];
        return colorPalette[index % colorPalette.length];
      });

      this.topStationsChartData = {
        labels: sortedStations.map(s => s[0]),
        datasets: [{
          label: 'Numero Ordini',
          backgroundColor: stationColors,
          data: sortedStations.map(s => s[1])
        }]
      };
      console.log('Top stations chart generated:', sortedStations.length, 'stations');
    } else {
      this.topStationsChartData = undefined;
    }
    
    console.log('Analysis complete. Charts state:', {
      topProducts: !!this.topProductsChartData,
      hourlyOrders: !!this.hourlyOrdersChartData,
      categories: !!this.categoryDistributionChartData,
      performance: !!this.hourlyPerformanceChartData,
      takeAwayDistribution: !!this.takeAwayDistributionChartData,
      categoryByService: !!this.categoryByServiceChartData,
      topStations: !!this.topStationsChartData
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
          
          // Carica anche le analisi ordini avanzate per lo stesso periodo
          this.loadOrderAnalysis(this.dateFrom, this.dateTo);
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

  public async exportToPDF(): Promise<void> {
    try {
      this._messageService.add({
        severity: 'info',
        summary: this.i18n.SUMMARY.EXPORT_PDF,
        detail: this.i18n.SUMMARY.EXPORT_PDF_LOADING,
        life: 3000
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const now = new Date();

      // ========== PAGINA 1: COPERTINA ==========
      let yPosition = 40;

      // Logo (se disponibile)
      try {
        const logoImg = new Image();
        logoImg.src = 'assets/img/logo_feston.png';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          setTimeout(reject, 2000); // Timeout dopo 2 secondi
        });
        
        const logoWidth = 60;
        const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
        
        pdf.addImage(logoImg, 'PNG', (pageWidth - logoWidth) / 2, yPosition, logoWidth, logoHeight);
        yPosition += logoHeight + 20;
      } catch (e) {
        console.log('Logo non disponibile, skip');
        yPosition += 10;
      }

      // Titolo principale
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 150, 243); // Blu
      pdf.text('Analisi Ordini per Periodo', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Sottotitolo
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Report Dettagliato della Cucina', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 25;

      // Box periodo
      pdf.setDrawColor(33, 150, 243);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin + 10, yPosition, pageWidth - 2 * margin - 20, 25, 3, 3);
      
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Periodo Analizzato:', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 7;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      const periodText = `${this.dateFrom.toLocaleDateString('it-IT')} - ${this.dateTo.toLocaleDateString('it-IT')}`;
      pdf.text(periodText, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // KPI Summary
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 150, 243);
      pdf.text('Riepilogo KPI', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      
      const totalOrders = this.takeAwayCount + this.dineInCount;
      const kpiData = [
        { label: 'Ordini Totali', value: totalOrders.toString(), icon: '' },
        { label: 'Tasso Cancellazione', value: `${this.cancellationRate}%`, icon: '' },
        { label: 'Ordini Completati', value: this.completedOrdersCount.toString(), icon: '' },
        { label: 'Ordini Asporto', value: `${this.takeAwayCount} (${totalOrders > 0 ? ((this.takeAwayCount / totalOrders) * 100).toFixed(1) : 0}%)`, icon: '' },
        { label: 'Ordini Al Tavolo', value: `${this.dineInCount} (${totalOrders > 0 ? ((this.dineInCount / totalOrders) * 100).toFixed(1) : 0}%)`, icon: '' }
      ];

      const kpiBoxWidth = (pageWidth - 2 * margin - 10) / 2;
      const kpiBoxHeight = 18;
      let kpiX = margin;
      let kpiY = yPosition;

      kpiData.forEach((kpi, index) => {
        if (index % 2 === 0 && index > 0) {
          kpiY += kpiBoxHeight + 5;
          kpiX = margin;
        }

        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(kpiX, kpiY, kpiBoxWidth, kpiBoxHeight, 2, 2, 'F');
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(33, 150, 243);
        pdf.text(`${kpi.icon} ${kpi.label}`, kpiX + 3, kpiY + 7);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text(kpi.value, kpiX + 3, kpiY + 14);

        kpiX += kpiBoxWidth + 5;
      });

      yPosition = kpiY + kpiBoxHeight + 20;

      // Footer copertina
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generato il: ${now.toLocaleDateString('it-IT')} alle ${now.toLocaleTimeString('it-IT')}`, pageWidth / 2, pageHeight - 15, { align: 'center' });

      // ========== PAGINE SUCCESSIVE: GRAFICI ==========
      // Seleziona tutti i grafici individuali
      const chartSelectors = [
        { selector: '#topProductsChart', title: 'Top 10 Prodotti Più Ordinati' },
        { selector: '#hourlyOrdersChart', title: 'Distribuzione Ordini per Ora' },
        { selector: '#performanceChart', title: 'Performance Temporale' },
        { selector: '#categoryChart', title: 'Distribuzione per Categoria' },
        { selector: '#takeAwayChart', title: 'Asporto vs Al Tavolo' },
        { selector: '#categoryServiceChart', title: 'Categorie per Tipo Servizio' },
        { selector: '#topStationsChart', title: 'Top 10 Stazioni di Lavoro' }
      ];

      let chartsPerPage = 0;
      const maxChartsPerPage = 3;

      for (const chart of chartSelectors) {
        const chartElement = document.querySelector(`${chart.selector} .chart-content`) as HTMLElement;
        
        if (!chartElement || chartElement.offsetHeight === 0) {
          console.log(`Grafico ${chart.title} non trovato o vuoto, skip`);
          continue;
        }

        // Nuova pagina dopo ogni 3 grafici
        if (chartsPerPage === 0 || chartsPerPage >= maxChartsPerPage) {
          pdf.addPage();
          yPosition = margin;
          chartsPerPage = 0;
        }

        // Titolo grafico
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(33, 150, 243);
        pdf.text(chart.title, margin, yPosition);
        yPosition += 8;

        // Cattura il grafico con qualità ottimizzata
        const canvas = await html2canvas(chartElement, {
          scale: 1.5, // Aumentato per migliore qualità
          logging: false,
          useCORS: true,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92); // JPEG con qualità 92%
        const imgWidth = pageWidth - (2 * margin);
        const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 110); // Max 110mm per grafico
        
        pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
        chartsPerPage++;
      }

      // Footer con numerazione pagine
      const totalPages = (pdf as any).internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(150, 150, 150);
        
        if (i > 1) { // Skip footer sulla copertina
          pdf.text(
            `Pagina ${i - 1} di ${totalPages - 1}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        }
      }

      // Salva il PDF
      const fileName = `analisi-ordini-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.pdf`;
      pdf.save(fileName);

      this._messageService.add({
        severity: 'success',
        summary: this.i18n.SUMMARY.EXPORT_PDF,
        detail: this.i18n.SUMMARY.EXPORT_PDF_SUCCESS,
        life: 3000
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      this._messageService.add({
        severity: 'error',
        summary: this.i18n.SUMMARY.EXPORT_PDF,
        detail: this.i18n.SUMMARY.EXPORT_PDF_ERROR,
        life: 5000
      });
    }
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
