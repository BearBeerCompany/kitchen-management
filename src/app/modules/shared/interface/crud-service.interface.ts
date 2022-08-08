import { Observable } from 'rxjs';

export interface CRUDService<T> {

    getAll(parentId?: number): Observable<Array<T>>;

    getById(id: number, parentId?: number): Observable<T>;

    create(dto: T, parentId?: number): Observable<T>;

    update(dto: T, parentId?: number): Observable<T>;

    delete(id: number, parentId?: number): Observable<boolean> | Observable<any>;
    
}