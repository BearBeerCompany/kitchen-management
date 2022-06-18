export interface Order {
    menuItem: MenuItem,
    category: Category,
    orderId: number,
    plate?: Plate,
    status: Status
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

export const ordersMock: Order[] = [
    {
        menuItem: { id: 1, name: 'Panino 1' },
        category: { id: 1, name: 'Hamburgher' },
        orderId: 1,
        status: Status.Todo
    }, {
        menuItem: { id: 1, name: 'Panino 1' },
        category: { id: 1, name: 'Hamburgher' },
        orderId: 2,
        plate: { id: 1, name: 'Piastra 1' },
        status: Status.Progress
    }, {
        menuItem: { id: 2, name: 'Panino 2' },
        category: { id: 1, name: 'Hamburgher' },
        orderId: 3,
        plate: { id: 2, name: 'Piastra 2' },
        status: Status.Progress
    }, {
        menuItem: { id: 3, name: 'Panino 3' },
        category: { id: 1, name: 'Hamburgher' },
        orderId: 4,
        status: Status.Done
    }
];