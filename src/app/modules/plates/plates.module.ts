import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PlatesComponent} from './plates/plates.component';
import {RouterModule, Routes} from "@angular/router";

const routes: Routes = [
  {
    path: '',
    component: PlatesComponent
  }
];

@NgModule({
  declarations: [
    PlatesComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class PlatesModule {
}
