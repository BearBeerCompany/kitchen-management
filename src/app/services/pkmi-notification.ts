import {PlateMenuItem} from "../modules/plate-menu-items/plate-menu-item";

export interface PKMINotification {
    type: PKMINotificationType;
    ids: Array<string>;
    plateKitchenMenuItem: PlateMenuItem;
}

export enum PKMINotificationType {
    PKMI_ADD = 'PKMI_ADD',
    PKMI_ADD_ALL = 'PKMI_ADD_ALL',
    PKMI_UPDATE = 'PKMI_UPDATE',
    PKMI_UPDATE_ALL = 'PKMI_UPDATE_ALL',
    PKMI_DELETE = 'PKMI_DELETE',
    PKMI_DELETE_ALL = 'PKMI_DELETE_ALL'
}
