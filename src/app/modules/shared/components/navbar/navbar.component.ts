import {Component, OnInit} from '@angular/core';
import {NavigationEnd, Router} from "@angular/router";
import {Routing} from "../../../../app-routing.module";
import {PlateQueueManagerService} from "../../../plates/services/plate-queue-manager.service";
import {I18nService} from "../../../../services/i18n.service";
import {filter} from "rxjs/operators";

@Component({
  selector: 'navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  public readonly i18n: any;

  public selectedRoute?: Routing = undefined;

  constructor(public plateQueueManagerService: PlateQueueManagerService,
              public i18nService: I18nService,
              private _router: Router) {
    this.i18n = i18nService.instance;
  }

  public ngOnInit(): void {
    // Set initial route based on current URL
    this.updateSelectedRoute(this._router.url);

    // Listen to route changes
    this._router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateSelectedRoute(event.urlAfterRedirects || event.url);
      });
  }

  public get routing(): typeof Routing {
    return Routing;
  }

  public onNavClick(dest: Routing): void {
    this._router.navigate(['/' + dest])
      .then(() => this.selectedRoute = dest);
  }

  private updateSelectedRoute(url: string): void {
    // Remove hash and leading slash
    const cleanUrl = url.replace(/^#?\/?/, '');
    
    // Match against routing values
    if (cleanUrl.startsWith(Routing.MenuItem)) {
      this.selectedRoute = Routing.MenuItem;
    } else if (cleanUrl.startsWith(Routing.PlatesSummary)) {
      this.selectedRoute = Routing.PlatesSummary;
    } else if (cleanUrl.startsWith(Routing.PlateMenuItems)) {
      this.selectedRoute = Routing.PlateMenuItems;
    } else if (cleanUrl.startsWith(Routing.Plates)) {
      this.selectedRoute = Routing.Plates;
    } else if (cleanUrl.startsWith(Routing.Settings)) {
      this.selectedRoute = Routing.Settings;
    }
  }
}
