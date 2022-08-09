import {Order, Status} from "../orders/order";

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

export type PlateItemAction = PlateItemStatus | Status;

export interface ItemEvent {
  plateId: string;
  action: PlateItemAction;
  item: Order;
  nextId?: string;
}

export interface Plate {
  mode?: PlateInterface;
  color?: string;
  name?: string;
  description?: string;
  label?: string;
  slot?: [number, number];
  _severity?: string;
  _status?: string;
}
