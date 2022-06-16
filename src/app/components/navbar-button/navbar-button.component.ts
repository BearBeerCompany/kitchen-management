import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'navbar-button',
  template: `
    <button (click)="click()" [ngClass]="_active ? 'active' : ''">
      <i class="pi {{icon}}"></i>
    </button>
  `,
  styleUrls: ['navbar-button.component.scss']
})
export class NavbarButtonComponent {

  @Input() icon!: string;
  @Output() onClick: EventEmitter<any> = new EventEmitter<any>(true);

  public _active: boolean = false;

  @Input() set active(value: boolean) {
    this._active = value;
  }

  public click() {
    this.onClick.emit(true);
  }
}
