import {Plate, PlateMenuItemAction} from "../plates/plate.interface";

/**
 * The plate - menu item association
 */
export interface PlateMenuItem {
  id?: string,
  orderNumber: number,
  menuItem: MenuItem,
  plate?: Plate | null,
  status: PlateMenuItemAction,
  date: string | null,
  notes?: string,
  clientName: string,
  tableNumber: number,
  source?: PlateMenuItemSource
}

export interface MenuItem {
  id?: string,
  name?: string,
  description?: string,
  categoryId?: string
}

export interface MenuItemExtended extends MenuItem {
  selected?: boolean,
  quantity: number
}

export interface Category {
  id?: string,
  name: string,
  description?: string,
  color?: string,
  menuItems?: MenuItemExtended[]
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
