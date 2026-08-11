import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';
declare const bootstrap: any;

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
        fullName: ['', Validators.required],
        Phno: ['',Validators.required],
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
         let response = await emailjs.send("service_37vso18","template_wo2b83h",{
          fullName: this.form.value.fullName,
          Phno: this.form.value.Phno,
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
 ngAfterViewInit(): void {
    const navLinks = document.querySelectorAll('.nav-link');
    const offcanvasNavbar = document.getElementById('offcanvasNavbar');
    const offcanvasAnother = document.getElementById('offcanvasAnother');

    const offcanvas1 = offcanvasNavbar ? new bootstrap.Offcanvas(offcanvasNavbar) : null;
    const offcanvas2 = offcanvasAnother ? new bootstrap.Offcanvas(offcanvasAnother) : null;

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (offcanvas1) offcanvas1.hide();
        setTimeout(() => {
          if (offcanvas2) offcanvas2.show();
        }, 300); // slight delay to avoid backdrop conflict
      });
    });
  }
}
