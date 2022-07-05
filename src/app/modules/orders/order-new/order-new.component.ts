import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {OrdersService} from "../orders.service";
import {MenuItemsService} from "../menu-items.service";
import {TreeNode} from "primeng/api";
import {Subscription} from "rxjs";
import {I18nService} from "../../../services/i18n.service";

@Component({
  selector: 'order-new',
  templateUrl: './order-new.component.html',
  styleUrls: ['./order-new.component.scss']
})
export class OrderNewComponent implements OnInit, OnDestroy {

  public readonly i18n: any;
  public form: FormGroup | undefined;
  public menuItems: TreeNode[] = [];

  private menuItemsSub: Subscription = new Subscription();

  constructor(private i18nService: I18nService, private ordersService: OrdersService, private menuItemsService: MenuItemsService) {
    this.i18n = i18nService.instance;
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      orderId: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")]),
      menuItem: new FormControl("", Validators.required),
      quantity: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")]),
      notes: new FormControl("")
    });

    this.menuItemsSub = this.menuItemsService.getMenuItems().subscribe(data => this.menuItems = data);
  }

  onSubmit() {
    console.log(this.form?.value);
  }

  ngOnDestroy(): void {
    this.menuItemsSub.unsubscribe();
  }

}
