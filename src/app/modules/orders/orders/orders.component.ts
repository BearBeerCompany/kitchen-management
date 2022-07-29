import {Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {I18nService} from 'src/app/services/i18n.service';
import {OrdersService} from '../orders.service';
import {Table} from 'primeng/table';
import {MenuItem, Order, Status} from '../order';
import {Subscription} from 'rxjs';
import {Router} from "@angular/router";
import {ConfirmationService, MessageService} from "primeng/api";
import {MenuItemsService} from "../menu-items.service";
import {DatePipe} from "@angular/common";
import {ApiConnector} from "../../../services/api-connector";
import {Plate} from "../../plates/plate/plate.model";

@Component({
  selector: 'orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {

  private ordersSub: Subscription = new Subscription();
  private menuItemsSub: Subscription = new Subscription();
  private platesSub: Subscription = new Subscription();
  private clonedOrders: Order[] = [];

  public readonly i18n: any;
  orders: Order[] = [];
  ordersRows: any[] = [];
  selectedOrders: Order[] = [];
  loading: boolean = true;
  statuses: any[] = [];
  currentOrder: any;
  submitted = false;
  orderDialog = false;
  menuItems: any[] = [];
  platesOptions: any[] = [];
  plates: Plate[] = [];

  @ViewChild('dt') table: Table | undefined;

  constructor(public i18nService: I18nService, private ordersService: OrdersService, private menuItemsService: MenuItemsService,
              private router: Router, private messageService: MessageService, private confirmationService: ConfirmationService,
              private datePipe: DatePipe, @Inject('ApiConnector') private apiConnector: ApiConnector) {
    this.i18n = i18nService.instance;
    this.statuses = [
      {label: 'Todo', value: Status.Todo, icon: 'pi-stop-circle', color: 'grey'},
      {label: 'Progress', value: Status.Progress, icon: 'pi-spinner', color: 'blue'},
      {label: 'Done', value: Status.Done, icon: 'pi-check', color: 'green'},
      {label: 'Cancelled', value: Status.Cancelled, icon: 'pi-times', color: 'red'}
    ];
  }

  ngOnInit(): void {
    this.menuItemsSub = this.menuItemsService.getMenuItems().subscribe(data => {
      this.menuItems = data;

      this.ordersSub = this.apiConnector.getOrders().subscribe(data => {
        this.orders = data;
        this.ordersRows = this.orders.map((order: Order) => {
          const menuItem = this._getMenuItemNode(order);
          return {
            _id: order._id,
            orderId: order.orderId,
            menuItem,
            date: order.date,
            status: order.status,
            plate: order.plate?.name,
            notes: order.notes
          };
        });
        this.loading = false;
      });
    });
    this.platesSub = this.apiConnector.getPlates().subscribe((data: Plate[]) => {
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
  }

  ngOnDestroy(): void {
    this.ordersSub.unsubscribe();
    this.menuItemsSub.unsubscribe();
    this.platesSub.unsubscribe();
  }

  addOrder() {
    this.router.navigate(['/orders/new']);
  }

  filterGlobal(event: any) {
    if (this.table) {
      this.table.filterGlobal(event.target.value, 'contains');
    }
  }

  openNew() {
    this.currentOrder = {};
    this.submitted = false;
    this.orderDialog = true;
  }

  deleteSelectedProducts() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected orders?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const ids = this.selectedOrders.map(item => item._id!);
        this.apiConnector.removeOrders(ids).subscribe(() => {
          this.orders = this.orders.filter(val => !this.selectedOrders.includes(val));
          this.selectedOrders = [];
          this.messageService.add({severity:'success', summary: 'Successful', detail: 'Orders Deleted', life: 3000});
        })
      }
    });
  }

  hideDialog() {
    this.orderDialog = false;
    this.submitted = false;
  }

  saveOrder() {
    this.submitted = true;
    if (this.currentOrder._id) {
      let menuItem: MenuItem = {
        ...this.currentOrder.menuItem.data,
        category: this.currentOrder.menuItem.parent.data
      };
      const currentOrderIdx = this.orders.findIndex(order => order._id === this.currentOrder._id);

      const editOrder = {
        ... this.orders[currentOrderIdx],
        orderId: this.currentOrder.orderId,
        menuItem,
        status: this.currentOrder.status,
        notes: this.currentOrder.notes,
        date: this.currentOrder.date,
        plate: this.currentOrder.plate
      };
      this.apiConnector.updateOrder(editOrder).subscribe(order => {
        console.log("order" + order);

        this.orders[currentOrderIdx] = {
          ... this.orders[currentOrderIdx],
          orderId: order.orderId,
          menuItem,
          status: order.status,
          notes: order.notes,
          date: order.date,
          plate: order.plate
        };
      });
    } else {
      // new orders
      let newOrders: Order[] = [];
      let menuItem: MenuItem = {
        ...this.currentOrder.menuItem.data,
        category: this.currentOrder.menuItem.parent.data
      };
      const date = new Date();
      const dateFormatted = this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss');

      for (let i = 0; i < this.currentOrder.quantity; i++) {
        newOrders.push({
          _id: this.ordersService.createId(),
          orderId: this.currentOrder.orderId,
          menuItem,
          status: this.statuses[0],
          notes: this.currentOrder.notes,
          date: dateFormatted,
          plate: this.currentOrder.plate
        });
      }

      this.apiConnector.addOrders(newOrders).subscribe(orders => {
        this.orders = this.orders.concat(orders);
      })
    }

    this.orderDialog = false;
  }

  editOrder(order: Order) {
    this.currentOrder = {...order};
    let menuItemNode = this._getMenuItemNode(order);
    if (menuItemNode) {
      this.currentOrder.menuItem = menuItemNode;
    }

    this.orderDialog = true;
  }

  deleteOrder(order: Order) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected order?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiConnector.removeOrder(order._id!).subscribe(() => {
          this.orders = this.orders.filter(val => val != order);
          this.ordersRows = this.ordersRows.filter(val => val != order);
          this.messageService.add({severity:'success', summary: 'Successful', detail: 'Orders Deleted', life: 3000});
        })
      }
    });
  }

  onRowEditInit(order: any) {
    this.clonedOrders[order._id] = {...order};
  }

  onRowEditSave(orderRow: any) {
    let order = this.orders.find(item => item._id === orderRow._id);
    if (order) {
      const menuItem: MenuItem = {
        ...orderRow.menuItem.data,
        category: orderRow.menuItem.parent.data
      };
      const plate = this.plates.find(item => item.name === orderRow.plate) as Plate;

      order = {
        ...order,
        orderId: orderRow.orderId,
        menuItem,
        date: orderRow.date,
        status: orderRow.status,
        notes: orderRow.notes,
        plate
      };
      this.apiConnector.updateOrder(order).subscribe(order => {
        delete this.clonedOrders[order._id];
      });
    }
  }

  onRowEditCancel(order: any, index: number) {
    this.ordersRows[index] = this.clonedOrders[order._id];
    delete this.clonedOrders[order._id];
  }

  private _getMenuItemNode(order: Order) {
    const menuItemId = order.menuItem._id;
    const categoryId = order.menuItem.category?._id;
    let menuItemNode = null;
    this.menuItems.forEach(item => {
      if (item.data._id === categoryId) {
        menuItemNode = item.children.find((child: any) => {
          return child.data._id === menuItemId;
        });
        menuItemNode = {
          ...menuItemNode,
          parent: {
            data: order.menuItem.category
          }
        };
      }
    });
    return menuItemNode;
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
