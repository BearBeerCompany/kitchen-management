import {Component} from '@angular/core';
import {Router} from "@angular/router";
import {Routing} from "../../../../app-routing.module";
import {PlateQueueManagerService} from "../../../plates/services/plate-queue-manager.service";

@Component({
  selector: 'navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {

  public selectedRoute?: Routing = undefined;

  constructor(public plateQueueManagerService: PlateQueueManagerService,
              private _router: Router) {
  }

  public get routing(): typeof Routing {
    return Routing;
  }

  public onNavClick(dest: Routing): void {
    this._router.navigate(['/' + dest])
      .then(() => this.selectedRoute = dest);
  }
}
