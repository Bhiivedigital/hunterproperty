import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import emailjs from '@emailjs/browser';
import { LeadService } from '../../../shared/services/lead.service';

@Component({
  selector: 'app-hero-lead-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './hero-lead-form.component.html',
  styleUrl: './hero-lead-form.component.scss'
})
export class HeroLeadFormComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  sending = false;
  sendFailed = false;
  sendSucceeded = false;

  constructor(private formBuilder: FormBuilder, private leadService: LeadService) {}

  ngOnInit(): void {
    emailjs.init('Ib8KzPUHhor6Az9D2');
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      consent: [false, Validators.requiredTrue]
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.sendFailed = false;

    if (this.form.invalid) {
      return;
    }

    this.sending = true;
    const { name, phone, pincode } = this.form.value;

    this.leadService.submit({
      fullName: name,
      phone,
      message: `Pincode: ${pincode}`,
      location: pincode,
      sourceForm: 'hero-lead-form'
    }).subscribe({ error: err => console.error('Strapi lead capture failed', err) });

    try {
      await emailjs.send('service_37vso18', 'template_wo2b83h', {
        fullName: name,
        Phno: phone,
        message: `Pincode: ${pincode}`
      });
      this.sending = false;
      this.sendSucceeded = true;
      this.submitted = false;
      this.form.reset();
    } catch (error) {
      console.error('Hero form send failed:', error);
      this.sending = false;
      this.sendFailed = true;
    }
  }
}
