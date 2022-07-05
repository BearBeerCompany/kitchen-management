import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {I18nService} from 'src/app/services/i18n.service';
import {OrdersService} from '../orders.service';
import {Table} from 'primeng/table';
import {Order} from '../order';
import {Subscription} from 'rxjs';
import {Router} from "@angular/router";

@Component({
  selector: 'orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {

  public readonly i18n: any;
  orders: Order[] = [];
  ordersSub: Subscription = new Subscription();
  selectedOrders: Order[] = [];
  loading: boolean = true;

  @ViewChild('dt') table: Table | undefined;
  statuses: any[] = [];

  constructor(public i18nService: I18nService, private ordersService: OrdersService, private router: Router) {
    this.i18n = i18nService.instance;
  }

  ngOnInit(): void {
    this.ordersSub = this.ordersService.getOrders().subscribe(data => {
      this.orders = data;
      this.loading = false;
    });

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

  filterNumber(event: any) {
    if (this.table) {
      this.table.filter(event.target.value, 'name', 'startsWith');
    }
  }

  filterMenuItem(event: any) {
    if (this.table) {
      this.table.filter(event, 'menuItem.name', 'contains');
    }
  }

  filterCategory(event: any) {
    if (this.table) {
      this.table.filter(event, 'category.name', 'contains');
    }
  }

  filterPlate(event: any) {
    if (this.table) {
      this.table.filter(event, 'plate.name', 'contains');
    }
  }

  onDateSelect(value: any) {
    if (this.table) {
      this.table.filter(this.formatDate(value), 'date', 'equals');
    }
  }

  formatDate(date: any) {
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if (month < 10) {
      month = '0' + month;
    }

    if (day < 10) {
      day = '0' + day;
    }

    return date.getFullYear() + '-' + month + '-' + day;
  }

}
