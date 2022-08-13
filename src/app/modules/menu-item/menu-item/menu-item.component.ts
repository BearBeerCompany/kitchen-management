import {Component, OnInit} from '@angular/core';
import {CategoryService} from "../../plate-menu-items/services/category.service";
import {Observable, of} from "rxjs";
import {Category, MenuItem} from "../../plate-menu-items/plate-menu-item";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {I18nService} from "../../../services/i18n.service";
import {MenuItemsService} from "../../plate-menu-items/services/menu-items.service";

@Component({
  selector: 'menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss']
})
export class MenuItemComponent implements OnInit {

  public readonly i18n: any;

  public categories$: Observable<Category[]> = of([]);
  public items$: Observable<MenuItem[]> = of([]);
  public selectedCategory?: Category;
  public categoryForm?: FormGroup | undefined;
  public menuItemForm?: FormGroup | undefined;
  public categoryDisplay: boolean = false;
  public menuItemDisplay: boolean = false;
  public isEdit: boolean = false;

  constructor(private _categoryService: CategoryService,
              private _i18nService: I18nService,
              private _menuItemsService: MenuItemsService) {
    this.i18n = _i18nService.instance;
  }

  ngOnInit(): void {
    this.categories$ = this._categoryService.getAll();

    this.categoryForm = new FormGroup({
      name: new FormControl("", Validators.required),
      description: new FormControl("", Validators.required),
      color: new FormControl("", Validators.required),
      id: new FormControl(null)
    });

    this.menuItemForm = new FormGroup({
      name: new FormControl("", Validators.required),
      description: new FormControl("", Validators.required),
      id: new FormControl(null),
      categoryId: new FormControl(null)
    });
  }

  public onCategorySelect(category: Category) {
    this.items$ = this._categoryService.getItemsByCategoryId(category.id!);
    this.selectedCategory = category;
  }

  public onCategorySubmit(): void {
    this._getFormCallback("category")
      .subscribe(_ => this._categoryService.getAll()
        .subscribe(
          (response: Category[]) => {
            this.categories$ = of(response);
            this.categoryDisplay = false;
            this.isEdit = false;
            this.selectedCategory = undefined;
          })
      );
  }

  public discardCategoryForm(): void {
    this.categoryForm?.reset();
    this.categoryDisplay = false;
  }

  public onCategoryCreate(): void {
    this.categoryForm?.reset();
    this.categoryDisplay = true;
  }

  public deleteCategory(): void {
    this._categoryService.delete(this.selectedCategory?.id!)
      .subscribe(_ => this._categoryService.getAll()
        .subscribe(
          (response: Category[]) => {
            this.selectedCategory = undefined;
            this.categories$ = of(response);
          })
      );
  }

  public editCategory(): void {
    this.categoryForm!.get('name')?.setValue(this.selectedCategory?.name);
    this.categoryForm!.get('description')?.setValue(this.selectedCategory?.description);
    this.categoryForm!.get('color')?.setValue(this.selectedCategory?.color);
    this.categoryForm!.get('id')?.setValue(this.selectedCategory?.id);
    this.categoryDisplay = true;
    this.isEdit = true;
  }

  public discardMenuItemForm(): void {
    this.menuItemForm?.reset();
    this.menuItemDisplay = false;
  }

  public onMenuItemSubmit(): void {
    this._getFormCallback("item")
      .subscribe(_ => this._categoryService.getItemsByCategoryId(this.selectedCategory?.id!)
        .subscribe(
          (response: MenuItem[]) => {
            this.items$ = of(response);
            this.menuItemDisplay = false;
            this.isEdit = false;
          })
      );
  }

  public onMenuItemCreate(): void {
    this.menuItemForm?.reset();
    this.menuItemForm?.get("categoryId")?.setValue(this.selectedCategory?.id);
    this.menuItemDisplay = true;
  }

  private _getFormCallback(type: FormType): Observable<Category | MenuItem> {
    switch (type) {
      case "category":
        return this.isEdit
          ? this._categoryService.update(this.categoryForm?.value)
          : this._categoryService.create(this.categoryForm?.value);
      case "item":
        return this.isEdit
          ? this._menuItemsService.update(this.menuItemForm?.value)
          : this._menuItemsService.create(this.menuItemForm?.value);
      default:
        throw new Error("Wrong form configuration");
    }
  }

  public onMenuItemEdit(item: MenuItem): void {
    this.isEdit = true;
    this.menuItemForm?.get("categoryId")?.setValue(this.selectedCategory?.id);
    this.menuItemForm?.get("name")?.setValue(item.name);
    this.menuItemForm?.get("description")?.setValue(item.description);
    this.menuItemForm?.get("id")?.setValue(item.id);
    this.onMenuItemSubmit();
  }

  public onMenuItemDelete(item: MenuItem): void {
    this._menuItemsService.delete(item.id!)
      .subscribe(_ => this._categoryService.getItemsByCategoryId(this.selectedCategory?.id!)
        .subscribe(
          (response: MenuItem[]) => {
            this.items$ = of(response);
          })
      );
  }
}

type FormType = 'category' | 'item';
