import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MenuItem} from "../../plate-menu-items/plate-menu-item";

@Component({
  selector: 'menu-item-list',
  templateUrl: './menu-item-list.component.html',
  styleUrls: ['./menu-item-list.component.scss']
})
export class MenuItemListComponent {

  @Input() public items: MenuItem[] = [];
  @Input() public categoryName?: string;

  @Output() public edit: EventEmitter<MenuItem> = new EventEmitter<MenuItem>(false);
  @Output() public delete: EventEmitter<MenuItem> = new EventEmitter<MenuItem>(false);

  public editing: boolean = false;

  private selectedItem?: MenuItem;

  public onRowEditInit(item: MenuItem) {
    this.selectedItem = {...item};
    this.editing = true;
  }

  public onRowEditSave(item: MenuItem): void {
    if (JSON.stringify(item) !== JSON.stringify(this.selectedItem))
      this.edit.emit(item);
    this.editing = false;
  }

  public onRowEditCancel(item: MenuItem, index: number): void {
    this.items[index] = this.selectedItem!;
    this.editing = false;
  }
}
