export interface PKMINotification {
    type: PKMINotificationType;
    ids: Array<string>;
    plateKitchenMenuItem: PlateKitchenMenuItem;
}

export interface PlateKitchenMenuItem {
    id: string;
    plateId?: string;
    menuItemId: string;
    status: ItemStatus;
    orderNumber: number;
    tableNumber: number;
    clientName: string;
    notes: string;
}

export enum PKMINotificationType {
    PKMI_ADD,
    PKMI_ADD_ALL,
    PKMI_UPDATE,
    PKMI_UPDATE_ALL,
    PKMI_DELETE,
    PKMI_DELETE_ALL
}

export enum ItemStatus {
    TODO, PROGRESS, DONE, CANCELLED
}