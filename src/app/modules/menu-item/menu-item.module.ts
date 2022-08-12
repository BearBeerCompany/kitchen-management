import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {MenuItemComponent} from './menu-item/menu-item.component';

const routes: Routes = [
  {
    path: '',
    component: MenuItemComponent
  }
];

@NgModule({
  declarations: [
    MenuItemComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class MenuItemModule {
}
