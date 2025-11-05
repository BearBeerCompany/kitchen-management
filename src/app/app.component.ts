import {Component, OnDestroy, OnInit} from '@angular/core';
import {PrimeNGConfig} from "primeng/api";
import {WebSocketService} from './services/web-socket-service';
import {ThemeService} from './services/theme.service';

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
      min-height: calc(100vh - 70px);
      padding-bottom: 70px;
      overflow-y: auto;
      background: var(--theme-background);
      transition: background-color 0.3s ease;
    }

    @media (max-width: 992px) {
      .app-container {
        min-height: calc(100vh - 65px);
        padding-bottom: 65px;
      }
    }

    @media (max-width: 768px) {
      .app-container {
        min-height: calc(100vh - 60px);
        padding-bottom: 60px;
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {

  constructor(private _primengConfig: PrimeNGConfig,
              private _webSocketService: WebSocketService,
              private _themeService: ThemeService) {
    this._primengConfig.ripple = true;
    // ThemeService automatically applies saved theme on construction
  }

  public ngOnInit(): void {
    this._webSocketService.connect();
  }

  public ngOnDestroy(): void {
    this._webSocketService.disconnect();
  }
}
