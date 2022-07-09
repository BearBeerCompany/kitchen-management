import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {OrdersService} from "../orders.service";
import {MenuItemsService} from "../menu-items.service";
import {TreeNode} from "primeng/api";
import {Subscription} from "rxjs";
import {I18nService} from "../../../services/i18n.service";
import {MenuItem, Status} from "../order";
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
  public menuItems: TreeNode[] = [];
  public orders: any[] = [];
  public selectedOrders: any[] = [];
  public plates: Plate[] = [];
  public platesOptions: any[] = [];

  private menuItemsSub: Subscription = new Subscription();
  private platesSub: Subscription = new Subscription();

  constructor(private i18nService: I18nService, private ordersService: OrdersService,
              private menuItemsService: MenuItemsService, @Inject('ApiConnector') private apiConnector: ApiConnector,
              private datePipe: DatePipe, private router: Router) {
    this.i18n = i18nService.instance;
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      orderId: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")]),
      menuItem: new FormControl("", Validators.required),
      quantity: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")]),
      notes: new FormControl(""),
      plate: new FormControl(null)
    });

    // this.menuItemsSub = this.menuItemsService.getMenuItems().subscribe(data => this.menuItems = data);
    this.menuItemsSub = this.apiConnector.getMenuItems().subscribe(data => this.menuItems = data);
    this.platesSub = this.apiConnector.getPlates().subscribe((data: Plate[]) => {
      this.plates = data;
      this.platesOptions = data.map(item => {
        return { name: item.name, code: item._id };
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
        status: Status.Todo,
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
    // todo save orders
    console.log(this.orders);
    this.apiConnector.addOrders(this.orders).subscribe(() => {
      this.router.navigate(['/orders']);
    });
  }

  deleteSelectedProducts() {
    this.orders = this.orders.filter(val => !this.selectedOrders.includes(val));
    this.selectedOrders = [];
  }
}
