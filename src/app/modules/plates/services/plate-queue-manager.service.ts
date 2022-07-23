import {Injectable} from '@angular/core';
import {ReactiveQueue} from "../../shared/class/reactive-queue";
import {Plate} from "../plate/plate.model";
import {MenuItem, Status} from "../../orders/order";
import {PlateItemAction, PlateItemStatus} from "../plate.interface";
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PlateQueueManagerService {

  private _plates: Map<string, ReactiveQueue<MenuItem>> = new Map<string, ReactiveQueue<MenuItem>>();
  private _changes$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

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

  get notify(): BehaviorSubject<number> {
    return this._changes$;
  }

  get haveNotify(): boolean {
    return this._changes$.value > 0;
  }

  public sendToQueue(id: string, item: MenuItem): void {
    this._validateItem(item);
    item.status = Status.Todo;
    this._getQueue(id).enqueue(item);
    this._changes$.next(this._changes$.value + 1);
    this._getQueue(id).refresh();
  }

  public removeFromQueue(id: string, item: MenuItem): void {
    this._validateItem(item);
    const queue: ReactiveQueue<MenuItem> = this._getQueue(id);
    queue.values = queue.values.filter((i: MenuItem) => {
      return i._id != item._id;
    });
    this._changes$.next(this._changes$.value - 1);
  }

  public onItemAction(id: string, item: MenuItem, action: PlateItemAction, nextId?: string): void {
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

  private _resetItem(plateId: string, item: MenuItem) {
    const queue: ReactiveQueue<MenuItem> = this._getQueue(plateId);
    queue.values.find(i => item._id === i._id)!.status = Status.Todo;
    queue.refresh();
  }

  private _runItemProgress(plateId: string, item: MenuItem): void {
    const queue: ReactiveQueue<MenuItem> = this._getQueue(plateId);
    queue.values.find(i => item._id === i._id)!.status = Status.Progress;
    queue.refresh();
  }

  private _validateItem(item: MenuItem): void {
    if (!item || !item._id) {
      throw new Error("Selected item is invalid!");
    }
  }

  private _getQueue(id: string): ReactiveQueue<MenuItem> {
    if (!id) {
      throw new Error("Plate Id is undefined!");
    }

    const queue: ReactiveQueue<MenuItem> = this.getQueue(id);

    if (!queue) {
      throw new Error("No queue found!");
    }

    return queue;
  }
}
