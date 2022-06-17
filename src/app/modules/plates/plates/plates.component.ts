import {Component, OnInit} from '@angular/core';
import {mode, PlateMode} from "../plate-mode";
import {I18N} from "../../../../assets/i18n-ita";

@Component({
  selector: 'plates',
  templateUrl: './plates.component.html',
  styleUrls: ['./plates.component.scss']
})
export class PlatesComponent implements OnInit {

  public plateMode: typeof PlateMode = mode();
  public i18n = I18N;

  constructor() {
  }

  ngOnInit(): void {
  }

}
