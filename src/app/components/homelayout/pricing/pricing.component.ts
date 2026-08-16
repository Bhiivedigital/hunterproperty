import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';
import { LeadService } from '../../../shared/services/lead.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss'
})
export class PricingComponent {
submitted = false;
  form: any;

  constructor(private formBuilder: FormBuilder, private leadService: LeadService) {}
  ngOnInit(): void {
     emailjs.init('Ib8KzPUHhor6Az9D2');
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

    this.leadService.submit({
      fullName: this.form.value.fullName,
      phone: this.form.value.Phno,
      message: this.form.value.message,
      sourceForm: 'pricing'
    }).subscribe({ error: err => console.error('Strapi lead capture failed', err) });

    try {
         let response = await emailjs.send("service_37vso18","template_wo2b83h",{
          fullName: this.form.value.fullName,
          Phno: this.form.value.Phno,
          message: this.form.value.message
          });
      console.log("Email sent successfully!", response);
      alert('Message sent successfully!');
      this.submitted = false;
      this.form.reset();
    } catch (error) {
      console.error("Email sending failed:", error);
      alert('Failed to send message. Please try again.');
    }
  }
}
