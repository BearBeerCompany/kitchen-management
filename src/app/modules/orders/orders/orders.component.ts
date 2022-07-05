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

}
