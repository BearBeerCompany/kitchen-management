import {Injectable} from '@angular/core';
import {ReactiveQueue} from "../../shared/class/reactive-queue";
import {Plate} from "../plate/plate.model";
import {MenuItem} from "../../orders/order";

@Injectable({
  providedIn: 'root'
})
export class PlateQueueManagerService {

  private _plates: Map<string, ReactiveQueue<MenuItem>> = new Map<string, ReactiveQueue<MenuItem>>();

  constructor() {
  }

  public load(plates: Plate[]) {
    for (const plate of plates) this.addQueue(plate);
  }

  public getQueue(id: string): ReactiveQueue<MenuItem> {
    return this._plates.get(id)!;
  }

  public addQueue(plate: Plate): void {
    this._plates.set(plate._id!, new ReactiveQueue());
  }

  public sendToQueue(id: string, item: MenuItem): void {
    if (!id) {
      console.error("Plate Id is undefined!");
      return;
    }

    const queue: ReactiveQueue<MenuItem> = this.getQueue(id);

    if (!queue) {
      console.error("No queue found!");
      return;
    }

    queue.enqueue(item);
  }
}
