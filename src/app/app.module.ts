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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
