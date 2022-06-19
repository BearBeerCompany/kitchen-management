import {Plate} from "../../src/app/modules/plates/plate/plate.model";

export {};

declare global {
  namespace fs {
    function fileAdd(config: Plate): Promise<any>;
  }
}
