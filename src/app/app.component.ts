import {Component} from '@angular/core';
import {PrimeNGConfig} from "primeng/api";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  active: boolean = false;

  constructor(private _primengConfig: PrimeNGConfig) {
    this._primengConfig.ripple = true;
  }

  toggleActive() {
    this.active = !this.active;
  }
}
