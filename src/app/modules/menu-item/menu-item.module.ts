import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {MenuItemComponent} from './menu-item/menu-item.component';
import {CategoryComponent} from './category/category.component';
import {MenuItemListComponent} from './menu-item-list/menu-item-list.component';
import {TableModule} from 'primeng/table';
import {DialogModule} from "primeng/dialog";
import {InputTextModule} from "primeng/inputtext";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {ColorPickerModule} from "primeng/colorpicker";
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ToastModule} from "primeng/toast";

const routes: Routes = [
  {
    path: '',
    component: MenuItemComponent
  }
];

@NgModule({
  declarations: [
    MenuItemComponent,
    CategoryComponent,
    MenuItemListComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TableModule,
    DialogModule,
    InputTextModule,
    ReactiveFormsModule,
    ButtonModule,
    RippleModule,
    ColorPickerModule,
    FormsModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService]
})
export class MenuItemModule {
}
