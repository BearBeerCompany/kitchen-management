import {Plate} from "../plates/plate/plate.model";
import {PlateItemAction} from "../plates/plate.interface";

export interface Order {
  _id?: string,
  orderId: number,
  menuItem: MenuItem,
  plate?: Plate | null,
  status: PlateItemAction,
  date: string | null,
  notes?: string
}

export interface MenuItem {
  _id?: string,
  name?: string,
  description?: string
  category?: Category
}

export interface MenuItemExtended extends MenuItem {
  selected?: boolean,
  quantity: number
}

export interface Category {
  _id?: string,
  name: string,
  description?: string
  menuItems?: MenuItemExtended[]
}

export enum Status {
  Todo = "TODO",
  Progress = "PROGRESS",
  Done = "DONE",
  Cancelled = "CANCELLED"
}
