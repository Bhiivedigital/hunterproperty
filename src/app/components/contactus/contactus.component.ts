import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMAILJS_CONFIG, LeadService } from '../../shared/services/lead.service';

@Component({
  selector: 'app-contactus',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contactus.component.html',
  styleUrl: './contactus.component.scss'
})
export class ContactusComponent {

  submitted = false;
  form: any;

  constructor(private formBuilder: FormBuilder, private leadService: LeadService) {}
  ngOnInit(): void {
    this.form = this.formBuilder.group(
      {
        fullName: ['', Validators.required],
        Phno: ['',Validators.required],
        message:['']

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
      fullName: this.form.value.fullName,
      phone: this.form.value.Phno,
      message: this.form.value.message,
      sourceForm: 'contactus'
    }, EMAILJS_CONFIG.templates.contact);

    if (stored || emailed) {
      alert('Message sent successfully!');
      this.submitted = false;
      this.form.reset();
    } else {
      alert('Failed to send message. Please try again.');
    }
  }
}
