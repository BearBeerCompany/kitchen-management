import { Injectable } from "@angular/core";
import * as Stomp from 'stompjs';
import * as SockJS from 'sockjs-client';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    webSocketEndPoint: string = 'http://localhost:8080/ws';
    topic: string = "/topic/greetings";
    stompClient: any;

    connect() {
        console.log("Initialize WebSocket Connection");
        let ws = new SockJS(this.webSocketEndPoint);
        this.stompClient = Stomp.over(ws);
        const _this = this;
        _this.stompClient.connect({}, () => {
            _this.stompClient.subscribe(_this.topic, (sdkEvent: any) => {
                _this.onMessageReceived(sdkEvent);
            });
            //_this.stompClient.reconnect_delay = 2000;
        }, this.errorCallBack);
    };

    disconnect() {
        if (this.stompClient !== null) {
            this.stompClient.disconnect();
        }
        console.log("Disconnected");
    }

    // on error, schedule a reconnection attempt
    errorCallBack(error: any) {
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

    onMessageReceived(message: any) {
        console.log("Message Recieved from Server :: " + message);
    }

}