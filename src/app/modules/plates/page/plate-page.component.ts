import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {config, Observable, Subscription} from "rxjs";
import {Plate} from "../plate.interface";
import {PlateService} from "../services/plate.service";
import {PlateMenuItem} from "../../plate-menu-items/plate-menu-item";
import {ReactiveQueue} from "../../shared/class/reactive-queue";
import {PKMINotification, PKMINotificationType} from "../../../services/pkmi-notification";
import {WebSocketService} from "../../../services/web-socket-service";
import {MessageService} from "primeng/api";
import {PlateQueueManagerService} from "../services/plate-queue-manager.service";

@Component({
  selector: 'page',
  template: `
    <p-toast></p-toast>
    <div class="page-container">
      <plate [config]="config" [queue]="queue"></plate>
    </div>
  `,
  styles: [`
    .page-container {
      // reset default height with full page mode component
      height: 100vh !important;
      max-height: 100vh !important;

      padding: 3%;

      overflow-y: hidden;
    }
  `]
})
export class PlatePageComponent implements OnInit, OnDestroy {

  public config!: Plate;
  public queue: ReactiveQueue<PlateMenuItem> = new ReactiveQueue<PlateMenuItem>();

  private _subs: Subscription = new Subscription();
  private _id?: string;
  private _pkmiNotification$: Observable<PKMINotification | null>;

  constructor(private _route: ActivatedRoute,
              private _plateService: PlateService,
              private _plateQueueManagerService: PlateQueueManagerService,
              private _webSocketService: WebSocketService,
              private _messageService: MessageService) {
    this._pkmiNotification$ = this._webSocketService.pkmiNotifications$;
  }

  public ngOnInit(): void {
    this._subs.add(this._route.params.subscribe(
      params => {
        this._id = params["id"];
      }
    ));

    this._subs.add(this._plateService.getById(this._id!)
      .subscribe((plate: Plate) => {
        this.config = plate;
        this._plateService.getStatusById(this._id!).subscribe({
          next: (items: PlateMenuItem[]) => {
            this.queue.values = items;
            this.queue.refresh()
          }
        })
      })
    );

    this._subs.add(
      this._pkmiNotification$.subscribe((notification: PKMINotification | null) => {
        console.log('plate page notification: ' + notification?.type);
        if (notification) {
          const msgData = WebSocketService.getNotificationMsgData(notification);
          this._messageService.add({
            severity: msgData.severity,
            summary: msgData.summary,
            detail: msgData.detail,
            life: 3000
          });

          switch (notification.type) {
            case PKMINotificationType.PKMI_ADD:
            case PKMINotificationType.PKMI_ADD_ALL:
              this._refreshPlateQueue();
              break;
            case PKMINotificationType.PKMI_UPDATE:
              this._refreshPlateQueue();
              break;
            case PKMINotificationType.PKMI_UPDATE_ALL:
              // todo
              break;
            case PKMINotificationType.PKMI_DELETE:
              // todo
              break;
            case PKMINotificationType.PKMI_DELETE_ALL:
              // todo
              break;
          }
        }
      })
    );
  }

  public ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  private _refreshPlateQueue() {
    this._subs.add(
      this._plateService.getById(this.config.id!).subscribe(plate => {
        this.config = { ...config, ...plate};
        // refresh plate queue
        this._plateService.getStatusById(this.config.id!).subscribe(items => {
          // let queue = this._plateQueueManagerService.getQueue(this.config.id!);
          this.queue.values = items;
          this.queue.refresh();
        })
      })
    );
  }

}
