import {PlateMode} from "../plate-mode";

export interface Plate {
  _id?: string;
  mode: PlateMode;
  color?: string;
  name?: string;
  slot?: [number, number],
  _severity?: string,
  _status?: string
}
