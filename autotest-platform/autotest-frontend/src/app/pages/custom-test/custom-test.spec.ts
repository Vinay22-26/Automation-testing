import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomTest } from './custom-test';

describe('CustomTest', () => {
  let component: CustomTest;
  let fixture: ComponentFixture<CustomTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomTest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomTest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
