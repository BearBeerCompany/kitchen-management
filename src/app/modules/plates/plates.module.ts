import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PlatesComponent} from './plates/plates.component';
import {RouterModule, Routes} from "@angular/router";
import {PlateComponentModule} from './plate/plate.component';
import {PlatePageComponent} from "./page/plate-page.component";
import {ItemComponentModule} from './item/item.component';
import {BadgeModule} from "primeng/badge";
import {ToastModule} from 'primeng/toast';
import {MessageService} from "primeng/api";
import {ItemsOverlayComponentModule} from "./items-overlay/items-overlay.component";
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';
import { PlatesSummaryComponent } from './plates-summary/plates-summary.component';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { PlateMenuItemsService } from '../shared/service/plate-menu-items.service';

const routes: Routes = [
  {
    path: '',
    component: PlatesComponent
  },
  {
    path: 'summary',
    component: PlatesSummaryComponent
  },
  {
    path: ':id',
    component: PlatePageComponent
  }
];

@NgModule({
  declarations: [
    PlatePageComponent,
    PlatesComponent,
    PlatesSummaryComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    BadgeModule,
    PlateComponentModule,
    ItemComponentModule,
    ItemsOverlayComponentModule,
    ToastModule,
    InputSwitchModule,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    TooltipModule,
    CalendarModule,
    ChartModule,
    DropdownModule
  ],
  providers: [MessageService, PlateMenuItemsService]
})
export class PlatesModule {
}
