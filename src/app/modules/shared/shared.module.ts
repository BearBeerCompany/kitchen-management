import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NavbarButtonComponent} from "./components/navbar-button/navbar-button.component";
import {NavbarComponent} from "./components/navbar/navbar.component";
import {PlateInfoComponent} from "./components/plate-info/plate-info.component";
import {KnobModule} from "primeng/knob";
import {FormsModule} from "@angular/forms";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {TagModule} from "primeng/tag";

@NgModule({
  declarations: [
    NavbarButtonComponent,
    NavbarComponent,
    PlateInfoComponent
  ],
  imports: [
    CommonModule,
    KnobModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    TagModule,
  ],
  exports: [
    NavbarButtonComponent,
    NavbarComponent,
    PlateInfoComponent
  ]
})
export class SharedModule {
}
