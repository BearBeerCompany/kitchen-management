import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {OrdersService} from "../orders.service";
import {MenuItemsService} from "../menu-items.service";
import {TreeNode} from "primeng/api";
import {Subscription} from "rxjs";
import {I18nService} from "../../../services/i18n.service";
import {Category, MenuItem, MenuItemExtended} from "../order";
import {ApiConnector} from "../../../services/api-connector";
import {Plate} from "../../plates/plate/plate.model";
import {DatePipe} from "@angular/common";
import {Router} from "@angular/router";

@Component({
  selector: 'order-new',
  templateUrl: './order-new.component.html',
  styleUrls: ['./order-new.component.scss']
})
export class OrderNewComponent implements OnInit, OnDestroy {

  public readonly i18n: any;
  public form: FormGroup | undefined;
  public menuItemsNodes: TreeNode[] = [];
  public menuItems: MenuItemExtended[] = [];
  public categories: Category[] = [];
  public orders: any[] = [];
  public selectedOrders: any[] = [];
  public plates: Plate[] = [];
  public platesOptions: any[] = [];

  private menuItemsSub: Subscription = new Subscription();
  private platesSub: Subscription = new Subscription();
  private readonly statuses: any[] = [];
  private clonedOrders: any[] = [];

  constructor(private i18nService: I18nService, private ordersService: OrdersService,
              private menuItemsService: MenuItemsService, @Inject('ApiConnector') private apiConnector: ApiConnector,
              private datePipe: DatePipe, private router: Router) {
    this.i18n = i18nService.instance;
    this.statuses = [
      {label: 'Todo', value: 'todo'},
      {label: 'Progress', value: 'progress'},
      {label: 'Done', value: 'done'},
      {label: 'Cancelled', value: 'cancelled'}
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

    this.menuItemsSub = this.apiConnector.getMenuItems().subscribe(data => {
      this.menuItemsNodes = data;
      this.categories = data.map(node => {
        return {
          _id: node.data._id,
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
                description: node.data.description
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
              description: node.data.description
            },
            quantity: 0
          }
        });
      }).flat();
    });
    this.platesSub = this.apiConnector.getPlates().subscribe((data: Plate[]) => {
      this.plates = data;
      this.platesOptions = data.map(item => {
        return {
          name: item.name,
          label: item.name,
          code: item._id,
          value: item.name
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
      category: newOrder.menuItem.parent.data
    };
    for (let i = 0; i < newOrder.quantity; i++) {
      this.orders.push({
        _id: this.ordersService.createId(),
        orderId: newOrder.orderId,
        menuItem,
        status: this.statuses[0],
        notes: newOrder.notes,
        date: dateFormatted,
        plate: newOrder.plate
      });
    }
  }

  ngOnDestroy(): void {
    this.menuItemsSub.unsubscribe();
    this.platesSub.unsubscribe();
  }

  saveOrders() {
    this.orders.forEach(order => {
      const orderPlate = this.platesOptions.find(plate => plate.name === order.plate);
      order.plate = {
        name: orderPlate.name,
        code: orderPlate.code
      };
    });
    this.apiConnector.addOrders(this.orders).subscribe(() => {
      this.router.navigate(['/orders']);
    });
  }

  deleteSelectedProducts() {
    this.orders = this.orders.filter(val => !this.selectedOrders.includes(val));
    this.selectedOrders = [];
  }

  selectMenuItem(event: Event, item: MenuItemExtended) {
    event.stopPropagation();
    event.preventDefault();
    item.selected = true;

    this.categories.forEach(category => {
      category.menuItems?.forEach(mi => {
        if (mi._id !== item._id) {
          mi.selected = false;
        }
      });
    });

    const newOrder = this.form?.value;
    const date = new Date();
    const dateFormatted = this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss');
    this.orders.push({
      _id: this.ordersService.createId(),
      orderId: newOrder.orderId,
      menuItem: item,
      status: this.statuses[0],
      date: dateFormatted
    });
  }

  onRowEditInit(order: any) {
    this.clonedOrders[order._id] = {...order};
  }

  onRowEditSave(order: any) {
    // if (product.price > 0) {
      delete this.clonedOrders[order._id];
      // this.messageService.add({severity:'success', summary: 'Success', detail:'Product is updated'});
    // }
    // else {
      // this.messageService.add({severity:'error', summary: 'Error', detail:'Invalid Price'});
    // }
  }

  onRowEditCancel(order: any, index: number) {
    this.orders[index] = this.clonedOrders[order._id];
    delete this.clonedOrders[order._id];
  }

}
