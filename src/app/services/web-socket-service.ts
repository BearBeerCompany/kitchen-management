import {Injectable} from "@angular/core";
import * as Stomp from 'stompjs';
import * as SockJS from 'sockjs-client';
import {environment} from "../../environments/environment";
import {BehaviorSubject} from "rxjs";
import {PKMINotification, PKMINotificationType} from "./pkmi-notification";

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  webSocketEndPoint: string = environment.webSocket.endpoint;
  greetingsTopic: string = environment.webSocket.defaultTopic;
  pkmiTopic: string = environment.webSocket.pkmiTopic;
  stompClient: any;
  interval: any;

  private _pkmiNotifications$: BehaviorSubject<PKMINotification | null> = new BehaviorSubject<PKMINotification | null>(null);

  get pkmiNotifications$() {
    return this._pkmiNotifications$.asObservable();
  }

  connect() {
    console.log("Initialize WebSocket Connection");
    let ws = new SockJS(this.webSocketEndPoint);
    this.stompClient = Stomp.over(ws);
    const _this = this;
    _this.stompClient.connect({}, () => {
      //if (!!this.interval) {
      //  clearInterval(this.interval);
      //}
      _this.stompClient.subscribe(_this.greetingsTopic, (event: any) => {
        _this.onNotificationReceived(event);
      });

      _this.stompClient.subscribe(_this.pkmiTopic, (event: any) => {
        _this.onPKMINotificationReceived(event);
      });
      //_this.stompClient.reconnect_delay = 2000;
    }, (error: any) => {
      this.errorCallback(error);
    });
  };

  disconnect() {
    if (this.stompClient !== null) {
      this.stompClient.disconnect();
    }
    console.log("Disconnected");
  }

  // on error, schedule a reconnection attempt
  errorCallback(error: any) {
    console.log("errorCallBack -> " + error);
    const _this = this;
    this.interval = setTimeout(() => {
      //_this.connect();
      location.reload();
    }, 10000);
  }

  /**
   * Send message to sever via web socket
   * @param {*} message
   */
  send(message: any) {
    console.log("calling logout api via web socket");
    this.stompClient.send("/app/hello", {}, JSON.stringify(message));
  }

  onNotificationReceived(message: any) {
    console.log("Message Received from Server :: " + message);
  }

  onPKMINotificationReceived(message: any) {
    console.log("Message Received from Server :: " + message);
    const notificationBody = JSON.parse(message.body);
    this._pkmiNotifications$.next(notificationBody);
  }

  static getNotificationMsgData(notification: PKMINotification) {
    let summary = '';
    let detail = '';
    let severity = '';
    switch (notification?.type) {
      case PKMINotificationType.PKMI_ADD:
        severity = 'success';
        summary = 'Aggiunto panino';
        detail = 'Aggiunto panino ' + notification?.plateKitchenMenuItem?.menuItem.name + ' per ordine ' + notification?.plateKitchenMenuItem?.orderNumber;
        break;
      case PKMINotificationType.PKMI_ADD_ALL:
        severity = 'success';
        summary = 'Aggiunti panini';
        detail = 'Aggiunti ' + notification?.ids?.length + ' panini';
        break;
      case PKMINotificationType.PKMI_UPDATE:
        severity = 'warn';
        summary = 'Modificato panino';
        detail = 'Modificato panino ' + notification?.plateKitchenMenuItem?.menuItem.name + ' per ordine ' + notification?.plateKitchenMenuItem?.orderNumber;
        break;
      case PKMINotificationType.PKMI_UPDATE_ALL:
        severity = 'warn';
        summary = 'Modificati panini';
        detail = 'Modificati ' + notification?.ids?.length + ' panini';
        break;
      case PKMINotificationType.PKMI_DELETE:
        severity = 'error';
        summary = 'Cancellato panino';
        detail = 'Cancellato panino ' + notification?.plateKitchenMenuItem?.menuItem.name + ' per ordine ' + notification?.plateKitchenMenuItem?.orderNumber;
        break;
      case PKMINotificationType.PKMI_DELETE_ALL:
        severity = 'error';
        summary = 'Cancellati panini';
        detail = 'Cancellati ' + notification?.ids?.length + ' panini';
        break;
    }

    return {severity, summary, detail};
  }

}
