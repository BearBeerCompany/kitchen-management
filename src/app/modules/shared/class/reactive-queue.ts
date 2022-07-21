import {Observable, of} from "rxjs";

export class ReactiveQueue<T> {
  private readonly items: T[];

  constructor(items?: T[]) {
    this.items = items ?? [];
  }

  get dequeue(): T | undefined {
    return this.items.shift();
  }

  get count$(): Observable<number> {
    return of(this.items.length)
  }

  get values(): T[] {
    return this.items;
  }

  set values(items: T[]) {
    this.items.length = 0;
    this.items.push(...items);
  }

  get values$(): Observable<T[]> {
    return of(this.items);
  }

  get isEmpty$(): Observable<boolean> {
    return of(this.items == null || this.items.length == 0);
  }

  public enqueue(value: T): void {
    this.values.push(value);
  }
}
