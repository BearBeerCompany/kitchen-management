import {Component, OnInit} from '@angular/core';
import { WebSocketService } from 'src/app/services/web-socket-service';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(private _webSocketService: WebSocketService) {
  }

  ngOnInit(): void {
  }

  send() {
    // fixme: websocket try, remove
    this._webSocketService.send("FFFFFFFFFFFOCKET!");
  }

}
