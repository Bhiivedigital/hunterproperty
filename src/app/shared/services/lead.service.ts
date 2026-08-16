import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StrapiService } from './strapi.service';

export interface LeadPayload {
  fullName?: string;
  phone?: string;
  email?: string;
  message?: string;
  service?: string;
  location?: string;
  sourceForm: 'contactus' | 'requestquote' | 'pricing' | 'hero-lead-form' | 'lead-popup';
}

@Injectable({
  providedIn: 'root'
})
export class LeadService {

  constructor(private strapi: StrapiService) {}

  submit(lead: LeadPayload): Observable<unknown> {
    return this.strapi.post('leads', lead);
  }
}
