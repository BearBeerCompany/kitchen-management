import {Injectable} from '@angular/core';
import {ReactiveQueue} from "../../shared/class/reactive-queue";
import {Plate} from "../plate/plate.model";
import {PlateItemAction, PlateItemStatus} from "../plate.interface";
import {BehaviorSubject} from "rxjs";
import {Order, Status} from "../../orders/order";

@Injectable({
  providedIn: 'root'
})
export class PlateQueueManagerService {

  public static readonly UNASSIGNED_QUEUE: string = "UNASSIGNED_QUEUE";

  private _plates: Map<string, ReactiveQueue<Order>> = new Map<string, ReactiveQueue<Order>>();
  private _changes$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor() {
  }

  public load(plates: Plate[]) {
    for (const plate of plates) this.addQueue(plate);
    this._plates.set(PlateQueueManagerService.UNASSIGNED_QUEUE, new ReactiveQueue());
  }

  public getQueue(id: string): ReactiveQueue<Order> {
    return this._plates.get(id)!;
  }

  public addQueue(plate: Plate): void {
    this._plates.set(plate._id!, new ReactiveQueue());
  }

  get notify(): BehaviorSubject<number> {
    return this._changes$;
  }

  get haveNotify(): boolean {
    return this._changes$.value > 0;
  }

  public sendToQueue(id: string, item: Order): void {
    this._validateItem(item);
    item.status = Status.Todo;
    this._getQueue(id).enqueue(item);
    this._changes$.next(this._changes$.value + 1);
    this._getQueue(id).refresh();
  }

  public removeFromQueue(id: string, item: Order): void {
    this._validateItem(item);
    const queue: ReactiveQueue<Order> = this._getQueue(id);
    queue.values = queue.values.filter((i: Order) => {
      return i._id != item._id;
    });
    this._changes$.next(this._changes$.value - 1);
    queue.refresh();
  }

  public onItemAction(id: string, item: Order, action: PlateItemAction, nextId?: string): void {
    this._validateItem(item);

    switch (action) {
      case PlateItemStatus.Moved:
        if (!nextId) throw new Error("No queue selected to move the item");
        this.sendToQueue(nextId, item);
        this.onItemAction(id, item, Status.Cancelled);
        break;
      case Status.Todo:
        this._resetItem(id, item);
        break;
      case Status.Cancelled:
      case Status.Done:
        this.removeFromQueue(id, item);
        //TODO: Invoke order service
        break;
      case Status.Progress:
        this._runItemProgress(id, item);
        break;
      default:
        console.warn("[QueueManager] Action not found");
        break;
    }
  }

  private _resetItem(plateId: string, item: Order) {
    const queue: ReactiveQueue<Order> = this._getQueue(plateId);
    const foundItem: Order | undefined = queue.values.find(i => item._id === i._id);
    if (foundItem) {
      foundItem.status = Status.Todo
    } else {
      queue.enqueue(item);
    }
    queue.refresh();
  }

  private _runItemProgress(plateId: string, item: Order): void {
    const queue: ReactiveQueue<Order> = this._getQueue(plateId);
    queue.values.find(i => item._id === i._id)!.status = Status.Progress;
    queue.refresh();
  }

  private _validateItem(item: Order): void {
    if (!item || !item._id) {
      throw new Error("Selected item is invalid!");
    }
  }

  private _getQueue(id: string): ReactiveQueue<Order> {
    if (!id) {
      throw new Error("Plate Id is undefined!");
    }

    const queue: ReactiveQueue<Order> = this.getQueue(id);

    if (!queue) {
      throw new Error("No queue found!");
    }

    return queue;
  }
}
