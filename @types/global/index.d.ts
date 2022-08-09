import {PlateMenuItem, MenuItem} from "../../src/app/modules/plate-menu-items/plate-menu-item";
import {Plate} from "../../src/app/modules/plates/plate.interface";

export {};

declare global {
  namespace fs {
    function addPlate(config: Plate): Promise<any>;

    function updatePlate(config: Plate): Promise<any>;

    function readPlates(): Promise<Plate[]>;

    function readPlate(id: string): Promise<Plate>;

    function deletePlate(id: string): Promise<Plate>;

    function addOrder(order: PlateMenuItem): Promise<any>;

    function addOrders(orders: PlateMenuItem[]): Promise<any>;

    function updateOrder(order: PlateMenuItem): Promise<PlateMenuItem>;

    function readOrders(): Promise<PlateMenuItem[]>;

    function readOrder(id: string): Promise<PlateMenuItem>;

    function deleteOrder(id: string): Promise<boolean>;

    function deleteOrders(ids: string[]): Promise<boolean>;

    function readMenuItems(): Promise<MenuItem[]>;
  }

  namespace app {
    function openNewTab(parent: string, id: string): void;
  }
}
