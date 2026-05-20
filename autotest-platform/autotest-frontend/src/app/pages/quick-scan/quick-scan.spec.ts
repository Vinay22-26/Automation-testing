import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickScan } from './quick-scan';

describe('QuickScan', () => {
  let component: QuickScan;
  let fixture: ComponentFixture<QuickScan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickScan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickScan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
