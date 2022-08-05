import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {PrimeNGConfig} from "primeng/api";
import {PlateQueueManagerService} from "./modules/plates/services/plate-queue-manager.service";
import {ApiConnector} from "./services/api-connector";
import {Plate} from "./modules/plates/plate/plate.model";
import {Subscription} from "rxjs";
import { WebSocketAPI } from './services/web-socket-api';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <router-outlet></router-outlet>
    </div>
    <navbar id="navbar-id"></navbar>
  `,
  styles: [`
    .app-container {
      height: 90vh;
      max-height: 90vh;

      overflow-y: auto;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {

  private _bootstrap$: Subscription = new Subscription();

  constructor(private _primengConfig: PrimeNGConfig,
              @Inject('ApiConnector') private _apiConnector: ApiConnector,
              private _plateQueueManagerService: PlateQueueManagerService,
              private _webSocketAPI: WebSocketAPI) {
    this._primengConfig.ripple = true;
  }

  public ngOnInit(): void {
    this._bootstrap$.add(this._apiConnector.getPlates()
      .subscribe((plates: Plate[]) => {
        this._plateQueueManagerService.load(plates);
        this._webSocketAPI.connect();
      })
    );
  }

  public ngOnDestroy(): void {
    this._bootstrap$.unsubscribe();
  }
}
