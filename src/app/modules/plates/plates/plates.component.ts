import {AfterViewInit, Component, ElementRef} from '@angular/core';
import {mode, PlateMode} from "../plate-mode";
import {I18nService} from "../../../services/i18n.service";

@Component({
  selector: 'plates',
  templateUrl: './plates.component.html',
  styleUrls: ['./plates.component.scss']
})
export class PlatesComponent implements AfterViewInit {

  public readonly i18n: any;

  public plateMode: typeof PlateMode = mode();
  public hidePrevious: boolean = true;
  public hideNext: boolean = true;

  private readonly _MIN_DELTA_SWIPE = 90;

  private _start: number = 0;
  private _end: number = 0;

  constructor(public i18nService: I18nService,
              private elementRef: ElementRef) {
    this.i18n = i18nService.instance;
  }

  ngAfterViewInit() {
    // mobile swipe touch hooks
    this.elementRef.nativeElement.querySelector('.plates-carousel')
      .addEventListener('touchstart', () => this._swipeStart(this._normalizeEvent(event)));

    this.elementRef.nativeElement.querySelector('.plates-carousel')
      .addEventListener('touchmove', () => this._swipeMove(this._normalizeEvent(event)));

    this.elementRef.nativeElement.querySelector('.plates-carousel')
      .addEventListener('touchend', () => this._swipeEnd());

    // mouse click swipe hooks
    this.elementRef.nativeElement.querySelector('.plates-carousel')
      .addEventListener('mousedown', () => this._swipeStart(this._normalizeEvent(event)));

    this.elementRef.nativeElement.querySelector('.plates-carousel')
      .addEventListener('mousemove', () => this._swipeMove(this._normalizeEvent(event)));

    this.elementRef.nativeElement.querySelector('.plates-carousel')
      .addEventListener('mouseup', () => this._swipeEnd());
  }

  public onNextPage(): void {
    console.log("NEXT PAGE");
  }

  public onPreviousPage(): void {
    console.log("PREVIOUS PAGE");
  }

  private _swipeStart(event: Touch) {
    this._start = event.screenX;
  }

  private _swipeMove(event: Touch) {
    this._end = event.screenX;
  }

  private _swipeEnd(): void {
    const delta: number = this._end - this._start;

    if (Math.abs(delta) < this._MIN_DELTA_SWIPE)
      return;

    delta < 0 ? this.onNextPage() : this.onPreviousPage();
  }

  private _normalizeEvent(event: any): any {
    return event.changedTouches ? event.changedTouches[0] : event;
  }

}
