import {PlateMenuItem, Status} from "../plate-menu-items/plate-menu-item";

export enum PlateInterface {
  Skeleton = "skeleton",
  On = "on",
  Off = "off",
  Form = "form"
}

export function mode(): typeof PlateInterface {
  return PlateInterface;
}

export enum PlateItemStatus {
  Moved = "MOVED",
}

export type PlateMenuItemAction = PlateItemStatus | Status;

export interface ItemEvent {
  plateId: string;
  action: PlateMenuItemAction;
  item: PlateMenuItem;
  nextId?: string;
}

export interface Plate {
  id?: string;
  enabled?: boolean;
  mode?: PlateInterface;
  color?: string;
  name?: string;
  description?: string;
  label?: string;
  slot?: [number, number];
  viewMode?: 'rows' | 'columns';
  _severity?: string;
  _status?: string;
  quickMoveEnabled?: boolean;
  quickMoveTargetPlateId?: string;
  categories?: string[];
}
