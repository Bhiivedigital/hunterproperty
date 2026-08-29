import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeadService } from '../../../shared/services/lead.service';

@Component({
  selector: 'app-requestquote',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './requestquote.component.html',
  styleUrl: './requestquote.component.scss'
})
export class RequestquoteComponent {
  submitted = false;
  form: any;

  constructor(private formBuilder: FormBuilder, private leadService: LeadService) {}
  ngOnInit(): void {
    this.form = this.formBuilder.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        phoneNo: ['',[Validators.required, Validators.pattern("^[0-9]{10,13}$")]],
        message:['' ]
      },
      
    );
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  // onSubmit(): void {
  //   this.submitted = true;

  //   if (this.form.invalid) {
  //     return;
  //   }

  //   console.log(JSON.stringify(this.form.value, null, 2));
  // }

  async onSubmit() {
    this.submitted = true;

    // Stop submission if form is invalid
    if (this.form.invalid) {
      // alert("Please fill in all required fields correctly.");
      return;
    }

    const { stored, emailed } = await this.leadService.capture({
      fullName: `${this.form.value.firstName} ${this.form.value.lastName}`.trim(),
      phone: this.form.value.phoneNo,
      message: this.form.value.message,
      sourceForm: 'requestquote'
    });

    if (stored || emailed) {
      alert('Message sent successfully!');
      this.submitted = false;
      this.form.reset();
    } else {
      alert('Failed to send message. Please try again.');
    }
  }
}
