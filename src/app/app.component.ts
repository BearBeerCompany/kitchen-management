import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {PrimeNGConfig} from "primeng/api";
import {PlateQueueManagerService} from "./modules/plates/services/plate-queue-manager.service";
import {ApiConnector} from "./services/api-connector";
import {Subscription} from "rxjs";
import { WebSocketService } from './services/web-socket-service';
import {Plate} from "./modules/plates/plate.interface";
import {PlateService} from "./modules/plates/services/plate.service";

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
              private _plateQueueManagerService: PlateQueueManagerService,
              private _plateService: PlateService,
              private _webSocketService: WebSocketService) {
    this._primengConfig.ripple = true;
  }

  public ngOnInit(): void {
    this._bootstrap$.add(this._plateService.getAll()
      .subscribe((plates: Plate[]) => {
        this._plateQueueManagerService.load(plates);
        this._webSocketService.connect();
      })
    );
  }

  public ngOnDestroy(): void {
    this._bootstrap$.unsubscribe();
    this._webSocketService.disconnect();
  }
}
