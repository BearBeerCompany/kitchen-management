import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ApiConnector} from "./services/api-connector";
import {environment} from "../environments/environment";
import {FileSystemConnectorService} from "./services/file-system-connector.service";
import {HttpRestConnectorService} from "./services/http-rest-connector.service";
import {SharedModule} from "./modules/shared/shared.module";
import {I18nService} from "./services/i18n.service";
import {HttpClientModule} from '@angular/common/http';
import {WebSocketService} from './services/web-socket-service';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    SharedModule
  ],
  providers: [
    I18nService,
    {
      provide: 'ApiConnector',
      useClass: environment.connector === "fs" ? FileSystemConnectorService : HttpRestConnectorService
    },
    WebSocketService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
