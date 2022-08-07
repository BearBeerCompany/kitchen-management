import { Injectable } from "@angular/core";
import * as Stomp from 'stompjs';
import * as SockJS from 'sockjs-client';
import { environment } from "../../environments/environment";
import { BehaviorSubject } from "rxjs";
import { PKMINotification } from "./pkmi-notification";

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    webSocketEndPoint: string = environment.webSocket.endpoint;
    greetingsTopic: string = environment.webSocket.defaultTopic;
    pkmiTopic: string = environment.webSocket.pkmiTopic;
    stompClient: any;
    
    private _pkmiNotifications$: BehaviorSubject<PKMINotification | null> = new BehaviorSubject<PKMINotification | null>(null);

    get pkmiNotifications() {
        return this._pkmiNotifications$.asObservable();
    }

    connect() {
        console.log("Initialize WebSocket Connection");
        let ws = new SockJS(this.webSocketEndPoint);
        this.stompClient = Stomp.over(ws);
        const _this = this;
        _this.stompClient.connect({}, () => {
            _this.stompClient.subscribe(_this.greetingsTopic, (event: any) => {
                _this.onNotificationReceived(event);
            });

            _this.stompClient.subscribe(_this.pkmiTopic, (event: any) => {
                _this.onPKMINotificationReceived(event);
            });
            //_this.stompClient.reconnect_delay = 2000;
        }, this.errorCallback);
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
        setTimeout(() => {
            _this.connect();
        }, 5000);
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
        console.log("Message Recieved from Server :: " + message);
    }

    onPKMINotificationReceived(message: any) {
        console.log("Message Recieved from Server :: " + message);
        const notificationBody = JSON.parse(message.body);
        this._pkmiNotifications$.next(notificationBody);
    }

}