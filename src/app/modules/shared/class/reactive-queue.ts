import {BehaviorSubject, Observable, of} from "rxjs";

export class ReactiveQueue<T> {
  private items$: BehaviorSubject<T[]>;

  constructor(items?: T[]) {
    this.items$ = new BehaviorSubject<T[]>(items ?? []);
  }

  get dequeue(): T | undefined {
    return this.items$.getValue().shift();
  }

  get count(): Observable<number> {
    return of(this.items$.getValue().length)
  }

  get values(): T[] {
    return this.items$.getValue();
  }

  get values$(): Observable<T[]> {
    return of(this.items$.getValue());
  }

  get isEmpty(): Observable<boolean> {
    return of(this.items$.getValue() == null || this.items$.getValue().length == 0);
  }

  public enqueue(value: T): void {
    this.values.push(value);
  }
}
