import {Injectable} from '@angular/core';
import {I18N as i18nIta} from "../../assets/i18n-ita";

@Injectable({
  providedIn: 'root'
})
export class I18nService {

  private readonly _i18n?: any;

  constructor() {
    const lang: string = navigator.language;

    if (lang === "it-IT") {
      this._i18n = i18nIta;
    } else {
      console.warn("English not supported");
      this._i18n = i18nIta;
    }
  }

  public get instance(): any {
    return this._i18n;
  }
}
