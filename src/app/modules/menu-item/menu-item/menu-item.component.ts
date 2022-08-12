import {Component, OnInit} from '@angular/core';
import {WebSocketService} from 'src/app/services/web-socket-service';
import {CategoryService} from "../../plate-menu-items/services/category.service";
import {Observable, of} from "rxjs";
import {Category, MenuItem} from "../../plate-menu-items/plate-menu-item";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {I18nService} from "../../../services/i18n.service";

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
  public categoryDisplay: boolean = false;
  public isEdit: boolean = false;

  constructor(private _categoryService: CategoryService,
              private _i18nService: I18nService) {
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
  }

  public onCategorySelect(category: Category) {
    this.items$ = this._categoryService.getItemsByCategoryId(category.id!);
    this.selectedCategory = category;
  }

  public onCategorySubmit(): void {
    this._getFormCallback()
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

  private _getFormCallback(): Observable<Category> {
    return this.isEdit
      ? this._categoryService.update(this.categoryForm?.value)
      : this._categoryService.create(this.categoryForm?.value);
  }
}
