import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PlatesComponent} from './plates/plates.component';
import {RouterModule, Routes} from "@angular/router";
import {PlateComponent} from './plate/plate.component';

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
    RouterModule.forChild(routes)
  ]
})
export class PlatesModule {
}
