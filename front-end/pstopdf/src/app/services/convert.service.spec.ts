import { TestBed } from '@angular/core/testing';

import { ConvertService } from '../services/convert.service';

describe('ConvertService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ConvertService = TestBed.get(ConvertService);
    expect(service).toBeTruthy();
  });
});
