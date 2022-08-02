import {Injectable} from '@angular/core';
import {ReactiveQueue} from "../../shared/class/reactive-queue";
import {Plate} from "../plate/plate.model";
import {PlateItemAction, PlateItemStatus} from "../plate.interface";
import {BehaviorSubject} from "rxjs";
import {Order, Status} from "../../orders/order";
import {PlateIndexDbService} from "../../../services/plate-index-db.service";

@Injectable({
  providedIn: 'root'
})
export class PlateQueueManagerService {

  public static readonly UNASSIGNED_QUEUE: string = "UNASSIGNED_QUEUE";

  private _plates: Map<string, ReactiveQueue<Order>> = new Map<string, ReactiveQueue<Order>>();
  private _changes$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor(private _dbService: PlateIndexDbService) {
  }

  public load(plates: Plate[]) {
    for (const plate of plates) this.addQueue(plate.name!);
    this.addQueue(PlateQueueManagerService.UNASSIGNED_QUEUE);
  }

  public getQueue(name: string): ReactiveQueue<Order> {
    return this._plates.get(name)!;
  }

  public addQueue(name: string): void {
    this._dbService.exist(name).then((result: boolean) => {
      if (!result) {
        this._dbService.insert(name, []);
        this._plates.set(name, new ReactiveQueue());
      } else {
        this._dbService.findByKey(name).then(data => this._plates.set(name, new ReactiveQueue(data)));
      }
    });
  }

  get notify(): BehaviorSubject<number> {
    return this._changes$;
  }

  get haveNotify(): boolean {
    return this._changes$.value > 0;
  }

  public sendToQueue(name: string, item: Order): void {
    this._validateItem(item);
    item.status = Status.Todo;
    this._getQueue(name).enqueue(item);
    this._changes$.next(this._changes$.value + 1);
    this._dbService.insert(name, this._getQueue(name).values).then(_ => this._getQueue(name).refresh());
  }

  public removeFromQueue(name: string, item: Order): void {
    this._validateItem(item);
    const queue: ReactiveQueue<Order> = this._getQueue(name);
    queue.values = queue.values.filter((i: Order) => {
      return i._id != item._id;
    });
    this._changes$.next(this._changes$.value - 1);
    this._dbService.insert(name, queue.values).then(_ => this._getQueue(name).refresh());
  }

  public onItemAction(name: string, item: Order, action: PlateItemAction, nextId?: string): void {
    this._validateItem(item);

    switch (action) {
      case PlateItemStatus.Moved:
        if (!nextId) throw new Error("No queue selected to move the item");
        this.sendToQueue(nextId, item);
        this.onItemAction(name, item, Status.Cancelled);
        break;
      case Status.Todo:
        this._resetItem(name, item);
        break;
      case Status.Cancelled:
      case Status.Done:
        this.removeFromQueue(name, item);
        //TODO: Invoke order service
        break;
      case Status.Progress:
        this._runItemProgress(name, item);
        break;
      default:
        console.warn("[QueueManager] Action not found");
        break;
    }
  }

  private _resetItem(name: string, item: Order) {
    const queue: ReactiveQueue<Order> = this._getQueue(name);
    const foundItem: Order | undefined = queue.values.find(i => item._id === i._id);
    if (foundItem) {
      foundItem.status = Status.Todo
    } else {
      queue.enqueue(item);
    }
    this._dbService.insert(name, queue.values).then(_ => this._getQueue(name).refresh());
  }

  private _runItemProgress(name: string, item: Order): void {
    const queue: ReactiveQueue<Order> = this._getQueue(name);
    queue.values.find(i => item._id === i._id)!.status = Status.Progress;
    this._dbService.insert(name, queue.values).then(_ => this._getQueue(name).refresh());
  }

  private _validateItem(item: Order): void {
    if (!item || !item._id) {
      throw new Error("Selected item is invalid!");
    }
  }

  private _getQueue(name: string): ReactiveQueue<Order> {
    if (!name) {
      throw new Error("Plate Name is undefined!");
    }

    const queue: ReactiveQueue<Order> = this.getQueue(name);

    if (!queue) {
      throw new Error("No queue found!");
    }

    return queue;
  }
}
