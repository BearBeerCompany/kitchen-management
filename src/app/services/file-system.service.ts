import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileSystemService {


  constructor() {

  }

  public writeFile(): any {
    fs.fileAdd();
  }
}
