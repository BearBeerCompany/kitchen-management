import {PlateInterface} from "../plate.interface";

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
