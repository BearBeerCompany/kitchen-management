import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenuItemsComponent } from './menu-items/menu-items.component';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { OrderEditComponent } from './order-edit/order-edit.component';
import { OrderNewComponent } from './order-new/order-new.component';
import { OrdersComponent } from './orders/orders.component';

const routes: Routes = [{
  path: '',
  component: OrdersComponent 
}, {
  path: 'new',
  component: OrderNewComponent
}, {
  path: 'menu-items',
  component: MenuItemsComponent
}, {
  path: ':id',
  component: OrderDetailsComponent
}, {
  path: ':id/edit',
  component: OrderEditComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }
