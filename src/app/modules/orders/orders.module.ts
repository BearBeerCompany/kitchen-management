import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrdersRoutingModule } from './orders-routing.module';
import { OrdersComponent } from './orders/orders.component';
import { OrderNewComponent } from './order-new/order-new.component';
import { MenuItemsComponent } from './menu-items/menu-items.component';
import { OrderEditComponent } from './order-edit/order-edit.component';
import { OrderDetailsComponent } from './order-details/order-details.component';


@NgModule({
  declarations: [
    OrdersComponent,
    OrderNewComponent,
    MenuItemsComponent,
    OrderEditComponent,
    OrderDetailsComponent
  ],
  imports: [
    CommonModule,
    OrdersRoutingModule
  ]
})
export class OrdersModule { }
