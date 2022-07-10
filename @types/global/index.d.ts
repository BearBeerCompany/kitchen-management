import {Plate} from "../../src/app/modules/plates/plate/plate.model";
import {Order, MenuItem} from "../../src/app/modules/orders/order";

export {};

declare global {
  namespace fs {
    function addPlate(config: Plate): Promise<any>;

    function updatePlate(config: Plate): Promise<any>;

    function readPlates(): Promise<Plate[]>;

    function readPlate(id: string): Promise<Plate>;

    function deletePlate(id: string): Promise<Plate>;

    function addOrder(order: Order): Promise<any>;

    function addOrders(orders: Order[]): Promise<any>;

    function updateOrder(order: Order): Promise<Order>;

    function readOrders(): Promise<Order[]>;

    function readOrder(id: string): Promise<Order>;

    function deleteOrder(id: string): Promise<boolean>;

    function deleteOrders(ids: string[]): Promise<boolean>;

    function readMenuItems(): Promise<MenuItem[]>;
  }

  namespace app {
    function openNewTab(parent: string, id: string): void;
  }
}
