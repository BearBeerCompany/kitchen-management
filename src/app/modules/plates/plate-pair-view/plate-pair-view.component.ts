import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { PlatePair, PlatePairsService } from '../services/plate-pairs.service';
import { Plate, PlateItemStatus } from '../plate.interface';
import { PlateService } from '../services/plate.service';
import { PlateMenuItem, Status } from '../../plate-menu-items/plate-menu-item';
import { PlateQueueManagerService } from '../services/plate-queue-manager.service';
import { WebSocketService } from '../../../services/web-socket-service';
import { PKMINotification } from '../../../services/pkmi-notification';
import { MessageService } from 'primeng/api';
import { ReactiveQueue } from '../../shared/class/reactive-queue';
import { PlateMenuItemsService } from '../../shared/service/plate-menu-items.service';

@Component({
  selector: 'app-plate-pair-view',
  templateUrl: './plate-pair-view.component.html',
  styleUrls: ['./plate-pair-view.component.scss']
})
export class PlatePairViewComponent implements OnInit, OnDestroy {
  public pair: PlatePair | null = null;
  public plate1Config: Plate | null = null;
  public plate2Config: Plate | null = null;
  public queue1: ReactiveQueue<PlateMenuItem> = new ReactiveQueue<PlateMenuItem>();
  public queue2: ReactiveQueue<PlateMenuItem> = new ReactiveQueue<PlateMenuItem>();
  public showItemDelays = true;
  public plateList: Plate[] = [];
  public plateId1?: string;
  public plateId2?: string;

  private _subs = new Subscription();
  private _pairId?: string;
  private _pkmiNotification$: Observable<PKMINotification | null>;

  constructor(
    private _route: ActivatedRoute,
    private _platePairsService: PlatePairsService,
    private _plateService: PlateService,
    public plateQueueManagerService: PlateQueueManagerService,
    private _webSocketService: WebSocketService,
    private _messageService: MessageService,
    private _plateMenuItemsService: PlateMenuItemsService
  ) {
    this._pkmiNotification$ = this._webSocketService.pkmiNotifications$;
  }

  ngOnInit(): void {
    // Check for query params first (direct link with plate IDs)
    const queryPlate1 = this._route.snapshot.queryParams['plate1'];
    const queryPlate2 = this._route.snapshot.queryParams['plate2'];
    
    if (queryPlate1 && queryPlate2) {
      // Direct link mode - load plates directly
      this.plateId1 = queryPlate1;
      this.plateId2 = queryPlate2;
      this._loadPlatesDirectly(queryPlate1, queryPlate2);
    } else {
      // Saved pair mode - load from configuration
      this._pairId = this._route.snapshot.params['id'];
      if (this._pairId) {
        this._loadPair();
      }
    }
    
    this._setupNotifications();
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  private _loadPair(): void {
    const foundPair = this._platePairsService.getPairById(this._pairId!);
    this.pair = foundPair || null;
    
    if (!this.pair) {
      console.error('Pair not found');
      return;
    }

    this._loadPlatesDirectly(this.pair.plateId1, this.pair.plateId2);
  }

  private _loadPlatesDirectly(plateId1: string, plateId2: string): void {
    let plate1Loaded = false;
    let plate2Loaded = false;

    // Load both plates configuration
    this._subs.add(
      this._plateService.getById(plateId1).subscribe(
        (plate: Plate) => {
          this.plate1Config = this._enrichPlateWithQuickMoveSettings(plate);
          plate1Loaded = true;
          if (plate2Loaded) {
            this._loadQueues();
          }
        }
      )
    );

    this._subs.add(
      this._plateService.getById(plateId2).subscribe(
        (plate: Plate) => {
          this.plate2Config = this._enrichPlateWithQuickMoveSettings(plate);
          plate2Loaded = true;
          if (plate1Loaded) {
            this._loadQueues();
          }
        }
      )
    );

    // Load all plates for quick move - arricchisci con quickMove settings
    this._subs.add(
      this._plateService.getAll().subscribe((plates: Plate[]) => {
        this.plateList = plates.filter(p => p.enabled).map(p => this._enrichPlateWithQuickMoveSettings(p));
      })
    );
  }

  private _loadQueues(): void {
    if (this.plate1Config && this.plate2Config) {
      this._subs.add(
        this._plateService.getStatusById(this.plate1Config.id!).subscribe(
          (items: PlateMenuItem[]) => {
            this.queue1.values = items;
            this.queue1.refresh();
          }
        )
      );

      this._subs.add(
        this._plateService.getStatusById(this.plate2Config.id!).subscribe(
          (items: PlateMenuItem[]) => {
            this.queue2.values = items;
            this.queue2.refresh();
          }
        )
      );
    }
  }

  private _setupNotifications(): void {
    this._subs.add(
      this._pkmiNotification$.subscribe((notification: PKMINotification | null) => {
        if (notification) {
          // Notifiche disabilitate nella vista coppia - solo refresh delle code
          
          // Refresh both queues
          if (this.plate1Config) {
            this._plateService.getStatusById(this.plate1Config.id!).subscribe(
              (items: PlateMenuItem[]) => {
                this.queue1.values = items;
                this.queue1.refresh();
              }
            );
          }

          if (this.plate2Config) {
            this._plateService.getStatusById(this.plate2Config.id!).subscribe(
              (items: PlateMenuItem[]) => {
                this.queue2.values = items;
                this.queue2.refresh();
              }
            );
          }
        }
      })
    );
  }

  public handleItemEvent(event: any): void {
    console.log('Item event:', event);
    
    // Validate item
    if (!event.item || !event.item.id) {
      console.error('Invalid item in event');
      return;
    }

    // Update item status and plate
    const item = event.item;
    item.status = (event.action !== PlateItemStatus.Moved) ? event.action : Status.Progress;
    item.plate = event.nextId ? { id: event.nextId } : (event.plateId ? { id: event.plateId } : null);

    // Send update to server
    this._plateMenuItemsService.update(item).subscribe({
      next: () => {
        console.log('Item updated successfully');
        // Refresh both queues to reflect changes
        this._loadQueues();
      },
      error: (err) => {
        console.error('Error updating item:', err);
        this._messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile aggiornare l\'elemento',
          life: 3000
        });
      }
    });
  }

  public getEnabledPlateList(excludePlate: Plate | null): Plate[] {
    if (!excludePlate) {
      return this.plateList;
    }
    return this.plateList.filter(p => p.id !== excludePlate.id);
  }

  private _enrichPlateWithQuickMoveSettings(plate: Plate): Plate {
    if (!plate.id) return plate;
    
    const savedQuickMove = localStorage.getItem(`plate_quickMove_${plate.id}`);
    const savedExpandedDoneButton = localStorage.getItem(`plate_expandedDoneButton_${plate.id}`);
    
    let enrichedPlate = { ...plate };
    
    if (savedQuickMove) {
      try {
        const settings = JSON.parse(savedQuickMove);
        enrichedPlate = {
          ...enrichedPlate,
          quickMoveEnabled: settings.enabled,
          quickMoveTargetPlateId: settings.targetPlateId
        };
      } catch (e) {
        // Ignora errori di parsing
      }
    }
    
    if (savedExpandedDoneButton) {
      try {
        const settings = JSON.parse(savedExpandedDoneButton);
        enrichedPlate = {
          ...enrichedPlate,
          expandedDoneButtonEnabled: settings.enabled
        };
      } catch (e) {
        // Ignora errori di parsing
      }
    }
    
    return enrichedPlate;
  }

  public onPlateViewModeChange(viewMode: 'rows' | 'columns', plate: Plate): void {
    if (plate.id) {
      localStorage.setItem(`plate_viewMode_${plate.id}`, viewMode);
    }
  }
}
