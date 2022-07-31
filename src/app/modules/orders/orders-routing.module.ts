import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {OrderNewComponent} from './order-new/order-new.component';
import {OrdersComponent} from './orders/orders.component';

const routes: Routes = [{
  path: '',
  component: OrdersComponent
}, {
  path: 'new',
  component: OrderNewComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }
