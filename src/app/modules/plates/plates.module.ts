import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PlatesComponent} from './plates/plates.component';
import {RouterModule, Routes} from "@angular/router";
import {PlateComponentModule} from './plate/plate.component';
import {PlatePageComponent} from "./page/plate-page.component";
import {ItemComponentModule} from './item/item.component';
import {BadgeModule} from "primeng/badge";
import {ItemsOverlayComponentModule} from './items-overlay/items-overlay.component';
import {ToastModule} from 'primeng/toast';
import {MessageService} from "primeng/api";

const routes: Routes = [
  {
    path: '',
    component: PlatesComponent
  },
  {
    path: ':id',
    component: PlatePageComponent
  }
];

@NgModule({
  declarations: [
    PlatePageComponent,
    PlatesComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    BadgeModule,
    PlateComponentModule,
    ItemComponentModule,
    ItemsOverlayComponentModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class PlatesModule {
}
