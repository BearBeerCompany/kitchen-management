import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SettingsComponent} from './settings/settings.component';
import {RouterModule, Routes} from "@angular/router";
import {SharedModule} from "../shared/shared.module";
import {DialogModule} from 'primeng/dialog';
import {PlateComponentModule} from "../plates/plate/plate.component";
import {InputTextModule} from "primeng/inputtext";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {InputNumberModule} from "primeng/inputnumber";
import {ColorPickerModule} from "primeng/colorpicker";
import {ChartModule} from 'primeng/chart';
import {CalendarModule} from 'primeng/calendar';
import {ConfirmationService, MessageService} from "primeng/api";
import {ToastModule} from "primeng/toast";
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputSwitchModule } from 'primeng/inputswitch';

const routes: Routes = [
  {
    path: '',
    component: SettingsComponent
  }
];

@NgModule({
  declarations: [
    SettingsComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    DialogModule,
    PlateComponentModule,
    InputTextModule,
    ReactiveFormsModule,
    InputNumberModule,
    ColorPickerModule,
    ChartModule,
    CalendarModule,
    FormsModule,
    ToastModule,
    ConfirmDialogModule,
    InputSwitchModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class SettingsModule {
}
