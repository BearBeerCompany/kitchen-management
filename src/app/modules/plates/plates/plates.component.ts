import {Component, OnInit} from '@angular/core';
import {mode, PlateMode} from "../plate-mode";
import {I18nService} from "../../../services/i18n.service";

@Component({
  selector: 'plates',
  templateUrl: './plates.component.html',
  styleUrls: ['./plates.component.scss']
})
export class PlatesComponent implements OnInit {

  public plateMode: typeof PlateMode = mode();
  public readonly i18n: any;

  constructor(public i18nService: I18nService) {
    this.i18n = i18nService.instance;
  }

  ngOnInit(): void {
  }

}
