import {NgModule} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';

import {OrdersRoutingModule} from './orders-routing.module';
import {OrdersComponent} from './orders/orders.component';
import {OrderNewComponent} from './order-new/order-new.component';

import {TableModule} from 'primeng/table';
import {InputTextModule} from "primeng/inputtext";

import {OrdersService} from './orders.service';
import {SharedModule} from "../shared/shared.module";
import {CalendarModule} from "primeng/calendar";
import {DropdownModule} from "primeng/dropdown";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {TreeSelectModule} from "primeng/treeselect";
import {InputNumberModule} from "primeng/inputnumber";
import {ToastModule} from "primeng/toast";
import {ToolbarModule} from "primeng/toolbar";
import {DialogModule} from "primeng/dialog";
import {MenuItemsService} from "./menu-items.service";
import {ConfirmationService, MessageService} from "primeng/api";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {CardModule} from "primeng/card";
import {TabViewModule} from "primeng/tabview";
import {SplitButtonModule} from "primeng/splitbutton";
import {DragDropModule} from "primeng/dragdrop";

@NgModule({
  declarations: [
    OrdersComponent,
    OrderNewComponent
  ],
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    SharedModule,
    OrdersRoutingModule,
    CalendarModule,
    DropdownModule,
    FormsModule,
    ReactiveFormsModule,
    TreeSelectModule,
    InputNumberModule,
    ToastModule,
    ToolbarModule,
    DialogModule,
    ConfirmDialogModule,
    CardModule,
    TabViewModule,
    SplitButtonModule,
    DragDropModule
  ],
  providers: [OrdersService, MenuItemsService, MessageService, ConfirmationService, DatePipe]
})
export class OrdersModule { }
