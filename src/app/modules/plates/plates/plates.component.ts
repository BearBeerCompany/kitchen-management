import {AfterViewInit, Component, ElementRef, Inject, OnInit} from '@angular/core';
import {mode, PlateMode} from "../plate-mode";
import {I18nService} from "../../../services/i18n.service";
import {Plate} from "../plate/plate.model";
import {ApiConnector} from "../../../services/api-connector";

@Component({
  selector: 'plates',
  templateUrl: './plates.component.html',
  styleUrls: ['./plates.component.scss']
})
export class PlatesComponent implements OnInit, AfterViewInit {

  public readonly i18n: any;

  public plateMode: typeof PlateMode = mode();
  public hidePrevious: boolean = true;
  public hideNext: boolean = true;
  public plateList!: Plate[];
  public currentPage: number = 0;
  public totalPages: number = 0;

  private readonly _MIN_DELTA_SWIPE = 90;
  public readonly DISPLAY_CHUNK = 3;

  private _start: number = 0;
  private _end: number = 0;
  private _total: number = 0;


  constructor(public i18nService: I18nService,
              private _elementRef: ElementRef,
              @Inject('ApiConnector') private _apiConnector: ApiConnector) {
    this.i18n = i18nService.instance;
  }

  public ngOnInit(): void {
    this.plateList = this._loadPlatesConfig();
    this._total = this.plateList.length;
    this.totalPages = Math.ceil(this._total / this.DISPLAY_CHUNK);
  }

  public ngAfterViewInit(): void {
    // mobile swipe touch hooks
    this._elementRef.nativeElement.querySelector('.plates-carousel')
      .addEventListener('touchstart', () => this._swipeStart(this._normalizeEvent(event)));

    this._elementRef.nativeElement.querySelector('.plates-carousel')
      .addEventListener('touchmove', () => this._swipeMove(this._normalizeEvent(event)));

    this._elementRef.nativeElement.querySelector('.plates-carousel')
      .addEventListener('touchend', () => this._swipeEnd());

    // mouse click swipe hooks
    this._elementRef.nativeElement.querySelector('.plates-carousel')
      .addEventListener('mousedown', () => this._swipeStart(this._normalizeEvent(event)));

    this._elementRef.nativeElement.querySelector('.plates-carousel')
      .addEventListener('mousemove', () => this._swipeMove(this._normalizeEvent(event)));

    this._elementRef.nativeElement.querySelector('.plates-carousel')
      .addEventListener('mouseup', () => this._swipeEnd());
  }

  public onNextPage(): void {
    if ((this.currentPage + 1) === this.totalPages) {
      return
    }

    this.currentPage++;
  }

  public onPreviousPage(): void {
    if (this.currentPage === 0) {
      return
    }

    if (this.currentPage !== 0)
      this.currentPage--;
    else
      this.currentPage = 0;
  }

  public onNewPlate(config: Plate) {
    this._apiConnector.addPlate(config);
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

  private _loadPlatesConfig(): Plate[] {
    return [
      {
        color: "#1976D2",
        mode: PlateMode.On,
        slot: [6, 6],
        name: "Piastra 1"
      },
      {
        color: "#d29e19",
        mode: PlateMode.On,
        slot: [0, 8],
        name: "Piastra 2"
      },
      {
        color: "#f51eb1",
        mode: PlateMode.On,
        slot: [0, 4],
        name: "Piastra 3"
      },
      {
        color: "#4b3a93",
        mode: PlateMode.On,
        slot: [0, 4],
        name: "Piastra 4"
      },
      {
        mode: PlateMode.Skeleton
      }
    ];
  }

}
