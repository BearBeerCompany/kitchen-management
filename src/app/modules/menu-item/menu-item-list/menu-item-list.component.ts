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

  private _editableMenuItemMap: Map<string, MenuItem> = new Map<string, MenuItem>();

  public onRowEditInit(item: MenuItem) {
    this._editableMenuItemMap.set(item.id!, {...item});
  }

  public onRowEditSave(item: MenuItem): void {
    if (JSON.stringify(item) !== JSON.stringify(this._editableMenuItemMap.get(item.id!))) {
      this._editableMenuItemMap.delete(item.id!);
      this.edit.emit(item);
    }
  }

  public onRowEditCancel(item: MenuItem, index: number): void {
    this.items[index] = this._editableMenuItemMap.get(item.id!)!;
    this._editableMenuItemMap.delete(item.id!);
  }
}
