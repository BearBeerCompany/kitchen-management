import { Observable } from 'rxjs';

export interface CRUDService<T> {

    getAll(): Observable<Array<T>>;

    getById(id: string): Observable<T>;

    create(dto: T): Observable<T>;

    update(dto: T): Observable<T>;

    delete(id: string): Observable<boolean> | Observable<any>;

}
