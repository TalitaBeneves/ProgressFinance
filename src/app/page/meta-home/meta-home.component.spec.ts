/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaHomeComponent } from './meta-home.component';

describe('MetaHomeComponent', () => {
  let component: MetaHomeComponent;
  let fixture: ComponentFixture<MetaHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MetaHomeComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetaHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
