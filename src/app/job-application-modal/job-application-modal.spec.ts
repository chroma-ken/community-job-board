import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobApplicationModal } from './job-application-modal';

describe('JobApplicationModal', () => {
  let component: JobApplicationModal;
  let fixture: ComponentFixture<JobApplicationModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobApplicationModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobApplicationModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
