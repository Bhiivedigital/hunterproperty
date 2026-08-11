import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

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

  goToWhatsApp(): void {
  const phoneNumber = '7550110784'; // Use international format, no + or spaces
  const url = `https://wa.me/${phoneNumber}`;
  window.open(url, '_blank');
}
callNow(): void {
  const phoneNumber = '7550110784'; // Include country code if needed
  window.location.href = `tel:${phoneNumber}`;
}

}
