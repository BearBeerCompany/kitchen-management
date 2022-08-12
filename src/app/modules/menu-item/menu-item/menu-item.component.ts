import {Component, OnInit} from '@angular/core';
import { WebSocketService } from 'src/app/services/web-socket-service';

@Component({
  selector: 'menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss']
})
export class MenuItemComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }

}
