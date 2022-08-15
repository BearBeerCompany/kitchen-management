import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Plate} from "../../../plates/plate.interface";

@Component({
  selector: 'plate-info',
  template: `
    <div class="info-container" [style.backgroundColor]="config.color!">
      <button class="switch-button"
              tooltipPosition="left"
              (click)="onSwitchClick()"
              (mouseenter)="toggleIcon()"
              (mouseleave)="toggleIcon()"
              [pTooltip]="config.enabled ? 'Spegni' : 'Accendi'"
              [showDelay]="500"
              [ngClass]="config.enabled ? 'on' : 'off'">
        <i [ngClass]="'pi ' + icon"></i>
      </button>
      <div class="details" [ngClass]="{'off': !config.enabled}">
        <h3>{{config.name}}</h3>
        <p-tag [severity]="config._severity!"
               [value]="!config.enabled ? 'SPENTO' : config._status!"
               [style]="!config.enabled ? {backgroundColor: 'black'} : {}"
               styleClass="mr-2"></p-tag>
      </div>
      <button *ngIf="!hideEdit" class="edit-button"
              (click)="edit.emit(config.id)"
              (mouseover)="hideDelete = true"
              (mouseleave)="hideDelete = false">
        <i class="pi pi-pencil"></i>
      </button>
      <button *ngIf="!hideDelete" class="delete-button"
              (click)="delete.emit(config.id)"
              (mouseover)="hideEdit = true"
              (mouseleave)="hideEdit = false">
        <i class="pi pi-trash"></i>
      </button>
    </div>
  `,
  styleUrls: ['./plate-info.component.scss']
})
export class PlateInfoComponent implements OnChanges {

  @Input() config!: Plate;

  @Output() delete: EventEmitter<string> = new EventEmitter<string>(false);
  @Output() edit: EventEmitter<string> = new EventEmitter<string>(false);
  @Output() switch: EventEmitter<{ id: string, enable: boolean }> = new EventEmitter<{ id: string, enable: boolean }>(false);

  public hideEdit: boolean = false;
  public hideDelete: boolean = false;
  public icon: SwitchIcon = 'pi-sun';

  ngOnChanges(changes: SimpleChanges): void {
    this.icon = this.config.enabled ? 'pi-sun' : 'pi-moon';
  }

  public toggleIcon(): void {
    this.icon = this.icon === 'pi-sun' ? 'pi-moon' : 'pi-sun';
  }

  public onSwitchClick() {
    this.switch.emit({id: this.config.id!, enable: !this.config.enabled});
  }
}

type SwitchIcon = 'pi-moon' | 'pi-sun';
