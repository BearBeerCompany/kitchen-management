import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {I18nService} from 'src/app/services/i18n.service';
import {PlateMenuItemsService} from '../../shared/service/plate-menu-items.service';
import {Table} from 'primeng/table';
import {Category, MenuItem, PlateMenuItem, Status} from '../plate-menu-item';
import {Observable, of, Subscription} from 'rxjs';
import {Router} from "@angular/router";
import {ConfirmationService, MessageService, TreeNode} from "primeng/api";
import {MenuItemsService} from "../services/menu-items.service";
import {DatePipe} from "@angular/common";
import {WebSocketService} from 'src/app/services/web-socket-service';
import {PKMINotification, PKMINotificationType} from 'src/app/services/pkmi-notification';
import {Plate} from "../../plates/plate.interface";
import {PlateService} from "../../plates/services/plate.service";
import {CategoryService} from "../services/category.service";
import {HttpErrorResponse} from "@angular/common/http";
import {Error} from "../../shared/interface/error.interface";

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
  private _editablePkmiMap: Map<string, PlateMenuItem> = new Map<string, PlateMenuItem>();
  private _pkmiNotification$: Observable<PKMINotification | null>;

  public readonly DATE_FORMAT = 'dd-MM-yyyy HH:mm:ss';
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
  totalRecords: number = 0;
  public toggleCompleted: boolean = false;

  platesOptions: any[] = [];
  takeAwayOptions: any[] = [
    { code: true, label: 'SI', value: true },
    { code: false, label: 'NO', value: false }, 
  ];

  @ViewChild('dt') table: Table | undefined;

  constructor(private _i18nService: I18nService,
              private _menuItemsService: MenuItemsService,
              private _router: Router,
              private _messageService: MessageService,
              private _confirmationService: ConfirmationService,
              public datePipe: DatePipe,
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
    this._pkmiNotification$ = this._webSocketService.pkmiNotifications$;
  }

  ngOnInit(): void {
    this._categoriesSub = this._categoryService.getAll().subscribe(data => {
      this.categories = data;

      this._menuItemsSub = this._menuItemsService.getAll().subscribe(data => {
        this.menuItems = data;
        this.menuItemOptions = PlateMenuItemsService.getCategoryMenuItemTreeNodeOptions(this.categories, data);

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

    this._pkmiNotificationSub = this._pkmiNotification$.subscribe((notification: PKMINotification | null) => {
      console.log('plate - menuitem page notification: ' + notification?.type);
      if (notification) {
        const msgData = WebSocketService.getNotificationMsgData(notification);
        this._messageService.add({
          severity: msgData.severity,
          summary: msgData.summary,
          detail: msgData.detail,
          life: 3000
        });

        this.loading = true;
        switch (notification.type) {
          case PKMINotificationType.PKMI_ADD:
          case PKMINotificationType.PKMI_ADD_ALL:
            this._loadPlateMenuItems(false, null);
            break;
          case PKMINotificationType.PKMI_UPDATE:
            this._updateItem(notification.plateKitchenMenuItem);
            break;
          case PKMINotificationType.PKMI_UPDATE_ALL:
            this._updateItems(notification.ids);
            break;
        }
        this.loading = false;
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
    this.toggleCompleted = !this.toggleCompleted;
    this._loadPlateMenuItems(this.toggleCompleted, null);
  }

  filterGlobal(event: any) {
    if (this.table) {
      this.table.filterGlobal(event.target.value, 'contains');
    }
  }

  loadItems(event: any) {
    console.log(event);
    this._loadPlateMenuItems(this.toggleCompleted, event);
  }

  openNew() {
    this.currentPlateMenuItem = {};
    this.submitted = false;
    this.pkmiDialog = true;
  }

  deleteSelectedPkmis() {
    this._confirmationService.confirm({
      message: 'Confermi di eliminare i prodotti selezionati?',
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const ids = this.selectedPlateMenuItems.map(item => item.id!);
        this._plateMenuItemsService.deleteAll(ids).subscribe(() => {
          this._deleteItems(ids);
        })
      }
    });
  }

  deletePkmi(pkmi: any) {
    this._confirmationService.confirm({
      message: 'Confermi di eliminare il prodotto?',
      header: 'Conferma eliminazione',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this._plateMenuItemsService.delete(pkmi.id).subscribe(() => this._deleteItem(pkmi.id));
      }
    });
  }

  hideDialog() {
    this.pkmiDialog = false;
    this.submitted = false;
  }

  onRowEditInit(pkmi: any) {
    this._editablePkmiMap.set(pkmi.id, {...pkmi});
  }

  onRowEditSave(pkmiRow: any, index: number) {
    let plateMenuItem = this.plateMenuItems.find(item => item.id === pkmiRow.id);

    if (plateMenuItem) {
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
        createdDate: pkmiRow.createdDate,
        status: pkmiRow.status,
        takeAway: pkmiRow.takeAway,
        notes: pkmiRow.notes,
        orderNotes: pkmiRow.orderNotes,
        plate
      };

      this._plateMenuItemsService.update(plateMenuItem)
        .subscribe({
          error: (errorResponse: HttpErrorResponse) => {
            const plateName: string = this.plates.find(p => p.id === (errorResponse.error as Error).causeId)?.name!;
            this.pkmiRows[index].plate = this.plateMenuItems.find(p => p.id === this.pkmiRows[index].id)?.plate?.name;
            this._messageService.add({
              severity: 'error',
              summary: 'Errore Creazione',
              detail: `${plateName} è spenta o non disponibile, selezionare un\' altra piastra per l\'ordine`
            });
          }, next: () => {
            this._editablePkmiMap.delete(pkmiRow.id);
          }
        });
    }
  }

  onRowEditCancel(pkmi: any, index: number) {
    this.pkmiRows = this.pkmiRows.filter(val => pkmi.id !== val.id);
    this.pkmiRows.splice(index, 0, this._editablePkmiMap.get(pkmi.id));
    this._editablePkmiMap.delete(pkmi.id);
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
    if (menuItemNode?.parent && menuItemNode.parent?.data) {
      category = menuItemNode.parent.data.name;
    }
    return category;
  }

  getCategoryColor(menuItemNode: TreeNode): string {
    let color = 'transparent';
    if (menuItemNode?.parent && menuItemNode.parent?.data) {
      const category = menuItemNode.parent.data;
      color = category.color;
    }
    return color;
  }

  private _loadPlateMenuItems(completed: boolean, event: any) {

    this._pkmisSub = this._plateMenuItemsService.getAllPaged(completed, event).subscribe(data => {
      this.plateMenuItems = data.elements;
      this.totalRecords = data.totalSize;

      this.pkmiRows = this.plateMenuItems.map((plateMenuItem: PlateMenuItem) => {
        return this._getPkmiRow(plateMenuItem);
      });
    });
  }

  private _updateItem(plateMenuItem: PlateMenuItem) {
    const updItemId = plateMenuItem.id;
    const pkmiIndex = this.plateMenuItems.findIndex(item => item.id === updItemId);
    const pkmiRowIndex = this.pkmiRows.findIndex(item => item.id === updItemId);
    if (pkmiRowIndex > -1) {
      this.plateMenuItems[pkmiIndex] = {...this.plateMenuItems[pkmiIndex], ...plateMenuItem};
      const updatedItem = {
        ...this.pkmiRows[pkmiRowIndex],
        ...this._getPkmiRow(plateMenuItem)
      };
      // update fields to refresh row
      this.pkmiRows[pkmiRowIndex].menuItem = updatedItem.menuItem;
      this.pkmiRows[pkmiRowIndex].orderNumber = updatedItem.orderNumber;
      this.pkmiRows[pkmiRowIndex].tableNumber = updatedItem.tableNumber;
      this.pkmiRows[pkmiRowIndex].clientName = updatedItem.clientName;
      this.pkmiRows[pkmiRowIndex].status = updatedItem.status;
      this.pkmiRows[pkmiRowIndex].plate = updatedItem.plate;
      this.pkmiRows[pkmiRowIndex].notes = updatedItem.notes;
      this.pkmiRows[pkmiRowIndex].orderNotes = updatedItem.orderNotes;
      this.pkmiRows[pkmiRowIndex].takeAway = updatedItem.takeAway;
    }
  }

  private _updateItems(ids: string[]) {
    this._plateMenuItemsService.getByIds(ids).subscribe((plateMenuItems) => {
      plateMenuItems.forEach(item => {
        this._updateItem(item);
      });
    });
  }

  private _deleteItems(ids: string[]) {
    if (this.plateMenuItems && this.plateMenuItems.length) {
      this.plateMenuItems = this.plateMenuItems.filter(val => !ids.includes(val.id!));
      this.pkmiRows = this.pkmiRows.filter(val => !ids.includes(val.id));
      this.selectedPlateMenuItems = [];
    }
  }

  private _deleteItem(id: string) {
    this._deleteItems([id]);
  }

  private _getPkmiRow(plateMenuItem: PlateMenuItem) {
    const menuItemNode = PlateMenuItemsService.getMenuItemNode(this.categories, plateMenuItem.menuItem);
    return {
      id: plateMenuItem.id,
      orderNumber: plateMenuItem.orderNumber,
      tableNumber: plateMenuItem.tableNumber,
      clientName: plateMenuItem.clientName,
      menuItem: menuItemNode,
      createdDate: plateMenuItem.createdDate,
      status: plateMenuItem.status,
      plate: plateMenuItem.plate?.name,
      takeAway: plateMenuItem.takeAway,
      notes: plateMenuItem.notes,
      orderNotes: plateMenuItem.orderNotes
    };
  }

}
