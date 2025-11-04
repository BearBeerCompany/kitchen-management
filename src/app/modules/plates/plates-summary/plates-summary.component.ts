import {Component, OnDestroy, OnInit} from '@angular/core';
import {PlateService} from '../services/plate.service';
import {PlateQueueManagerService} from '../services/plate-queue-manager.service';
import {Plate} from '../plate.interface';
import {PlateMenuItem, Status} from '../../plate-menu-items/plate-menu-item';
import {Subscription} from 'rxjs';
import {I18nService} from '../../../services/i18n.service';

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

  private _updateInterval: any;
  private _subscriptions: Subscription = new Subscription();

  constructor(
    private _plateService: PlateService,
    private _plateQueueManager: PlateQueueManagerService,
    private _i18nService: I18nService
  ) {
    this.i18n = _i18nService.instance;
  }

  ngOnInit(): void {
    this.loadData();
    
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
      
      plates.forEach(plate => {
        if (plate.id && plate.enabled) {
          const queue = this._plateQueueManager.getQueue(plate.id);
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
      
      this.loading = false;
    });
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
          return delayMinutes > 20;
        }).length, 0)
    };
  }

  getDelaySeverity(minutes: number): 'success' | 'warning' | 'danger' {
    if (minutes < 10) return 'success';
    if (minutes < 20) return 'warning';
    return 'danger';
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
}
