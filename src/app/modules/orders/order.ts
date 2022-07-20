export interface Order {
  _id?: string,
  orderId: number,
  menuItem: MenuItem,
  plate?: Plate | null,
  status: Status,
  date: string | null,
  notes?: string
}

export interface MenuItem {
  _id?: string,
  name: string,
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

// TODO: Replace with the original interface Plate in plate/plate.model
export interface Plate {
  _id?: string,
  name: string,
  description?: string
}

export enum Status {
  Todo = "todo",
  Progress = "progress",
  Done = "done",
  Cancelled = "cancelled"
}
