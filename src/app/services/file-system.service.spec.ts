import {TestBed} from '@angular/core/testing';

import {FileSystemConnectorService} from './file-system-connector.service';

describe('FileSystemService', () => {
  let service: FileSystemConnectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileSystemConnectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
