import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';

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

  constructor(private formBuilder: FormBuilder) {}
  ngOnInit(): void {
     emailjs.init('Ib8KzPUHhor6Az9D2');
    this.form = this.formBuilder.group(
      {
        firstName: ['', Validators.required],
        //lastName: ['', Validators.required],
        phoneNo: ['',Validators.required],
        email: ['', [Validators.required, Validators.email]],
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

    try {
         let response = await emailjs.send("service_wrsfjtp","template_0uxx83q",{
          firstName: this.form.value.firstName,
          //lastName: this.form.value.lastName,
          phoneNo: this.form.value.phoneNo,
          email: this.form.value.email,
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
