import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridJqComponent } from './grid-jq.component';

describe('GridJqComponent', () => {
  let component: GridJqComponent;
  let fixture: ComponentFixture<GridJqComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GridJqComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GridJqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
