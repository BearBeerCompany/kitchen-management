import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SettingsComponent} from './settings/settings.component';
import {RouterModule, Routes} from "@angular/router";
import {SharedModule} from "../shared/shared.module";
import {DialogModule} from 'primeng/dialog';
import {PlateComponentModule} from "../plates/plate/plate.component";
import {InputTextModule} from "primeng/inputtext";
import {ReactiveFormsModule} from "@angular/forms";
import {InputNumberModule} from "primeng/inputnumber";
import {ColorPickerModule} from "primeng/colorpicker";

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
    ColorPickerModule
  ]
})
export class SettingsModule {
}
