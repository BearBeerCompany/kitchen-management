import {TestBed} from '@angular/core/testing';

import {HttpRestConnectorService} from './http-rest-connector.service';

describe('HttpRestService', () => {
  let service: HttpRestConnectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpRestConnectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
