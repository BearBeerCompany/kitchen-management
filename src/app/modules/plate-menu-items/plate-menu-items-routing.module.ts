import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PlateMenuItemNewComponent} from './plate-menu-items-new/plate-menu-item-new.component';
import {PlateMenuItemsComponent} from './plate-menu-items/plate-menu-items.component';

const routes: Routes = [{
  path: '',
  component: PlateMenuItemsComponent
}, {
  path: 'new',
  component: PlateMenuItemNewComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlateMenuItemsRoutingModule { }
