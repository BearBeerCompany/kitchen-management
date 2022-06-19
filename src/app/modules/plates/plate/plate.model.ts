import {PlateMode} from "../plate-mode";

export interface Plate {
  mode: PlateMode;
  color?: string;
  name?: string;
  slot?: [number, number],
  _severity?: string,
  _status?: string
}
