import {Component, Input, OnInit} from '@angular/core';
import {Plate} from "../../../plates/plate.interface";

@Component({
  selector: 'plate-info',
  template: `
    <div class="info-container" [style.backgroundColor]="config.color!">
      <div class="details">
        <h3>{{config.name}}</h3>
        <p-tag [severity]="config._severity!"
               [value]="config._status!"
               styleClass="mr-2"></p-tag>
      </div>
      <button *ngIf="!hideEdit" class="edit-button"
              (mouseover)="hideDelete = true"
              (mouseleave)="hideDelete = false">
        <i class="pi pi-pencil"></i>
      </button>
      <button *ngIf="!hideDelete" class="delete-button"
              (mouseover)="hideEdit = true"
              (mouseleave)="hideEdit = false">
        <i class="pi pi-trash"></i>
      </button>
    </div>
  `,
  styleUrls: ['./plate-info.component.scss']
})
export class PlateInfoComponent implements OnInit {

  @Input() config!: Plate;

  public hideEdit: boolean = false;
  public hideDelete: boolean = false;

  ngOnInit(): void {
  }

}
