import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PlatesComponent} from './plates/plates.component';
import {RouterModule, Routes} from "@angular/router";
import {PlateComponent} from './plate/plate.component';
import {TagModule} from 'primeng/tag';
import {InputTextModule} from 'primeng/inputtext';
import {ColorPickerModule} from 'primeng/colorpicker';
import {ButtonModule} from 'primeng/button';
import {RippleModule} from "primeng/ripple";
import {ReactiveFormsModule} from "@angular/forms";
import {InputNumberModule} from "primeng/inputnumber";
import {PlatePageComponent} from "./page/plate-page.component";

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
    PlatesComponent,
    PlateComponent,
    PlatePageComponent
  ],
  exports: [
    PlateComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TagModule,
    InputTextModule,
    ColorPickerModule,
    ButtonModule,
    RippleModule,
    ReactiveFormsModule,
    InputNumberModule
  ]
})
export class PlatesModule {
}
