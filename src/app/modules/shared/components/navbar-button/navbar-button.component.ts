import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'navbar-button',
  template: `
    <button (click)="click()" [ngClass]="active ? 'active' : ''">
      <i *ngIf="!badged" class="pi {{icon}}"></i>
      <i *ngIf="badged" class="pi {{icon}}" pBadge [value]="badgeCounter!.toString()"></i>
    </button>
  `,
  styleUrls: ['navbar-button.component.scss']
})
export class NavbarButtonComponent {

  @Input() public icon!: string;
  @Input() public active: boolean = false;
  @Input() public badged?: boolean = false;
  @Input() public badgeCounter?: number | null;

  @Output() onClick: EventEmitter<any> = new EventEmitter<any>(true);

  public click() {
    this.onClick.emit(true);
  }
}
