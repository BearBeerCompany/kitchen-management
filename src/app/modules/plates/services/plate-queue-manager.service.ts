import {Injectable} from '@angular/core';
import {ReactiveQueue} from "../../shared/class/reactive-queue";
import {Plate, PlateMenuItemAction, PlateItemStatus} from "../plate.interface";
import {BehaviorSubject} from "rxjs";
import {PlateMenuItem, Status} from "../../plate-menu-items/plate-menu-item";
import {PlateService} from "./plate.service";
import {PlateMenuItemsService} from "../../shared/service/plate-menu-items.service";

@Injectable({
  providedIn: 'root'
})
export class PlateQueueManagerService {

  public static readonly UNASSIGNED_QUEUE: string = "UNASSIGNED_QUEUE";

  private _plates: Map<string, ReactiveQueue<PlateMenuItem>> = new Map<string, ReactiveQueue<PlateMenuItem>>();
  private _changes$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor(private _plateService: PlateService,
              private _plateMenuItemsService: PlateMenuItemsService) {
  }

  public load(plates: Plate[]) {
    for (const plate of plates) this.addQueue(plate.id!);
    this.addQueue(PlateQueueManagerService.UNASSIGNED_QUEUE);
  }

  public getQueue(id: string): ReactiveQueue<PlateMenuItem> {
    return this._plates.get(id)!;
  }

  public addQueue(id: string): void {

    if (id === PlateQueueManagerService.UNASSIGNED_QUEUE) {
      this._plates.set(id, new ReactiveQueue());
    } else   //TODO: call api to load plate status
      this._plateService.getStatusById(id!).subscribe(items => {
        if (items?.length > 0)
          this._plates.set(id, new ReactiveQueue(items));
        else
          this._plates.set(id, new ReactiveQueue());
      });
  }

  get notify(): BehaviorSubject<number> {
    return this._changes$;
  }

  get haveNotify(): boolean {
    return this._changes$.value > 0;
  }

  public sendToQueue(id: string, item: PlateMenuItem): void {
    this._validateItem(item);
    item.status = Status.Todo;
    this._getQueue(id).enqueue(item);
    this._changes$.next(this._changes$.value + 1);
    //TODO: call api for save plate status
  }

  public removeFromQueue(id: string, item: PlateMenuItem): void {
    this._validateItem(item);
    const queue: ReactiveQueue<PlateMenuItem> = this._getQueue(id);
    queue.values = queue.values.filter((i: PlateMenuItem) => {
      return i.id != item.id;
    });
    this._changes$.next(this._changes$.value - 1);
    //TODO: call api for save plate status
  }

  public onItemAction(id: string, item: PlateMenuItem, action: PlateMenuItemAction, nextId?: string): void {
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
        item.plate = {
          id
        }
        this._runItemProgress(id, item);
        break;
      default:
        console.warn("[QueueManager] Action not found");
        break;
    }
  }

  private _resetItem(id: string, item: PlateMenuItem) {
    const queue: ReactiveQueue<PlateMenuItem> = this._getQueue(id);
    const foundItem: PlateMenuItem | undefined = queue.values.find(i => item.id === i.id);
    if (foundItem) {
      foundItem.status = Status.Todo
    } else {
      queue.enqueue(item);
    }
    //TODO: call api for save plate status
  }

  private _runItemProgress(id: string, item: PlateMenuItem): void {
    const queue: ReactiveQueue<PlateMenuItem> = this._getQueue(id);
    queue.values.find(i => item.id === i.id)!.status = Status.Progress;

    this._plateMenuItemsService.update(item).subscribe();
  }

  private _validateItem(item: PlateMenuItem): void {
    if (!item || !item.id) {
      throw new Error("Selected item is invalid!");
    }
  }

  private _getQueue(id: string): ReactiveQueue<PlateMenuItem> {
    if (!id) {
      throw new Error("Plate Id is undefined!");
    }

    const queue: ReactiveQueue<PlateMenuItem> = this.getQueue(id);

    if (!queue) {
      throw new Error("No queue found!");
    }

    return queue;
  }
}
