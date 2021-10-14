import { TestBed } from '@angular/core/testing';

import { CloudRetrievalService } from './cloud-retrieval.service';

describe('CloudRetrievalService', () => {
  let service: CloudRetrievalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CloudRetrievalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
