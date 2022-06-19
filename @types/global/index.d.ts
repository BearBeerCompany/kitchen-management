import {Plate} from "../../src/app/modules/plates/plate/plate.model";

export {};

declare global {
  namespace fs {
    function plateAdd(config: Plate): Promise<any>;

    function readPlates(): Promise<Plate[]>;
  }
}
