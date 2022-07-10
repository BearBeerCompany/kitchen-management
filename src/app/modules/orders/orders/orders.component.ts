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

  public readonly i18n: any;
  orders: Order[] = [];
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
      {label: 'Todo', value: 'todo'},
      {label: 'Progress', value: 'progress'},
      {label: 'Done', value: 'done'},
      {label: 'Cancelled', value: 'cancelled'}
    ];
  }

  ngOnInit(): void {
    this.ordersSub = this.apiConnector.getOrders().subscribe(data => {
      this.orders = data;
      this.loading = false;
    });

    this.menuItemsSub = this.menuItemsService.getMenuItems().subscribe(data => this.menuItems = data);
    this.platesSub = this.apiConnector.getPlates().subscribe((data: Plate[]) => {
      this.plates = data;
      this.platesOptions = data.map(item => {
        return {name: item.name, code: item._id};
      });
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
        this.orders = this.orders.filter(val => !this.selectedOrders.includes(val));
        this.selectedOrders = [];
        this.messageService.add({severity:'success', summary: 'Successful', detail: 'Orders Deleted', life: 3000});
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
      return null;
    });
    if (menuItemNode) {
      this.currentOrder.menuItem = menuItemNode;
    }

    this.orderDialog = true;
  }

  deleteOrder(order: Order) {
    // todo
  }
}
