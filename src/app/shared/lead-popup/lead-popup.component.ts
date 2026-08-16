import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import emailjs from '@emailjs/browser';
import { LeadPopupService } from './lead-popup.service';
import { LeadService } from '../services/lead.service';

const SCROLL_TRIGGER_PX = 150;
const TIMER_TRIGGER_MS = 45000;

@Component({
  selector: 'app-lead-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lead-popup.component.html',
  styleUrl: './lead-popup.component.scss'
})
export class LeadPopupComponent implements OnInit {
  isVisible = false;
  submitted = false;
  sending = false;
  sendFailed = false;
  sendSucceeded = false;
  form!: FormGroup;

  services = [
    'Dream Home Construction',
    'Interior Design Solutions',
    'Property Legal Services',
    'Renovation & Remodeling',
    'Joint Development Projects',
    'Not sure yet'
  ];

  private isHomeRoute = true;
  private timerId: any;
  private autoTriggered = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private leadPopupService: LeadPopupService,
    private leadService: LeadService
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const path = event.urlAfterRedirects.split(/[?#]/)[0];
        this.isHomeRoute = path === '/' || path === '/home';
        if (!this.isHomeRoute) {
          this.closePopup();
        }
      }
    });

    this.leadPopupService.openRequested$.subscribe(() => this.openManually());
  }

  ngOnInit(): void {
    emailjs.init('Ib8KzPUHhor6Az9D2');

    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      location: ['', Validators.required],
      service: ['', Validators.required]
    });

    this.timerId = setTimeout(() => this.triggerPopup(), TIMER_TRIGGER_MS);
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  private triggerPopup(): void {
    if (this.autoTriggered || this.isVisible || !this.isHomeRoute || this.sendSucceeded) {
      return;
    }
    this.autoTriggered = true;
    this.isVisible = true;
  }

  openManually(): void {
    if (!this.isHomeRoute) {
      return;
    }
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.sendSucceeded = false;
    this.sendFailed = false;
    this.submitted = false;
    this.isVisible = true;
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (window.scrollY >= SCROLL_TRIGGER_PX) {
      this.triggerPopup();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isVisible) {
      this.closePopup();
    }
  }

  closePopup(): void {
    this.isVisible = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.sendFailed = false;

    if (this.form.invalid) {
      return;
    }

    this.sending = true;
    const { name, phone, location, service } = this.form.value;

    this.leadService.submit({
      fullName: name,
      phone,
      message: `Location: ${location} | Service: ${service}`,
      location,
      service,
      sourceForm: 'lead-popup'
    }).subscribe({ error: err => console.error('Strapi lead capture failed', err) });

    try {
      await emailjs.send('service_37vso18', 'template_wo2b83h', {
        fullName: name,
        Phno: phone,
        message: `Location: ${location} | Service: ${service}`
      });
      this.sending = false;
      this.sendSucceeded = true;
      setTimeout(() => this.closePopup(), 4000);
    } catch (error) {
      console.error('Popup lead send failed:', error);
      this.sending = false;
      this.sendFailed = true;
    }
  }

  retry(): void {
    this.sendFailed = false;
  }
}
