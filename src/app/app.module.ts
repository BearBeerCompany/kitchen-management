import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {KnobModule} from 'primeng/knob';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {FormsModule} from "@angular/forms";
import {ButtonModule} from 'primeng/button';
import {RippleModule} from "primeng/ripple";
import {NavbarButtonComponent} from './components/navbar-button/navbar-button.component';
import {NavbarComponent} from './components/navbar/navbar.component';
import {ApiConnector} from "./services/api-connector";
import {environment} from "../environments/environment";
import {FileSystemConnectorService} from "./services/file-system-connector.service";
import {HttpRestConnectorService} from "./services/http-rest-connector.service";

@NgModule({
  declarations: [
    AppComponent,
    NavbarButtonComponent,
    NavbarComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    KnobModule,
    FormsModule,
    ButtonModule,
    RippleModule,
  ],
  providers: [{
    provide: 'ApiConnector',
    useClass: environment.connector === "fs" ? FileSystemConnectorService : HttpRestConnectorService
  }],
  bootstrap: [AppComponent]
})
export class AppModule {
}
