import {Injectable} from '@angular/core';
import {I18N as i18nIta} from "../../assets/i18n-ita";
import {I18N_ENG as i18nEng} from "../../assets/i18n-eng";
import {BehaviorSubject, Observable} from 'rxjs';

export type SupportedLanguage = 'it' | 'en';

@Injectable()
export class I18nService {

  private readonly STORAGE_KEY = 'app-language';
  private _i18n: any;
  private _currentLanguage$ = new BehaviorSubject<SupportedLanguage>('it');

  constructor() {
    const storedLang = this._loadLanguageFromStorage();
    const browserLang = this._getBrowserLanguage();
    const initialLang = storedLang || browserLang;
    
    this.setLanguage(initialLang);
  }

  public get instance(): any {
    return this._i18n;
  }

  public get currentLanguage$(): Observable<SupportedLanguage> {
    return this._currentLanguage$.asObservable();
  }

  public get currentLanguage(): SupportedLanguage {
    return this._currentLanguage$.value;
  }

  public setLanguage(lang: SupportedLanguage): void {
    this._currentLanguage$.next(lang);
    
    if (lang === 'en') {
      this._i18n = i18nEng;
    } else {
      this._i18n = i18nIta;
    }
    
    this._saveLanguageToStorage(lang);
  }

  public getAvailableLanguages(): Array<{code: SupportedLanguage, label: string, flag: string}> {
    return [
      { code: 'it', label: 'Italiano', flag: '🇮🇹' },
      { code: 'en', label: 'English', flag: '🇬🇧' }
    ];
  }

  private _getBrowserLanguage(): SupportedLanguage {
    const lang = navigator.language.toLowerCase();
    
    if (lang.startsWith('it')) {
      return 'it';
    } else if (lang.startsWith('en')) {
      return 'en';
    }
    
    return 'it'; // Default
  }

  private _loadLanguageFromStorage(): SupportedLanguage | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === 'it' || stored === 'en') {
        return stored;
      }
    } catch (e) {
      console.warn('Failed to load language from localStorage', e);
    }
    return null;
  }

  private _saveLanguageToStorage(lang: SupportedLanguage): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Failed to save language to localStorage', e);
    }
  }
}
