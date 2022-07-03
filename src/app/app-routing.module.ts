import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

export enum Routing {
  Dashboard = "dashboard",
  Plates = "plates",
  Settings = "settings",
  Orders = "orders"
}

const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: Routing.Dashboard,
    loadChildren: () => import("./modules/dashboard/dashboard.module").then(m => m.DashboardModule)
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
    path: Routing.Orders,
    loadChildren: () => import('./modules/orders/orders.module').then(m => m.OrdersModule)
  },
  {
    path: '**',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
