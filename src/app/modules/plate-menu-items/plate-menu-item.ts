import {Plate, PlateMenuItemAction} from "../plates/plate.interface";

/**
 * The plate - menu item association
 */
export interface PlateMenuItem {
  id?: string;
  orderNumber: number;
  menuItem: MenuItem;
  plate?: Plate | null;
  status: PlateMenuItemAction;
  createdDate: string | null;
  notes?: string;
  clientName: string;
  tableNumber: string;
  source?: PlateMenuItemSource;
}

export interface MenuItem {
  id?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  externalId?: number;
  category?: Category;
}

export interface MenuItemExtended extends MenuItem {
  selected?: boolean;
}

export interface Category {
  id?: string;
  name: string;
  description?: string;
  color?: string;
  externalId?: number;
  menuItems?: MenuItemExtended[];
}

export enum Status {
  Todo = "TODO",
  Progress = "PROGRESS",
  Done = "DONE",
  Cancelled = "CANCELLED"
}

export enum PlateMenuItemSource {
  Plates = "PLATES",
  Orders = "ORDERS"
}
