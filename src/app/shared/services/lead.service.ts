import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import emailjs from '@emailjs/browser';
import { StrapiService } from './strapi.service';

/**
 * Single source of truth for the EmailJS account. Keeping these here (rather than
 * copy-pasted into every form) is what stops one form drifting onto a service or
 * template ID that no longer exists.
 */
export const EMAILJS_CONFIG = {
  publicKey: 'k-FIFrvIJC7s-s5dP',
  serviceId: 'service_b3xbtnw',
  templates: {
    // One template renders every form. `sourceForm` says which form it came from,
    // and unused fields render as "-", so there is no per-form template to drift.
    lead: 'template_f6siacg',
    contact: 'template_f6siacg'
  }
} as const;

export interface LeadPayload {
  fullName?: string;
  phone?: string;
  email?: string;
  message?: string;
  service?: string;
  location?: string;
  sourceForm: 'contactus' | 'requestquote' | 'pricing' | 'hero-lead-form' | 'lead-popup' | 'content-page' | 'pillar-page';
}

export interface LeadResult {
  /** Lead persisted to the CMS — this is what makes the enquiry recoverable. */
  stored: boolean;
  /** Notification email went out. Best-effort: failure here must not lose the lead. */
  emailed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LeadService {

  constructor(private strapi: StrapiService) {
    emailjs.init(EMAILJS_CONFIG.publicKey);
  }

  /**
   * Stores the lead, then sends the notification email. Both are attempted even if
   * the other fails, so an expired EmailJS/Gmail connection can never swallow an enquiry.
   */
  async capture(lead: LeadPayload, template: string = EMAILJS_CONFIG.templates.lead): Promise<LeadResult> {
    const [stored, emailed] = await Promise.all([
      firstValueFrom(this.strapi.post('leads', lead))
        .then(() => true)
        .catch(err => {
          console.error('Lead capture failed (CMS)', err);
          return false;
        }),
      emailjs.send(EMAILJS_CONFIG.serviceId, template, {
        fullName: lead.fullName || '-',
        Phno: lead.phone || '-',
        email: lead.email || '-',
        location: lead.location || '-',
        service: lead.service || '-',
        message: lead.message || '-',
        sourceForm: lead.sourceForm,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '-'
      })
        .then(() => true)
        .catch(err => {
          console.error('Lead notification failed (EmailJS)', err);
          return false;
        })
    ]);

    return { stored, emailed };
  }
}
