import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {MenuItemComponent} from './menu-item/menu-item.component';
import {CategoryComponent} from './category/category.component';
import {MenuItemListComponent} from './menu-item-list/menu-item-list.component';
import {TableModule} from 'primeng/table';
import {DialogModule} from "primeng/dialog";
import {InputTextModule} from "primeng/inputtext";
import {ReactiveFormsModule} from "@angular/forms";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {ColorPickerModule} from "primeng/colorpicker";

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
    ColorPickerModule
  ]
})
export class MenuItemModule {
}
