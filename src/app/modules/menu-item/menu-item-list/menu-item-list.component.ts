import {Component, EventEmitter, Input, Output, OnChanges, SimpleChanges} from '@angular/core';
import {MenuItem} from "../../plate-menu-items/plate-menu-item";
import {I18nService} from "../../../services/i18n.service";

@Component({
  selector: 'menu-item-list',
  templateUrl: './menu-item-list.component.html',
  styleUrls: ['./menu-item-list.component.scss']
})
export class MenuItemListComponent implements OnChanges {

  @Input() public items: MenuItem[] = [];
  @Input() public categoryName?: string;
  @Input() public categoryColor?: string;

  @Output() public edit: EventEmitter<MenuItem> = new EventEmitter<MenuItem>(false);
  @Output() public delete: EventEmitter<MenuItem> = new EventEmitter<MenuItem>(false);

  public searchText: string = '';
  public filteredItems: MenuItem[] = [];
  public readonly i18n: any;

  private _editableMenuItemMap: Map<string, MenuItem> = new Map<string, MenuItem>();

  constructor(public i18nService: I18nService) {
    this.i18n = i18nService.instance;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.filteredItems = [...this.items];
    }
  }

  public onSearch(): void {
    const search = this.searchText.toLowerCase().trim();
    if (!search) {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(item => 
        item.name?.toLowerCase().includes(search) || 
        item.description?.toLowerCase().includes(search)
      );
    }
  }

  public isEditing(item: MenuItem): boolean {
    return this._editableMenuItemMap.has(item.id!);
  }

  public onRowEditInit(item: MenuItem): void {
    this._editableMenuItemMap.set(item.id!, {...item});
  }

  public onRowEditSave(item: MenuItem): void {
    if (JSON.stringify(item) !== JSON.stringify(this._editableMenuItemMap.get(item.id!))) {
      this._editableMenuItemMap.delete(item.id!);
      this.edit.emit(item);
    } else {
      this._editableMenuItemMap.delete(item.id!);
    }
  }

  public onRowEditCancel(item: MenuItem, index: number): void {
    const originalItem = this._editableMenuItemMap.get(item.id!);
    if (originalItem) {
      Object.assign(this.items[index], originalItem);
      this._editableMenuItemMap.delete(item.id!);
    }
  }

  public onDelete(item: MenuItem): void {
    this.delete.emit(item);
  }
}
