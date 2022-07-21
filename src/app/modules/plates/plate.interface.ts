import {MenuItem, Status} from "../orders/order";

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
  ReQueued = "RE_QUEUED"
}

export type PlateItemAction = PlateItemStatus | Status;

export interface ItemEvent {
  action: PlateItemAction;
  item: MenuItem;
  nextId?: string;
}
