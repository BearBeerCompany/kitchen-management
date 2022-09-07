import {Component, OnDestroy, OnInit} from '@angular/core';
import {PrimeNGConfig} from "primeng/api";
import {WebSocketService} from './services/web-socket-service';

@Component({
  selector: 'app-root',
  template: `
    <div id="app-container-id" class="app-container">
      <router-outlet></router-outlet>
    </div>
    <navbar id="navbar-id"></navbar>
  `,
  styles: [`
    .app-container {
      height: 90vh;

      overflow-y: auto;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {

  constructor(private _primengConfig: PrimeNGConfig,
              private _webSocketService: WebSocketService) {
    this._primengConfig.ripple = true;
  }

  public ngOnInit(): void {
    this._webSocketService.connect();
  }

  public ngOnDestroy(): void {
    this._webSocketService.disconnect();
  }
}
