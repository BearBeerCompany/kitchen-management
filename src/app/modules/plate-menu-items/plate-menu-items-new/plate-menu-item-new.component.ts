import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {PlateMenuItemsService} from "../services/plate-menu-items.service";
import {MenuItemsService} from "../services/menu-items.service";
import {TreeNode} from "primeng/api";
import {Subscription} from "rxjs";
import {I18nService} from "../../../services/i18n.service";
import {Category, MenuItem, MenuItemExtended, PlateMenuItem, Status} from "../plate-menu-item";
import {ApiConnector} from "../../../services/api-connector";
import {DatePipe} from "@angular/common";
import {Router} from "@angular/router";
import {PlateQueueManagerService} from "../../plates/services/plate-queue-manager.service";
import {Plate} from "../../plates/plate.interface";

@Component({
  selector: 'plate-menu-items-new',
  templateUrl: './plate-menu-item-new.component.html',
  styleUrls: ['./plate-menu-item-new.component.scss']
})
export class PlateMenuItemNewComponent implements OnInit, OnDestroy {

  public readonly i18n: any;
  public form: FormGroup | undefined;
  public menuItemsNodes: TreeNode[] = [];
  public menuItems: MenuItemExtended[] = [];
  public categories: Category[] = [];
  public plateMenuItems: PlateMenuItem[] = [];
  public selectedPlateMenuItems: PlateMenuItem[] = [];
  public plates: Plate[] = [];
  public platesOptions: any[] = [];
  public platesAction: any[] = [];

  private menuItemsSub: Subscription = new Subscription();
  private platesSub: Subscription = new Subscription();
  private readonly statuses: any[] = [];
  private clonedPkmis: PlateMenuItem[] = [];
  private draggedMenuItem: MenuItemExtended | null = null;

  constructor(private _i18nService: I18nService,
              private _plateMenuItemsService: PlateMenuItemsService,
              private _menuItemsService: MenuItemsService,
              @Inject('ApiConnector') private _apiConnector: ApiConnector,
              private datePipe: DatePipe,
              private router: Router,
              private _plateQueueManagerService: PlateQueueManagerService) {
    this.i18n = _i18nService.instance;
    this.statuses = [
      {label: 'Todo', value: Status.Todo},
      {label: 'Progress', value: Status.Progress},
      {label: 'Done', value: Status.Done},
      {label: 'Cancelled', value: Status.Cancelled}
    ];
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      orderId: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")]),
      menuItem: new FormControl("", Validators.required),
      quantity: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")]),
      notes: new FormControl(""),
      plate: new FormControl(null)
    });

    this.menuItemsSub = this._apiConnector.getMenuItems().subscribe(data => {
      this.menuItemsNodes = data;
      this.categories = data.map(node => {
        return {
          id: node.data._id,
          name: node.data.name,
          description: node.data.description,
          menuItems: node.children.map((child: any) => {
            return {
              _id: child.data._id,
              name: child.data.name,
              description: child.data.description,
              category: {
                _id: node.data._id,
                name: node.data.name,
                description: node.data.description,
                color: node.data.color
              },
              quantity: 0
            }
          })
        }
      });

      this.menuItems = data.map(node => {
        return node.children.map((child: any) => {
          return {
            _id: child.data._id,
            name: child.data.name,
            description: child.data.description,
            category: {
              _id: node.data._id,
              name: node.data.name,
              description: node.data.description,
              color: node.data.color
            },
            quantity: 0
          }
        });
      }).flat();
    });
    this.platesSub = this._apiConnector.getPlates().subscribe((data: Plate[]) => {
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
          code: item.name,
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

  onSubmit() {
    console.log(this.form?.value);
    const newOrder = this.form?.value;
    const date = new Date();
    const dateFormatted = this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss');

    let menuItem: MenuItem = {
      ...newOrder.menuItem.data,
      categoryId: newOrder.menuItem.parent.data.id
    };
    for (let i = 0; i < newOrder.quantity; i++) {
      this.plateMenuItems.push({
        id: this._plateMenuItemsService.createId(),
        orderNumber: newOrder.orderId,
        menuItem,
        status: this.statuses[0],
        notes: newOrder.notes,
        date: dateFormatted,
        plate: newOrder.plate,
        clientName: '', // todo
        tableNumber: 0, // todo
      });
    }
  }

  ngOnDestroy(): void {
    this.menuItemsSub.unsubscribe();
    this.platesSub.unsubscribe();
  }

  saveOrders() {
    this.plateMenuItems.forEach(order => {
      if (!!order.plate) {
        const orderPlate = this.platesOptions.find(plate => plate.name === order.plate);
        // override order.plate
        order.plate = {
          _id: orderPlate.code,
          name: orderPlate.name
        } as Plate;
      }
    });
    this._apiConnector.addOrders(this.plateMenuItems).subscribe(() => {
      this.plateMenuItems.forEach(order => {
        if (order.plate)
          this._plateQueueManagerService.sendToQueue(order.plate?.name!, order);
        else
          this._plateQueueManagerService.sendToQueue(PlateQueueManagerService.UNASSIGNED_QUEUE, order);
      });
      this.router.navigate(['/plate-menu-items']);
    });
  }

  deleteSelectedProducts() {
    this.plateMenuItems = this.plateMenuItems.filter(val => !this.selectedPlateMenuItems.includes(val));
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

    const newOrder = this.form?.value;
    const date = new Date();
    const dateFormatted = this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss');
    this.plateMenuItems.push({
      id: this._plateMenuItemsService.createId(),
      orderNumber: newOrder.orderId,
      menuItem: item,
      status: this.statuses[0].value,
      date: dateFormatted,
      clientName: '', // todo
      tableNumber: 0, // todo
    });
  }

  onRowEditInit(order: any) {
    this.clonedPkmis[order._id] = {...order};
  }

  onRowEditSave(order: any) {
    delete this.clonedPkmis[order._id];
  }

  onRowEditCancel(order: any, index: number) {
    this.plateMenuItems[index] = this.clonedPkmis[order._id];
    delete this.clonedPkmis[order._id];
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

  setPlate(orderPlate: Plate, selectedOrders: any[]) {
    if (selectedOrders && selectedOrders.length) {
      selectedOrders.forEach(order => {
        const plate = this.plates.find(item => item.name === orderPlate.name);
        order.plate = (plate) ? plate.name : null;
      });
    }
  }

  dragStart(item: MenuItemExtended) {
    this.draggedMenuItem = item;
  }

  dragEnd() {
    this.draggedMenuItem = null;
  }

  drop() {
    if (this.draggedMenuItem) {
      const newPkmi = this.form?.value;
      const date = new Date();
      const dateFormatted = this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss');
      this.plateMenuItems.push({
        id: this._plateMenuItemsService.createId(),
        orderNumber: newPkmi.orderNumber,
        menuItem: this.draggedMenuItem,
        status: this.statuses[0].value,
        date: dateFormatted,
        clientName: '', // todo
        tableNumber: 0, // todo
      });
      this.draggedMenuItem = null;
    }
  }
}
