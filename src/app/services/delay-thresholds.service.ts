import { Injectable } from '@angular/core';

export interface DelayThresholds {
  warning: number;  // Soglia gialla (minuti)
  danger: number;   // Soglia rossa (minuti)
}

@Injectable({
  providedIn: 'root'
})
export class DelayThresholdsService {
  private readonly STORAGE_KEY = 'delay_thresholds';
  private readonly DEFAULT_THRESHOLDS: DelayThresholds = {
    warning: 10,
    danger: 20
  };

  private _thresholds: DelayThresholds;

  constructor() {
    this._thresholds = this._loadFromStorage();
  }

  getThresholds(): DelayThresholds {
    return { ...this._thresholds };
  }

  setThresholds(thresholds: DelayThresholds): void {
    this._thresholds = { ...thresholds };
    this._saveToStorage();
  }

  getSeverity(delayMinutes: number): 'success' | 'warning' | 'danger' {
    if (delayMinutes < this._thresholds.warning) {
      return 'success';
    } else if (delayMinutes < this._thresholds.danger) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  private _loadFromStorage(): DelayThresholds {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing delay thresholds from localStorage', e);
      }
    }
    return { ...this.DEFAULT_THRESHOLDS };
  }

  private _saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._thresholds));
  }

  resetToDefaults(): void {
    this._thresholds = { ...this.DEFAULT_THRESHOLDS };
    this._saveToStorage();
  }
}
