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

@Component({
  selector: 'orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {

  private ordersSub: Subscription = new Subscription();
  private menuItemsSub: Subscription = new Subscription();

  public readonly i18n: any;
  orders: Order[] = [];
  selectedOrders: Order[] = [];
  loading: boolean = true;
  statuses: any[] = [];
  newOrder: any;
  submitted = false;
  orderDialog = false;
  menuItems: any;

  @ViewChild('dt') table: Table | undefined;

  constructor(public i18nService: I18nService, private ordersService: OrdersService, private menuItemsService: MenuItemsService,
              private router: Router, private messageService: MessageService, private confirmationService: ConfirmationService,
              private datePipe: DatePipe, @Inject('ApiConnector') private apiConnector: ApiConnector) {
    this.i18n = i18nService.instance;
  }

  ngOnInit(): void {
    this.ordersSub = this.apiConnector.getOrders().subscribe(data => {
      this.orders = data;
      this.loading = false;
    });

    this.menuItemsSub = this.menuItemsService.getMenuItems().subscribe(data => this.menuItems = data);

    this.statuses = [
      {label: 'Todo', value: 'todo'},
      {label: 'Progress', value: 'progress'},
      {label: 'Done', value: 'done'},
      {label: 'Cancelled', value: 'cancelled'}
    ]
  }

  ngOnDestroy(): void {
    this.ordersSub.unsubscribe();
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
    this.newOrder = {};
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

    let newOrders: Order[] = [];
    let menuItem: MenuItem = {
      ...this.newOrder.menuItem.data,
      category: this.newOrder.menuItem.parent.data
    };
    const date = new Date();
    const dateFormatted = this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss');

    for (let i = 0; i < this.newOrder.quantity; i++) {
      newOrders.push({
        _id: this.ordersService.createId(),
        orderId: this.newOrder.orderId,
        menuItem,
        status: Status.Todo,
        notes: this.newOrder.notes,
        date: '2022-07-05' // fixme
      });
    }

    this.orders = this.orders.concat(newOrders);
    this.orderDialog = false;
  }

}
