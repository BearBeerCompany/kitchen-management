import {Component} from '@angular/core';
import {PrimeNGConfig} from "primeng/api";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';
  value: number = 23;

  constructor(private _primengConfig: PrimeNGConfig) {
    this._primengConfig.ripple = true;
  }
}
