import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CategoryService} from "../../plate-menu-items/services/category.service";
import {Observable, of} from "rxjs";
import {Category} from "../../plate-menu-items/plate-menu-item";

@Component({
  selector: 'category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent {

  @Input() public categories$: Observable<Category[]> = of([]);

  @Output() public selected: EventEmitter<Category> = new EventEmitter<Category>(false);
  @Output() public create: EventEmitter<void> = new EventEmitter<void>(false);

  public activeCategory?: string;

  public onCategoryClick(category: Category) {
    this.activeCategory = category.id;
    this.selected.emit(category);
  }
}
