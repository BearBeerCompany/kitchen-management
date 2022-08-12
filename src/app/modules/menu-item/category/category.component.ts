import {Component, OnInit} from '@angular/core';
import {CategoryService} from "../../plate-menu-items/services/category.service";
import {Observable, of} from "rxjs";
import {Category} from "../../plate-menu-items/plate-menu-item";

@Component({
  selector: 'category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {

  public categories$: Observable<Category[]> = of([]);

  constructor(private _categoryService: CategoryService) { }

  ngOnInit(): void {
    this.categories$ = this._categoryService.getAll();
  }

}
