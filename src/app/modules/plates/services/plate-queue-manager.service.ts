import {Injectable} from '@angular/core';
import {ReactiveQueue} from "../../shared/class/reactive-queue";
import {Plate, PlateItemStatus, PlateMenuItemAction} from "../plate.interface";
import {BehaviorSubject, forkJoin, Observable, Observer} from "rxjs";
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

  public load(plates: Plate[]): Observable<boolean> {
    return new Observable((observer: Observer<boolean>) => {
      const tasks$ = [];
      for (const plate of plates) {
        tasks$.push(this.addQueue(plate.id!));
      }
      tasks$.push(this.addQueue(PlateQueueManagerService.UNASSIGNED_QUEUE));

      forkJoin(tasks$).subscribe((results) => {
        results.forEach((items, i) => {
          const plateId = (i === results.length - 1) ? PlateQueueManagerService.UNASSIGNED_QUEUE : plates[i].id!;
          this.initQueue(plateId, items);
        })
        observer.next(true);
      });
    });
  }

  public initQueue(id: string, items: PlateMenuItem[]) {
    if (items?.length) {
      items.forEach(item => {
        item.plate = (!item.plate) ? {id} : null;
      });
      this._plates.set(id, new ReactiveQueue(items));
    } else {
      this._plates.set(id, new ReactiveQueue());
    }
  }

  public getQueue(id: string): ReactiveQueue<PlateMenuItem> {
    return this._plates.get(id)!;
  }

  public addQueue(id: string): Observable<PlateMenuItem[]> {
    if (id === PlateQueueManagerService.UNASSIGNED_QUEUE) {
      return this._plateMenuItemsService.getUnassigned();
    } else {
      return this._plateService.getStatusById(id!);
    }
  }

  get notify(): BehaviorSubject<number> {
    return this._changes$;
  }

  get haveNotify(): boolean {
    return this._changes$.value > 0;
  }

  public onItemAction(plateId: string, item: PlateMenuItem, action: PlateMenuItemAction, nextPlateId?: string): void {
    this._validateItem(item);

    item.status = (action != PlateItemStatus.Moved) ? action : Status.Progress;
    item.plate = (plateId) ? {id: plateId} : null;
    if (action === PlateItemStatus.Moved) {
      item.plate = nextPlateId ? {id: nextPlateId} : {id: plateId};
    }
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
