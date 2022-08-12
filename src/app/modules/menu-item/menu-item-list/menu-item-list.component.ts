import {Component, Input, OnInit} from '@angular/core';
import {Observable, of} from "rxjs";
import {MenuItem} from "../../plate-menu-items/plate-menu-item";

@Component({
  selector: 'menu-item-list',
  templateUrl: './menu-item-list.component.html',
  styleUrls: ['./menu-item-list.component.scss']
})
export class MenuItemListComponent implements OnInit {

  @Input() public items$: Observable<MenuItem[]> = of([]);
  @Input() public categoryName?: string;

  constructor() {
  }

  ngOnInit(): void {
  }

}
