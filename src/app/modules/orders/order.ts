export interface Order {
  _id: number,
  orderId: number,
  menuItem: MenuItem,
  category: Category,
  plate?: Plate,
  status: Status,
  date: string
}

export interface MenuItem {
  id: number,
  name: string,
  description?: string
}

export interface Category {
  id: number,
  name: string,
  description?: string
}

export interface Plate {
  id: number,
  name: string,
  description?: string
}

export enum Status {
  Todo = "todo",
  Progress = "progress",
  Done = "done",
  Cancelled = "cancelled"
}
