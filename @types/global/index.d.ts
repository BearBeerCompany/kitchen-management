import {Plate} from "../../src/app/modules/plates/plate/plate.model";

export {};

declare global {
  namespace fs {
    function addPlate(config: Plate): Promise<any>;

    function updatePlate(config: Plate): Promise<any>;

    function readPlates(): Promise<Plate[]>;

    function readPlate(id: string): Promise<Plate>;

    function deletePlate(id: string): Promise<Plate>;
  }

  namespace app {
    function openNewTab(parent: string, id: string): void;
  }
}
