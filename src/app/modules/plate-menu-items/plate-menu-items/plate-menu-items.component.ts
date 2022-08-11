import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {I18nService} from 'src/app/services/i18n.service';
import {PlateMenuItemsService} from '../services/plate-menu-items.service';
import {Table} from 'primeng/table';
import {Category, MenuItem, PlateMenuItem, Status} from '../plate-menu-item';
import {Observable, Subscription} from 'rxjs';
import {Router} from "@angular/router";
import {ConfirmationService, MessageService, TreeNode} from "primeng/api";
import {MenuItemsService} from "../services/menu-items.service";
import {DatePipe} from "@angular/common";
import {PlateQueueManagerService} from "../../plates/services/plate-queue-manager.service";
import {WebSocketService} from 'src/app/services/web-socket-service';
import {PKMINotification, PKMINotificationType} from 'src/app/services/pkmi-notification';
import {Plate} from "../../plates/plate.interface";
import {PlateService} from "../../plates/services/plate.service";
import {CategoryService} from "../services/category.service";

@Component({
  selector: 'orders',
  templateUrl: './plate-menu-items.component.html',
  styleUrls: ['./plate-menu-items.component.scss']
})
export class PlateMenuItemsComponent implements OnInit, OnDestroy {

  private _pkmisSub: Subscription = new Subscription();
  private _menuItemsSub: Subscription = new Subscription();
  private _platesSub: Subscription = new Subscription();
  private _categoriesSub: Subscription = new Subscription();
  private _pkmiNotificationSub: Subscription = new Subscription();
  private _clonedPkmis: PlateMenuItem[] = [];

  public readonly i18n: any;
  plateMenuItems: PlateMenuItem[] = [];
  pkmiRows: any[] = [];
  selectedPlateMenuItems: PlateMenuItem[] = [];
  loading: boolean = true;
  statuses: any[] = [];
  currentPlateMenuItem: any;
  submitted = false;
  pkmiDialog = false;
  menuItems: MenuItem[] = [];
  plates: Plate[] = [];
  categories: Category[] = [];
  menuItemOptions: TreeNode[] = [];
  platesOptions: any[] = [];

  pkmiNotification$: Observable<PKMINotification | null>;

  @ViewChild('dt') table: Table | undefined;

  constructor(private _i18nService: I18nService,
              private _menuItemsService: MenuItemsService,
              private _router: Router,
              private _messageService: MessageService,
              private _confirmationService: ConfirmationService,
              private _datePipe: DatePipe,
              private _plateQueueManagerService: PlateQueueManagerService,
              private _webSocketService: WebSocketService,
              private _plateMenuItemsService: PlateMenuItemsService,
              private _plateService: PlateService,
              private _categoryService: CategoryService) {

    this.i18n = _i18nService.instance;
    this.statuses = [
      {label: 'Todo', value: Status.Todo, icon: 'pi-stop-circle', color: 'grey'},
      {label: 'Progress', value: Status.Progress, icon: 'pi-spinner', color: 'blue'},
      {label: 'Done', value: Status.Done, icon: 'pi-check', color: 'green'},
      {label: 'Cancelled', value: Status.Cancelled, icon: 'pi-times', color: 'red'}
    ];
    this.pkmiNotification$ = this._webSocketService.pkmiNotifications;
  }

  ngOnInit(): void {
    this._categoriesSub = this._categoryService.getAll().subscribe(data => {
      this.categories = data;

      this._menuItemsSub = this._menuItemsService.getAll().subscribe(data => {
        this.menuItems = data;
        this.menuItemOptions = PlateMenuItemsService.getCategoryMenuItemTreeNodeOptions(this.categories, data);

        this._loadPlateMenuItems();
        this.loading = false;
      });
    });

    this._platesSub = this._plateService.getAll().subscribe((data: Plate[]) => {
      this.plates = data;
      this.platesOptions = [{
        code: null,
        name: '',
        label: '',
        value: null,
        color: 'transparent'
      }];
      this.platesOptions.push(...data.map(item => {
        return {
          code: item.name,
          label: item.name,
          value: item.name,
          color: item.color
        };
      }));
    });

    this._pkmiNotificationSub = this.pkmiNotification$.subscribe((notification: PKMINotification | null) => {
      console.log('order page notification: ' + notification?.type);
      if (notification) {
        const msgData = this._getNotificationMsgData(notification);
        this._messageService.add({ severity: msgData.severity, summary: msgData.summary, detail: msgData.detail, life: 3000 });

        switch (notification.type) {
          case PKMINotificationType.PKMI_ADD:
          case PKMINotificationType.PKMI_ADD_ALL:
            this.loading = true;
            this._loadPlateMenuItems();
            this.loading = false;

            break;
          case PKMINotificationType.PKMI_UPDATE:
          case PKMINotificationType.PKMI_UPDATE_ALL:
            // todo
            break;
          case PKMINotificationType.PKMI_DELETE:
          case PKMINotificationType.PKMI_DELETE_ALL:
            // todo
            break;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this._pkmisSub.unsubscribe();
    this._menuItemsSub.unsubscribe();
    this._platesSub.unsubscribe();
    this._categoriesSub.unsubscribe();
    this._pkmiNotificationSub.unsubscribe();
  }

  addPlateMenuItems() {
    this._router.navigate(['/plate-menu-items/new']);
  }

  viewCompletedPlateMenuItems() {
    // todo show the list of completed associations
  }

  filterGlobal(event: any) {
    if (this.table) {
      this.table.filterGlobal(event.target.value, 'contains');
    }
  }

  openNew() {
    this.currentPlateMenuItem = {};
    this.submitted = false;
    this.pkmiDialog = true;
  }

  deleteSelectedPkmis() {
    this._confirmationService.confirm({
      message: 'Are you sure you want to delete the selected plate menu items?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const ids = this.selectedPlateMenuItems.map(item => item.id!);
        this._plateMenuItemsService.deleteAll(ids).subscribe((data) => {
          this.plateMenuItems = this.plateMenuItems.filter(val => !this.selectedPlateMenuItems.includes(val));
          this.pkmiRows = this.pkmiRows.filter(val => !this.selectedPlateMenuItems.includes(val));
          this.selectedPlateMenuItems = [];
        })
      }
    });
  }

  hideDialog() {
    this.pkmiDialog = false;
    this.submitted = false;
  }

  onRowEditInit(pkmi: any) {
    this._clonedPkmis[pkmi.id] = {...pkmi};
  }

  onRowEditSave(pkmiRow: any) {
    let plateMenuItem = this.plateMenuItems.find(item => item.id === pkmiRow.id);

    if (plateMenuItem) {
      const previousPlate = plateMenuItem.plate;
      const menuItem: MenuItem = {
        ...pkmiRow.menuItem.data,
        categoryId: pkmiRow.menuItem.parent.data.id
      };
      const plate = this.plates.find(item => item.name === pkmiRow.plate) as Plate;

      plateMenuItem = {
        ...plateMenuItem,
        orderNumber: pkmiRow.orderNumber,
        tableNumber: pkmiRow.tableNumber,
        clientName: pkmiRow.clientName,
        menuItem,
        date: pkmiRow.date,
        status: pkmiRow.status,
        notes: pkmiRow.notes,
        plate
      };

      this._plateMenuItemsService.update(plateMenuItem).subscribe(editedPkmi => {
        let index = this._clonedPkmis.findIndex(clonedItem => clonedItem.id === editedPkmi.id);
        delete this._clonedPkmis[index];

        // fixme
        if (editedPkmi.plate) {
          if (!previousPlate || (previousPlate && editedPkmi.plate.name !== previousPlate.name)) {
            const previousPlateName = (previousPlate) ? previousPlate.name : PlateQueueManagerService.UNASSIGNED_QUEUE;
            // remove the order from previous plate
            this._plateQueueManagerService.removeFromQueue(previousPlateName!, editedPkmi);
            this._plateQueueManagerService.sendToQueue(editedPkmi.plate?.name!, editedPkmi);
          }
        } else {
          const previousPlateName = (previousPlate) ? previousPlate.name : PlateQueueManagerService.UNASSIGNED_QUEUE;
          // remove the order from previous plate
          this._plateQueueManagerService.removeFromQueue(previousPlateName!, editedPkmi);
          this._plateQueueManagerService.sendToQueue(PlateQueueManagerService.UNASSIGNED_QUEUE, editedPkmi);
        }
      });
    }
  }

  onRowEditCancel(pkmi: any, index: number) {
    this.pkmiRows[index] = this._clonedPkmis[pkmi.id];
    delete this._clonedPkmis[pkmi.id];
  }

  getPlateColor(pkmiPlate: string): string {
    const plate = this.plates.find((item => item.name === pkmiPlate));
    return (plate && plate.color) ? plate.color : 'transparent';
  }

  getStatusIcon(pkmiStatus: string): string {
    const status = this.statuses.find(item => item.value === pkmiStatus);
    return 'pi ' + status.icon;
  }

  getStatusLabelColor(pkmiStatus: string): string {
    const status = this.statuses.find(item => item.value === pkmiStatus);
    return status.color;
  }

  getCategory(menuItemNode: TreeNode): string {
    let category = '';
    if (menuItemNode.parent && menuItemNode.parent.data) {
      category = menuItemNode.parent.data.name;
    }
    return category;
  }

  getCategoryColor(menuItemNode: TreeNode): string {
    let color = 'transparent';
    if (menuItemNode.parent && menuItemNode.parent.data) {
      const category = menuItemNode.parent.data;
      color = category.color;
    }
    return color;
  }

  private _loadPlateMenuItems() {
    this._pkmisSub = this._plateMenuItemsService.getAll().subscribe(data => {
      this.plateMenuItems = data;

      this.pkmiRows = this.plateMenuItems.map((plateMenuItem: PlateMenuItem) => {
        const menuItemNode = PlateMenuItemsService.getMenuItemNode(this.categories, plateMenuItem.menuItem);
        return {
          id: plateMenuItem.id,
          orderNumber: plateMenuItem.orderNumber,
          tableNumber: plateMenuItem.tableNumber,
          clientName: plateMenuItem.clientName,
          menuItem: menuItemNode,
          date: plateMenuItem.date,
          status: plateMenuItem.status,
          plate: plateMenuItem.plate?.name,
          notes: plateMenuItem.notes
        };
      });
    });
  }

  private _getNotificationMsgData(notification: PKMINotification) {
    let summary = '';
    let detail = '';
    let severity = '';
    switch (notification?.type) {
      case PKMINotificationType.PKMI_ADD:
        severity = 'success';
        summary = 'Aggiunto panino';
        detail = 'Aggiunto panino ' + notification?.plateKitchenMenuItem?.menuItem.name + ' per ordine ' + notification?.plateKitchenMenuItem?.orderNumber;
        break;
      case PKMINotificationType.PKMI_ADD_ALL:
        severity = 'success';
        summary = 'Aggiunti panini';
        detail = 'Aggiunti ' + notification?.ids?.length + ' panini';
        break;
      case PKMINotificationType.PKMI_UPDATE:
        severity = 'warn';
        summary = 'Modificato panino';
        detail = 'Modificato panino ' + notification?.plateKitchenMenuItem?.menuItem.name + ' per ordine ' + notification?.plateKitchenMenuItem?.orderNumber;
        break;
      case PKMINotificationType.PKMI_UPDATE_ALL:
        severity = 'warn';
        summary = 'Modificati panini';
        detail = 'Modificati ' + notification?.ids?.length + ' panini';
        break;
      case PKMINotificationType.PKMI_DELETE:
        severity = 'error';
        summary = 'Cancellato panino';
        detail = 'Cancellato panino id ' + notification?.ids[0];
        break;
      case PKMINotificationType.PKMI_DELETE_ALL:
        severity = 'error';
        summary = 'Cancellati panini';
        detail = 'Cancellati ' + notification?.ids?.length + ' panini';
        break;
    }

    return {severity, summary, detail};
  }
}
