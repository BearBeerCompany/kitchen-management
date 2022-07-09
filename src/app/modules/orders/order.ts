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

export interface Category {
  _id?: string,
  name: string,
  description?: string
}

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
