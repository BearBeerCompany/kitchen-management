import {Injectable} from '@angular/core';
import {ReactiveQueue} from "../../shared/class/reactive-queue";
import {Plate, PlateMenuItemAction, PlateItemStatus} from "../plate.interface";
import {BehaviorSubject} from "rxjs";
import {PlateMenuItem, Status} from "../../plate-menu-items/plate-menu-item";
import {PlateIndexDbService} from "../../../services/plate-index-db.service";

@Injectable({
  providedIn: 'root'
})
export class PlateQueueManagerService {

  public static readonly UNASSIGNED_QUEUE: string = "UNASSIGNED_QUEUE";

  private _plates: Map<string, ReactiveQueue<PlateMenuItem>> = new Map<string, ReactiveQueue<PlateMenuItem>>();
  private _changes$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor(private _dbService: PlateIndexDbService) {
  }

  public load(plates: Plate[]) {
    for (const plate of plates) this.addQueue(plate.name!);
    this.addQueue(PlateQueueManagerService.UNASSIGNED_QUEUE);
  }

  public getQueue(name: string): ReactiveQueue<PlateMenuItem> {
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

  public sendToQueue(name: string, item: PlateMenuItem): void {
    this._validateItem(item);
    item.status = Status.Todo;
    this._getQueue(name).enqueue(item);
    this._changes$.next(this._changes$.value + 1);
    this._dbService.insert(name, this._getQueue(name).values).then(_ => this._getQueue(name).refresh());
  }

  public removeFromQueue(name: string, item: PlateMenuItem): void {
    this._validateItem(item);
    const queue: ReactiveQueue<PlateMenuItem> = this._getQueue(name);
    queue.values = queue.values.filter((i: PlateMenuItem) => {
      return i.id != item.id;
    });
    this._changes$.next(this._changes$.value - 1);
    this._dbService.insert(name, queue.values).then(_ => this._getQueue(name).refresh());
  }

  public onItemAction(name: string, item: PlateMenuItem, action: PlateMenuItemAction, nextId?: string): void {
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
        //TODO: Invoke order services
        break;
      case Status.Progress:
        this._runItemProgress(name, item);
        break;
      default:
        console.warn("[QueueManager] Action not found");
        break;
    }
  }

  private _resetItem(name: string, item: PlateMenuItem) {
    const queue: ReactiveQueue<PlateMenuItem> = this._getQueue(name);
    const foundItem: PlateMenuItem | undefined = queue.values.find(i => item.id === i.id);
    if (foundItem) {
      foundItem.status = Status.Todo
    } else {
      queue.enqueue(item);
    }
    this._dbService.insert(name, queue.values).then(_ => this._getQueue(name).refresh());
  }

  private _runItemProgress(name: string, item: PlateMenuItem): void {
    const queue: ReactiveQueue<PlateMenuItem> = this._getQueue(name);
    queue.values.find(i => item.id === i.id)!.status = Status.Progress;
    this._dbService.insert(name, queue.values).then(_ => this._getQueue(name).refresh());
  }

  private _validateItem(item: PlateMenuItem): void {
    if (!item || !item.id) {
      throw new Error("Selected item is invalid!");
    }
  }

  private _getQueue(name: string): ReactiveQueue<PlateMenuItem> {
    if (!name) {
      throw new Error("Plate Name is undefined!");
    }

    const queue: ReactiveQueue<PlateMenuItem> = this.getQueue(name);

    if (!queue) {
      throw new Error("No queue found!");
    }

    return queue;
  }
}
