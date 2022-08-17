import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {PlateMenuItemsService} from "../../shared/service/plate-menu-items.service";
import {MenuItemsService} from "../services/menu-items.service";
import {MessageService, TreeNode} from "primeng/api";
import {Subscription} from "rxjs";
import {I18nService} from "../../../services/i18n.service";
import {Category, MenuItemExtended, PlateMenuItem, Status} from "../plate-menu-item";
import {DatePipe} from "@angular/common";
import {Router} from "@angular/router";
import {Plate} from "../../plates/plate.interface";
import {CategoryService} from "../services/category.service";
import {PlateService} from "../../plates/services/plate.service";
import {Error} from "../../shared/interface/error.interface";
import {HttpErrorResponse} from "@angular/common/http";

@Component({
  selector: 'plate-menu-items-new',
  templateUrl: './plate-menu-item-new.component.html',
  styleUrls: ['./plate-menu-item-new.component.scss']
})
export class PlateMenuItemNewComponent implements OnInit, OnDestroy {

  public readonly i18n: any;
  public form: FormGroup | undefined;
  public menuItemsOptions: TreeNode[] = [];
  public menuItems: MenuItemExtended[] = [];
  public categories: Category[] = [];
  public plateMenuItems: PlateMenuItem[] = [];
  public selectedPlateMenuItems: PlateMenuItem[] = [];
  public plates: Plate[] = [];
  public platesOptions: any[] = [];
  public platesAction: any[] = [];

  private _menuItemsSub: Subscription = new Subscription();
  private _platesSub: Subscription = new Subscription();
  private _categoriesSub: Subscription = new Subscription();
  private _pkmiCreateAllSub: Subscription = new Subscription();
  private readonly statuses: any[] = [];
  private _clonedPkmis: PlateMenuItem[] = [];
  private _draggedMenuItem: MenuItemExtended | null = null;

  constructor(private _i18nService: I18nService,
              private _plateMenuItemsService: PlateMenuItemsService,
              private _menuItemsService: MenuItemsService,
              private _datePipe: DatePipe,
              private _router: Router,
              private _categoryService: CategoryService,
              private _plateService: PlateService,
              private _messageService: MessageService) {

    this.i18n = _i18nService.instance;
    this.statuses = [
      {label: 'Todo', value: Status.Todo},
      {label: 'Progress', value: Status.Progress},
      {label: 'Done', value: Status.Done},
      {label: 'Cancelled', value: Status.Cancelled}
    ];
    this.form = new FormGroup({
      orderNumber: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")]),
      menuItem: new FormControl("", Validators.required),
      tableNumber: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")]),
      clientName: new FormControl("", Validators.required)
    });
  }

  ngOnInit(): void {
    this._categoriesSub = this._categoryService.getAll().subscribe(categoriesData => {
      this._menuItemsSub = this._menuItemsService.getAll().subscribe(data => {
        this.menuItems = data;
        this.menuItemsOptions = PlateMenuItemsService.getCategoryMenuItemTreeNodeOptions(categoriesData, data);
        this.categories = PlateMenuItemsService.getCategoryMenuItemTreeNodes(categoriesData, data);
      });
    });

    this._platesSub = this._plateService.getAll().subscribe((data: Plate[]) => {
      this.plates = data;
      this.platesOptions = [{
        code: null,
        name: 'Azzera',
        label: 'Azzera',
        value: null,
        color: 'transparent'
      }];
      this.platesOptions.push(...data.map(item => {
        return {
          code: item.id,
          name: item.name,
          label: item.name,
          value: item.name,
          color: item.color
        };
      }));
      this.platesAction = this.platesOptions.map(item => {
        return {
          label: item.name,
          command: () => {
            this.setPlate(item, this.selectedPlateMenuItems)
          }
        };
      });
    });
  }

  ngOnDestroy(): void {
    this._menuItemsSub.unsubscribe();
    this._platesSub.unsubscribe();
    this._categoriesSub.unsubscribe();
    this._pkmiCreateAllSub.unsubscribe();
  }

  savePkmis() {
    const formValue = this.form?.value;
    const newPkmis = this.plateMenuItems.map(item => {
      const pkmi: PlateMenuItem = {
        ...item,
        menuItem: {id: item.menuItem.id}
      };
      if (!!item.plate) {
        const pkmiPlate = this.platesOptions.find(plate => plate.name === item.plate);
        pkmi.plate = {
          id: pkmiPlate.code
        } as Plate;
      }
      pkmi.orderNumber = formValue.orderNumber;
      pkmi.clientName = formValue.clientName;
      pkmi.tableNumber = formValue.tableNumber;
      delete pkmi.id;
      return pkmi;
    });

    this._pkmiCreateAllSub = this._plateMenuItemsService.createAll(newPkmis).subscribe({
      next: data => {
        // fixme, @boz move logic inside the websocket notification subscription
        // data.forEach(pkmi => {
        //   if (pkmi.plate)
        //     this._plateQueueManagerService.sendToQueue(pkmi.plate?.name!, pkmi);
        //   else
        //     this._plateQueueManagerService.sendToQueue(PlateQueueManagerService.UNASSIGNED_QUEUE, pkmi);
        // });
        this._router.navigate(['/plate-menu-items']);
      },
      error: (errorResponse: HttpErrorResponse) => {
        const plateName: string = this.plates.find(p => p.id === (errorResponse.error as Error).causeId)?.name!;

        this._messageService.add({
          severity: 'error',
          summary: 'Errore Creazione',
          detail: `${plateName} è spenta o non disponibile, selezionare un\' altra piastra per l\'ordine`
        });
      }
    });
  }

  deleteSelectedProducts() {
    this.plateMenuItems = this.plateMenuItems.filter(val => !this.selectedPlateMenuItems.includes(val));
    this.form?.get('menuItem')?.setValue(this.plateMenuItems);
    this.selectedPlateMenuItems = [];
  }

  selectMenuItem(event: Event, item: MenuItemExtended) {
    event.stopPropagation();
    event.preventDefault();
    item.selected = true;

    this.categories.forEach(category => {
      category.menuItems?.forEach(mi => {
        if (mi.id !== item.id) {
          mi.selected = false;
        }
      });
    });

    this.plateMenuItems.push({
      id: PlateMenuItemsService.createFakeId(),
      menuItem: item,
      status: this.statuses[0].value
    } as PlateMenuItem);

    this.form?.get('menuItem')?.setValue(this.plateMenuItems);
  }

  onRowEditInit(pkmi: any) {
    this._clonedPkmis[pkmi.id] = {...pkmi};
  }

  onRowEditSave(pkmi: any) {
    delete this._clonedPkmis[pkmi.id];
  }

  onRowEditCancel(pkmi: any, index: number) {
    this.plateMenuItems[index] = this._clonedPkmis[pkmi.id];
    delete this._clonedPkmis[pkmi.id];
  }

  getCategoryColor(category: any): string {
    let color = 'transparent';
    if (category) {
      color = category.color;
    }
    return color;
  }

  getPlateColor(orderPlate: string): string {
    const plate = this.plates.find((item => item.name === orderPlate));
    return (plate && plate.color) ? plate.color : 'transparent';
  }

  setPlate(pkmiPlate: Plate, selectedPkmis: any[]) {
    if (selectedPkmis && selectedPkmis.length) {
      selectedPkmis.forEach(item => {
        const plate = this.plates.find(item => item.name === pkmiPlate.name);
        item.plate = (plate) ? plate.name : null;
      });
    }
  }

  dragStart(item: MenuItemExtended) {
    this._draggedMenuItem = item;
  }

  dragEnd() {
    this._draggedMenuItem = null;
  }

  drop() {
    if (this._draggedMenuItem) {
      this.plateMenuItems.push({
        id: PlateMenuItemsService.createFakeId(),
        menuItem: this._draggedMenuItem,
        status: this.statuses[0].value,
      } as PlateMenuItem);
      this.form?.get('menuItem')?.setValue(this.plateMenuItems);
      this._draggedMenuItem = null;
    }
  }
}
