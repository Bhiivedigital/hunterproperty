import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
import { Event, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { CommonModule } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
   animations: [
    trigger('popupAnimation', [
      state('hidden', style({
        opacity: 0,
        transform: 'translateY(50px)',
        display: 'none'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0)',
        display: 'block'
      })),
      transition('hidden => visible', [
        style({ display: 'block' }),
        animate('600ms ease-in-out')
      ]),
      transition('visible => hidden', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(50px)' }))
      ])
    ])
  ]
})

export class AppComponent {
  title = 'hunterproperty';
  isPopupVisible = false;
  private popupShown = false;
  isLoading = false;
constructor(private router: Router, private formBuilder: FormBuilder) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // Add a short delay for better user experience
        setTimeout(() => {
          this.isLoading = false;
        }, 1000);
      }
    });

    
  }
 
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollPosition = window.pageYOffset;
    if (scrollPosition > 500 && !this.popupShown) {
      this.popupShown = true;
      setTimeout(() => {
        this.isPopupVisible = true;
      }, 4000); // 4 seconds delay
    }
  }


  hidePopup() {
    this.isPopupVisible = false;
  }

  
    submitted = false;
    form: any;
  
   
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
}
