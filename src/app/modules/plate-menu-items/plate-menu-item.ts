import {Plate, PlateMenuItemAction} from "../plates/plate.interface";

/**
 * The plate - menu item association
 */
export interface PlateMenuItem {
  id?: string;
  orderNumber: number;
  menuItem: MenuItem;
  plate?: Plate | null;
  status: PlateMenuItemAction;
  takeAway?: boolean;
  createdDate: string | null;
  notes?: string;
  orderNotes?: string;
  clientName: string;
  tableNumber: string;
  source?: PlateMenuItemSource;
}

export interface MenuItem {
  id?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  externalId?: number;
  category?: Category;
}

export interface MenuItemExtended extends MenuItem {
  selected?: boolean;
}

export interface Category {
  id?: string;
  name: string;
  description?: string;
  color?: string;
  externalId?: number;
  menuItems?: MenuItemExtended[];
}

/**
 * Override of the category an item belongs to in this application with respect to the category it has
 * in the external GSG system. Applied during the GSG import; survives re-imports.
 *
 * All references use stable GSG external ids (Category.externalId / MenuItem.externalId), not Mongo ids.
 * Exactly one of {@link externalItemId} (item-level) or {@link sourceExternalCategoryId}
 * (category-level) must be set; item-level overrides take precedence over category-level ones.
 */
export interface CategoryMapping {
  id?: string;
  /** GSG Articolo.id (MenuItem.externalId) - item-level override. Mutually exclusive with sourceExternalCategoryId */
  externalItemId?: number;
  /** GSG Tipologia.id (Category.externalId) - category-level override. Mutually exclusive with externalItemId */
  sourceExternalCategoryId?: number;
  /** GSG Tipologia.id (Category.externalId) of the destination category */
  targetExternalCategoryId?: number;
  description?: string;
}

export enum CategoryMappingType {
  Item = "ITEM",
  Category = "CATEGORY"
}

export enum Status {
  Todo = "TODO",
  Progress = "PROGRESS",
  Done = "DONE",
  Cancelled = "CANCELLED"
}

export enum PlateMenuItemSource {
  Plates = "PLATES",
  Orders = "ORDERS"
}
