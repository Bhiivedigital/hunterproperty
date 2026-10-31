import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BotActionKind, BotReply, ChatbotEngine, CONTACT, Kb } from './chatbot-engine';
import { LeadService } from '../services/lead.service';

interface ChatMessage {
  from: 'bot' | 'user';
  text?: string;
  reply?: BotReply;
  /** The inline callback form, shown in place of a bot message. */
  leadForm?: boolean;
}

const TEASER_KEY = 'hp-chat-teaser-seen';

const SERVICES = [
  'Dream Home Construction',
  'Interior Design Solutions',
  'Property Legal Services',
  'Renovation & Remodeling',
  'Joint Development Projects',
  'Not sure yet'
];

/**
 * Homepage chat assistant. Loaded with `@defer (on idle)` from the homepage,
 * so it costs nothing on first paint and is never part of the prerendered HTML.
 * Answers come from ChatbotEngine; anything about money, or anything it can't
 * answer, ends in a way to reach the team: WhatsApp, a call, email, or a
 * callback request that is saved as a lead exactly like the site's other forms.
 */
@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent {
  @ViewChild('scroller') scroller?: ElementRef<HTMLElement>;
  @ViewChild('input') inputRef?: ElementRef<HTMLInputElement>;

  open = false;
  showTeaser = false;
  typing = false;
  draft = '';
  messages: ChatMessage[] = [];

  readonly services = SERVICES;
  readonly contact = CONTACT;
  lead = { name: '', phone: '', location: '', service: SERVICES[0] };
  leadSubmitted = false;
  leadSending = false;
  leadDone = false;
  leadFailed = false;

  private engine = new ChatbotEngine();
  private kbRequested = false;
  private lastQuestion = '';
  private lastService = '';

  constructor(private http: HttpClient, private leadService: LeadService) {
    // A one-line hello a few seconds after the page settles, once per visit.
    if (!sessionStorage.getItem(TEASER_KEY)) {
      setTimeout(() => { if (!this.open) this.showTeaser = true; }, 6000);
    }
  }

  dismissTeaser(): void {
    this.showTeaser = false;
    sessionStorage.setItem(TEASER_KEY, '1');
  }

  toggle(): void {
    this.open = !this.open;
    if (this.showTeaser) this.dismissTeaser();
    if (!this.open) return;
    this.track('chatbot_open');
    if (!this.kbRequested) {
      this.kbRequested = true;
      this.http.get<Kb>('/chatbot/kb.json').subscribe({ next: kb => this.engine.setKb(kb), error: () => {} });
    }
    if (!this.messages.length) this.messages.push({ from: 'bot', reply: this.engine.greeting() });
    setTimeout(() => this.inputRef?.nativeElement.focus(), 50);
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.open = false;
  }

  send(text = this.draft): void {
    const question = text.trim();
    if (!question || this.typing) return;
    this.draft = '';
    this.lastQuestion = question;
    this.messages.push({ from: 'user', text: question });
    this.typing = true;
    this.scrollDown();
    // A short pause reads as a reply rather than an instant canned response.
    setTimeout(() => {
      const reply = this.engine.reply(question);
      if (reply.service) this.lastService = reply.service;
      this.typing = false;
      this.messages.push({ from: 'bot', reply });
      this.track('chatbot_question');
      this.scrollDown();
    }, 450);
  }

  // --- actions -----------------------------------------------------------------------

  whatsappUrl(): string {
    const text = `Hi Hunter Property, ${this.lastQuestion || 'I would like to know more about building a house.'}`;
    return `${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
  }

  mailto(): string {
    const body = this.lastQuestion ? `Question: ${this.lastQuestion}\n\n` : '';
    return `mailto:${CONTACT.email}?subject=${encodeURIComponent('Enquiry from website chat')}&body=${encodeURIComponent(body)}`;
  }

  onAction(kind: BotActionKind): void {
    this.track(`chatbot_${kind}`);
    if (kind === 'lead') this.showLeadForm();
  }

  showLeadForm(): void {
    if (this.leadDone) {
      this.messages.push({ from: 'bot', reply: { text: ['We already have your details and will call you shortly. You can also reach us right away:'], actions: ['whatsapp', 'call'] } });
    } else {
      this.messages = this.messages.filter(m => !m.leadForm);
      if (this.lastService) this.lead.service = this.lastService;
      this.messages.push({ from: 'bot', leadForm: true });
    }
    this.scrollDown();
  }

  get phoneValid(): boolean {
    return /^[6-9]\d{9}$/.test(this.lead.phone.replace(/\D/g, '').slice(-10));
  }

  async submitLead(): Promise<void> {
    this.leadSubmitted = true;
    if (!this.lead.name.trim() || !this.phoneValid || !this.lead.location.trim() || this.leadSending) return;
    this.leadSending = true;
    this.leadFailed = false;
    const asked = this.messages.filter(m => m.from === 'user').slice(-4).map(m => `- ${m.text}`).join('\n');
    const { stored, emailed } = await this.leadService.capture({
      fullName: this.lead.name.trim(),
      phone: this.lead.phone.replace(/\D/g, '').slice(-10),
      location: this.lead.location.trim(),
      service: this.lead.service,
      message: asked ? `Asked the website chat:\n${asked}` : 'Callback requested from the website chat',
      sourceForm: 'chatbot'
    });
    this.leadSending = false;
    if (stored || emailed) {
      this.leadDone = true;
      this.messages = this.messages.filter(m => !m.leadForm);
      this.messages.push({ from: 'bot', reply: { text: [`Thank you, ${this.lead.name.trim()}! Our team will call you on ${this.lead.phone} shortly (Sunday to Friday, 8 AM to 10 PM).`] } });
      this.track('generate_lead');
      this.scrollDown();
    } else {
      this.leadFailed = true;
    }
  }

  isInternal(url: string): boolean {
    return url.startsWith('/');
  }

  /** '/#pricing' -> path '/' and fragment 'pricing', for routerLink. */
  path(url: string): string {
    return url.split('#')[0] || '/';
  }

  fragment(url: string): string | undefined {
    return url.split('#')[1];
  }

  private scrollDown(): void {
    setTimeout(() => {
      const el = this.scroller?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  private track(event: string): void {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    gtag?.('event', event, { event_category: 'chatbot' });
  }
}
