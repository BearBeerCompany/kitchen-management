import {AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {CategoryService} from "../../plate-menu-items/services/category.service";
import {Observable, of} from "rxjs";
import {Category} from "../../plate-menu-items/plate-menu-item";

@Component({
  selector: 'category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnChanges {

  @Input() public categories: Category[] = [];
  @Input() public active?: Category;

  @Output() public selected: EventEmitter<Category> = new EventEmitter<Category>(false);
  @Output() public create: EventEmitter<void> = new EventEmitter<void>(false);

  public activeCategory?: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.categories?.length > 0) {
      this.onCategoryClick(this.active == null ? this.categories[0] : this.active);
    }
  }

  public onCategoryClick(category: Category) {
    this.activeCategory = category.id;
    this.selected.emit(category);
  }
}
