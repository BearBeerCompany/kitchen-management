import {Component} from '@angular/core';
import {Router} from "@angular/router";
import {Routing} from "../../../../app-routing.module";
import {PlateQueueManagerService} from "../../../plates/services/plate-queue-manager.service";
import {I18nService} from "../../../../services/i18n.service";

@Component({
  selector: 'navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {

  public readonly i18n: any;

  public selectedRoute?: Routing = undefined;

  constructor(public plateQueueManagerService: PlateQueueManagerService,
              public i18nService: I18nService,
              private _router: Router) {
    this.i18n = i18nService.instance;
  }

  public get routing(): typeof Routing {
    return Routing;
  }

  public onNavClick(dest: Routing): void {
    this._router.navigate(['/' + dest])
      .then(() => this.selectedRoute = dest);
  }
}
