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

const routes: Routes = [
  {
    path: '',
    component: PlatesComponent
  }
];

@NgModule({
  declarations: [
    PlatesComponent,
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
    ReactiveFormsModule
  ]
})
export class PlatesModule {
}
