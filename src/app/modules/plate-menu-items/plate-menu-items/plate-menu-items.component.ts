import {Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {I18nService} from 'src/app/services/i18n.service';
import {PlateMenuItemsService} from '../services/plate-menu-items.service';
import {Table} from 'primeng/table';
import {Category, MenuItem, PlateMenuItem, Status} from '../plate-menu-item';
import {Observable, Subscription} from 'rxjs';
import {Router} from "@angular/router";
import {ConfirmationService, MessageService, TreeNode} from "primeng/api";
import {MenuItemsService} from "../services/menu-items.service";
import {DatePipe} from "@angular/common";
import {ApiConnector} from "../../../services/api-connector";
import {PlateQueueManagerService} from "../../plates/services/plate-queue-manager.service";
import { WebSocketService } from 'src/app/services/web-socket-service';
import { PKMINotification } from 'src/app/services/pkmi-notification';
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
              @Inject('ApiConnector') private apiConnector: ApiConnector,
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
        this.menuItemOptions = this._getMenuItemOptions(this.categories, data);

        this._pkmisSub = this._plateMenuItemsService.getAll().subscribe(data => {
          this.plateMenuItems = data;

          this.pkmiRows = this.plateMenuItems.map((plateMenuItem: PlateMenuItem) => {
            const menuItemNode = this._getMenuItemNode(plateMenuItem.menuItem); // transform to TreeNode (primeng)
            return {
              id: plateMenuItem.id,
              orderNumber: plateMenuItem.orderNumber,
              menuItem: menuItemNode,
              date: plateMenuItem.date,
              status: plateMenuItem.status,
              plate: plateMenuItem.plate?.name,
              notes: plateMenuItem.notes
            };
          });
          this.loading = false;
        });
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
      this._messageService.add({
        severity:'success',
        summary: 'Aggiunto ordine',
        detail: 'Aggiunto panino ' + notification?.plateKitchenMenuItem?.menuItemId + ', ordine ' + notification?.plateKitchenMenuItem?.orderNumber,
        life: 2500
      });
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
        this.apiConnector.removeOrders(ids).subscribe(() => {
          this.plateMenuItems = this.plateMenuItems.filter(val => !this.selectedPlateMenuItems.includes(val));
          this.selectedPlateMenuItems = [];
          this._messageService.add({severity:'success', summary: 'Successful', detail: 'Orders Deleted', life: 3000});
        })
      }
    });
  }

  hideDialog() {
    this.pkmiDialog = false;
    this.submitted = false;
  }

  savePkmi() {
    this.submitted = true;
    if (this.currentPlateMenuItem._id) {
      let menuItem: MenuItem = {
        ...this.currentPlateMenuItem.menuItem.data,
        category: this.currentPlateMenuItem.menuItem.parent.data
      };
      const currentOrderIdx = this.plateMenuItems.findIndex(order => order.id === this.currentPlateMenuItem._id);

      const editOrder = {
        ... this.plateMenuItems[currentOrderIdx],
        orderId: this.currentPlateMenuItem.orderId,
        menuItem,
        status: this.currentPlateMenuItem.status,
        notes: this.currentPlateMenuItem.notes,
        date: this.currentPlateMenuItem.date,
        plate: this.currentPlateMenuItem.plate
      };
      // fixme
      this.apiConnector.updateOrder(editOrder).subscribe(order => {
        console.log("order" + order);

        this.plateMenuItems[currentOrderIdx] = {
          ... this.plateMenuItems[currentOrderIdx],
          orderNumber: order.orderId,
          menuItem,
          status: order.status,
          notes: order.notes,
          date: order.date,
          plate: order.plate
        };
      });
    } else {
      // new plate-menu-items
      let newOrders: PlateMenuItem[] = [];
      let menuItem: MenuItem = {
        ...this.currentPlateMenuItem.menuItem.data,
        category: this.currentPlateMenuItem.menuItem.parent.data
      };
      const date = new Date();
      const dateFormatted = this._datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss');

      for (let i = 0; i < this.currentPlateMenuItem.quantity; i++) {
        newOrders.push({
          id: this._plateMenuItemsService.createId(),
          orderNumber: this.currentPlateMenuItem.orderId,
          menuItem,
          status: this.statuses[0],
          notes: this.currentPlateMenuItem.notes,
          date: dateFormatted,
          plate: this.currentPlateMenuItem.plate,
          clientName: '', // todo
          tableNumber: 0, // todo
        });
      }

      // fixme
      this.apiConnector.addOrders(newOrders).subscribe(orders => {
        this.plateMenuItems = this.plateMenuItems.concat(orders);
      })
    }

    this.pkmiDialog = false;
  }

  onRowEditInit(pkmi: any) {
    this._clonedPkmis[pkmi._id] = {...pkmi};
  }

  onRowEditSave(pkmiRow: any) {
    let plateMenuItem = this.plateMenuItems.find(item => item.id === pkmiRow._id);

    if (plateMenuItem) {
      const previousPlate = plateMenuItem.plate;
      const menuItem: MenuItem = {
        ...pkmiRow.menuItem.data,
        category: pkmiRow.menuItem.parent.data
      };
      const plate = this.plates.find(item => item.name === pkmiRow.plate) as Plate;

      plateMenuItem = {
        ...plateMenuItem,
        orderNumber: pkmiRow.orderNumber,
        menuItem,
        date: pkmiRow.date,
        status: pkmiRow.status,
        notes: pkmiRow.notes,
        plate
      };
      this.apiConnector.updateOrder(plateMenuItem).subscribe(order => {
        delete this._clonedPkmis[order._id];

        if (order.plate) {
          if (!previousPlate || (previousPlate && order.plate.name !== previousPlate.name)) {
            const previousPlateName = (previousPlate) ? previousPlate.name : PlateQueueManagerService.UNASSIGNED_QUEUE;
            // remove the order from previous plate
            this._plateQueueManagerService.removeFromQueue(previousPlateName!, order);
            this._plateQueueManagerService.sendToQueue(order.plate?.name!, order);
          }
        } else {
          const previousPlateName = (previousPlate) ? previousPlate.name : PlateQueueManagerService.UNASSIGNED_QUEUE;
          // remove the order from previous plate
          this._plateQueueManagerService.removeFromQueue(previousPlateName!, order);
          this._plateQueueManagerService.sendToQueue(PlateQueueManagerService.UNASSIGNED_QUEUE, order);
        }
      });
    }
  }

  onRowEditCancel(order: any, index: number) {
    this.pkmiRows[index] = this._clonedPkmis[order._id];
    delete this._clonedPkmis[order._id];
  }

  private _getMenuItemNode(menuItem: MenuItem): TreeNode {
    const menuItemNode = {
      label: menuItem.name,
      data: menuItem,
      parent: {
        data: this.categories.find(category => category.id === menuItem.categoryId)
      }
    };

    return menuItemNode;
  }

  private _getMenuItemOptions(categories: Category[], items: MenuItem[]): TreeNode[] {
    const optionsTree: TreeNode[] = [];
    optionsTree.push(...categories.map(category => {
      return  {
        key: category.id,
        label: category.name,
        data: category,
        expandedIcon: 'pi pi-folder-open',
        collapsedIcon: 'pi pi-folder',
        selectable: false,
        children: []
      } as TreeNode;
    }));

    items.forEach(item => {
      const itemNode = {
        key: item.id,
        label: item.name,
        data: item,
        icon: 'pi pi-file'
      };
      const itemCategoryNode = optionsTree.find(node => node.key === item.categoryId);
      if (itemCategoryNode) {
        itemCategoryNode.children?.push(itemNode);
      }
    });

    return optionsTree;
  }

  getPlateColor(orderPlate: string): string {
    const plate = this.plates.find((item => item.name === orderPlate));
    return (plate && plate.color) ? plate.color : 'transparent';
  }

  getStatusIcon(orderStatus: string): string {
    const status = this.statuses.find(item => item.value === orderStatus);
    return 'pi ' + status.icon;
  }

  getStatusLabelColor(orderStatus: string): string {
    const status = this.statuses.find(item => item.value === orderStatus);
    return status.color;
  }

  getCategory(menuItem: any): string {
    let category = '';
    if (menuItem.parent && menuItem.parent.data) {
      category = menuItem.parent.data.name;
    }
    return category;
  }

  getCategoryColor(menuItem: any): string {
    let color = 'transparent';
    if (menuItem.parent && menuItem.parent.data) {
      const category = menuItem.parent.data;
      color = category.color;
    }
    return color;
  }
}
