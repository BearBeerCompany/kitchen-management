import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'app-theme';
  private currentThemeSubject: BehaviorSubject<Theme>;
  public currentTheme$: Observable<Theme>;

  constructor() {
    // Check localStorage or system preference
    const savedTheme = this.getSavedTheme();
    this.currentThemeSubject = new BehaviorSubject<Theme>(savedTheme);
    this.currentTheme$ = this.currentThemeSubject.asObservable();
    
    // Apply theme immediately
    this.applyTheme(savedTheme);
  }

  /**
   * Get current theme
   */
  public getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  /**
   * Set theme
   */
  public setTheme(theme: Theme): void {
    this.currentThemeSubject.next(theme);
    this.applyTheme(theme);
    this.saveTheme(theme);
  }

  /**
   * Toggle between light and dark
   */
  public toggleTheme(): void {
    const newTheme = this.getCurrentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Get saved theme from localStorage or detect system preference
   */
  private getSavedTheme(): Theme {
    // Check localStorage first
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }

    // Fallback to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Save theme to localStorage
   */
  private saveTheme(theme: Theme): void {
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    const body = document.body;
    
    // Remove both classes first
    body.classList.remove('light-theme', 'dark-theme');
    
    // Add the new theme class
    body.classList.add(`${theme}-theme`);
    
    // Also set data attribute for CSS specificity
    body.setAttribute('data-theme', theme);
  }
}
