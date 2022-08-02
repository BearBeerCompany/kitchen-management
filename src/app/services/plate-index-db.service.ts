import {Injectable} from '@angular/core';
import {DBSchema, IDBPDatabase, openDB} from 'idb';
import {Order} from "../modules/orders/order";

interface PlateDBSchema extends DBSchema {
  "plate": {
    key: string;
    value: Order[];
  }
}

@Injectable({
  providedIn: 'root'
})
export class PlateIndexDbService {

  public async insert(name: string, orders?: Order[] | null): Promise<void> {
    const db: IDBPDatabase<PlateDBSchema> = await this._getConnection();

    await db.put('plate', orders ?? [], name);
  }

  public async findByKey(name: string): Promise<Order[] | undefined> {
    const db: IDBPDatabase<PlateDBSchema> = await this._getConnection();

    return await db.get('plate', name);
  }

  public async findAll(): Promise<string[]> {
    const db: IDBPDatabase<PlateDBSchema> = await this._getConnection();

    return await db.getAllKeys('plate');
  }

  public async delete(name: string): Promise<void> {
    const db: IDBPDatabase<PlateDBSchema> = await this._getConnection();

    return await db.delete('plate', name);
  }

  public async exist(name: string): Promise<boolean> {
    return await this.findByKey(name) != undefined
  }

  private _getConnection(): Promise<IDBPDatabase<PlateDBSchema>> {
    return openDB<PlateDBSchema>('plate-store', 1, {
      upgrade(db) {
        db.createObjectStore('plate');
      },
    });
  }
}

