import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

export enum Routing {
  MenuItem = "menu-item",
  Plates = "plates",
  Settings = "settings",
  PlateMenuItems = "plate-menu-items"
}

const routes: Routes = [
  {
    path: '',
    redirectTo: Routing.Plates,
    pathMatch: 'full'
  },
  {
    path: Routing.MenuItem,
    loadChildren: () => import("./modules/menu-item/menu-item.module").then(m => m.MenuItemModule)
  },
  {
    path: Routing.Plates,
    loadChildren: () => import("./modules/plates/plates.module").then(m => m.PlatesModule)
  },
  {
    path: Routing.Settings,
    loadChildren: () => import("./modules/settings/settings.module").then(m => m.SettingsModule)
  },
  {
    path: Routing.PlateMenuItems,
    loadChildren: () => import('./modules/plate-menu-items/plate-menu-items.module').then(m => m.PlateMenuItemsModule)
  },
  {
    path: '**',
    redirectTo: Routing.Plates
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
