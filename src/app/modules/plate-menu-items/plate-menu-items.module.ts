import {NgModule} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';

import {PlateMenuItemsRoutingModule} from './plate-menu-items-routing.module';
import {PlateMenuItemsComponent} from './plate-menu-items/plate-menu-items.component';
import {PlateMenuItemNewComponent} from './plate-menu-items-new/plate-menu-item-new.component';

import {TableModule} from 'primeng/table';
import {InputTextModule} from "primeng/inputtext";

import {PlateMenuItemsService} from './services/plate-menu-items.service';
import {SharedModule} from "../shared/shared.module";
import {CalendarModule} from "primeng/calendar";
import {DropdownModule} from "primeng/dropdown";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {TreeSelectModule} from "primeng/treeselect";
import {InputNumberModule} from "primeng/inputnumber";
import {ToastModule} from "primeng/toast";
import {ToolbarModule} from "primeng/toolbar";
import {DialogModule} from "primeng/dialog";
import {MenuItemsService} from "./services/menu-items.service";
import {ConfirmationService, MessageService} from "primeng/api";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {CardModule} from "primeng/card";
import {TabViewModule} from "primeng/tabview";
import {SplitButtonModule} from "primeng/splitbutton";
import {DragDropModule} from "primeng/dragdrop";
import {CategoryService} from "./services/category.service";

@NgModule({
  declarations: [
    PlateMenuItemsComponent,
    PlateMenuItemNewComponent
  ],
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    SharedModule,
    PlateMenuItemsRoutingModule,
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
  providers: [PlateMenuItemsService, MenuItemsService, CategoryService, MessageService, ConfirmationService, DatePipe]
})
export class PlateMenuItemsModule { }