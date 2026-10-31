import { AREAS, Area } from '../seo/areas';
import { BUSINESS, PACKAGES } from '../seo/business';

/**
 * The homepage assistant's brain. No AI service and no running cost: every
 * answer comes from the site's own content. Contact details, packages and areas
 * come from shared/seo; the package specifications, FAQs and guide pages come
 * from /chatbot/kb.json, which scripts/build-chatbot-kb.mjs writes on each
 * build. A question it can't answer from that content is handed to a person
 * (WhatsApp, call, email or a callback request) rather than guessed at.
 */

export interface KbPackage {
  name: string;
  price: number;
  sections: { title: string; items: string[] }[];
}

export interface Kb {
  packages: KbPackage[];
  faqs: { q: string; a: string; url: string }[];
  pages: { title: string; url: string; text: string }[];
}

export type BotActionKind = 'whatsapp' | 'call' | 'email' | 'lead';

export interface BotReply {
  /** Paragraphs; plain text. */
  text: string[];
  /** Bulleted lines under the text. */
  list?: string[];
  /** A closing line, shown after the list. */
  note?: string;
  links?: { label: string; url: string }[];
  actions?: BotActionKind[];
  chips?: string[];
  /** The service the visitor seems to want, for the lead record. */
  service?: string;
}

const PHONE_DIGITS = BUSINESS.telephone.replace(/\D/g, '');
export const CONTACT = {
  whatsapp: `https://wa.me/${PHONE_DIGITS}`,
  tel: `tel:+${PHONE_DIGITS}`,
  telLabel: BUSINESS.telephone,
  email: BUSINESS.email
};

export const STARTER_CHIPS = ['House construction cost', 'What is in each package?', 'Areas you build in', 'Talk to the team'];

const ALL_ACTIONS: BotActionKind[] = ['lead', 'whatsapp', 'call', 'email'];

// Spelling variants, Tanglish and synonyms folded to one word before matching.
const SYNONYMS: [RegExp, string][] = [
  [/\b(evlo|evvalavu|evvalo|yevlo|ethana|kaasu|selavu|rate|rates|pricing|prices|charges?|fees?|budget|estimate|estimation|quotation|quote|expense|expenses|amount)\b/g, ' cost '],
  [/\bhow much\b/g, ' cost '],
  [/\b(veedu|vidu|bungalow|villa|villas|independent house|individual house|home|homes|houses)\b/g, ' house '],
  [/\b(kattanum|katta|kattrathu|construct|constructing|construction|building|build|builder|builders|contractor|contractors)\b/g, ' build '],
  [/\b(sq\.? ?ft|sqft|sft|square feet|square foot|sq feet|sq foot)\b/g, ' sqft '],
  [/\b(t\.? ?nagar|thyagaraya nagar)\b/g, ' tnagar '],
  [/\b(k\.? ?k\.? ?nagar)\b/g, ' kknagar '],
  [/\b(old mahabalipuram road|it corridor|it expressway)\b/g, ' omr '],
  [/\b(east coast road)\b/g, ' ecr '],
  [/\b(vanakkam|hi|hai|hii+|helo|hey+)\b/g, ' hello ']
];

const STOPWORDS = new Set('a an the is are am i me my we you your our us it its of to in on for at by with and or do does did can could should would will what which who how when where why this that there here be been was were have has had any some about from as please pls tell know want need get give'.split(' '));

export function normalize(input: string): string {
  let s = ' ' + input.toLowerCase().replace(/₹/g, ' rs ').replace(/[’']/g, '').replace(/[^a-z0-9+.\s]/g, ' ') + ' ';
  for (const [re, word] of SYNONYMS) s = s.replace(re, word);
  return s.replace(/\s+/g, ' ').trim();
}

function tokens(text: string): string[] {
  return normalize(text).split(' ').filter(t => t.length > 1 && !STOPWORDS.has(t));
}

const has = (s: string, re: RegExp) => re.test(s);
const formatInr = (n: number) => n.toLocaleString('en-IN');
const lakh = (rupees: number) => (Math.round(rupees / 10000) / 10).toFixed(1).replace(/\.0$/, '');

// Area names as visitors type them, longest first so "anna nagar" beats "nagar".
const AREA_ALIASES: { re: RegExp; area: Area }[] = AREAS
  .flatMap(area => {
    const names = [area.name.toLowerCase()];
    if (area.name === 'T Nagar') names.push('tnagar');
    if (area.name === 'KK Nagar') names.push('kknagar');
    if (area.name === 'Sembiam') names.push('sembiyan');
    if (area.name === 'Thiruvottiyur') names.push('tiruvottiyur', 'thiruvotriyur');
    if (area.name === 'Velachery') names.push('velacheri', 'velacherry');
    if (area.name === 'Sholinganallur') names.push('sholinganalur', 'shollinganallur');
    if (area.name === 'Pallikaranai') names.push('pallikarnai');
    if (area.name === 'Purasawalkam') names.push('purasaiwakkam');
    return names.map(n => ({ re: new RegExp(`\\b${n.replace(/\s+/g, '\\s*')}\\b`), area }));
  })
  .sort((a, b) => b.re.source.length - a.re.source.length);

const SERVICES: { re: RegExp; name: string; url: string; text: string }[] = [
  { re: /\b(interior|interiors|modular|kitchen design|wardrobe|false ceiling)\b/, name: 'Interior Design', url: '/interior-design/', text: 'We design and execute home interiors in Chennai: modular kitchens, wardrobes, false ceilings and complete room interiors.' },
  { re: /\b(renovat\w*|remodel\w*|repair\w*|retrofit\w*|waterproof\w*|painting|crack\w*)\b/, name: 'Renovation', url: '/renovation/', text: 'We renovate and repair homes: bathrooms, kitchens, structural repairs, waterproofing and full house renovation.' },
  { re: /\b(legal|patta|encumbrance|ec|registration|title|document\w*|lawyer|verification|sale deed)\b/, name: 'Property Legal', url: '/property-legal/', text: 'Our property legal team helps with title and document verification, patta, encumbrance certificates and registration.' },
  { re: /\b(joint development|joint venture|jv|jd|redevelop\w*|landowner|land owner)\b/, name: 'Joint Development', url: '/joint-development/', text: 'If you own land or an old house, we can build on it under a joint development agreement, so you share the new building instead of paying for construction.' },
  { re: /\b(commercial|office|shop|showroom|apartment|flats?)\b/, name: 'Commercial Construction', url: '/services/', text: 'Besides individual houses and villas we build apartments, office spaces and commercial buildings.' }
];

const PACKAGE_KEYS: { re: RegExp; index: number }[] = [
  { re: /\b(ultra|luxury|ultra luxury)\b/, index: 3 },
  { re: /\bpremium\b/, index: 2 },
  { re: /\bstandard\b/, index: 1 },
  { re: /\bbasic\b/, index: 0 }
];

// Words that point at one section of the package specification.
const SPEC_TOPICS: { re: RegExp; section: RegExp; item?: RegExp }[] = [
  { re: /\b(cement)\b/, section: /structure/i, item: /\bcement\b/i },
  { re: /\b(steel|tmt|rod)\b/, section: /structure/i, item: /steel/i },
  { re: /\b(brick|bricks|aac|block)\b/, section: /structure/i, item: /brick|aac|block/i },
  { re: /\b(concrete|rmc|m20|m25)\b/, section: /structure/i, item: /concrete/i },
  { re: /\b(ceiling height|height|basement)\b/, section: /structure/i, item: /height/i },
  { re: /\b(structure|structural)\b/, section: /structure/i },
  { re: /\b(tile|tiles|flooring|floor|marble|granite floor)\b/, section: /flooring/i },
  { re: /\b(bathroom|toilet|sanitary|fittings|plumbing|tank)\b/, section: /bathroom|plumbing/i },
  { re: /\b(kitchen|sink|granite)\b/, section: /kitchen/i },
  { re: /\b(door|doors|window|windows|railing|grill)\b/, section: /door|window/i },
  { re: /\b(paint|painting|putty|emulsion)\b/, section: /painting/i },
  { re: /\b(electrical|wire|wires|switch|switches|points?|wiring)\b/, section: /electrical/i },
  { re: /\b(design|drawing|drawings|elevation|3d|plan)\b/, section: /design/i },
  { re: /\b(engineer|supervision|manager|project management|app)\b/, section: /project management/i }
];

export class ChatbotEngine {
  private kb?: Kb;
  private idf = new Map<string, number>();
  private faqTokens: string[][] = [];
  private pageTokens: string[][] = [];

  setKb(kb: Kb): void {
    this.kb = kb;
    this.faqTokens = kb.faqs.map(f => tokens(f.q));
    this.pageTokens = kb.pages.map(p => tokens(`${p.title} ${p.title} ${p.text}`));
    const docs = [...this.faqTokens, ...this.pageTokens];
    const df = new Map<string, number>();
    for (const doc of docs) new Set(doc).forEach(t => df.set(t, (df.get(t) ?? 0) + 1));
    df.forEach((n, t) => this.idf.set(t, Math.log(1 + docs.length / n)));
  }

  greeting(): BotReply {
    return {
      text: [
        `Hi! I'm the ${BUSINESS.name} assistant. Ask me about building a house in Chennai: costs, our packages, materials, timelines, approvals or the areas we build in.`
      ],
      chips: STARTER_CHIPS
    };
  }

  reply(input: string): BotReply {
    const raw = input.trim();
    const s = normalize(raw);
    if (!s) return this.greeting();

    if (/^(hello|good (morning|afternoon|evening))( there)?( team)?$/.test(s)) return this.greeting();
    if (/^(thanks?|thank you|thx|ok|okay|super|great|nandri)\b/.test(s) && s.split(' ').length <= 4) {
      return { text: ['Happy to help! Anything else you would like to know about your project?'], chips: STARTER_CHIPS };
    }

    const sqft = this.findSqft(raw);
    const pkgIndex = PACKAGE_KEYS.find(p => p.re.test(s))?.index;
    const spec = SPEC_TOPICS.find(t => t.re.test(s));
    const asksExcluded = has(s, /\b(not included|excluded|exclude|extra|additional|separate|separately|hidden)\b/);
    const asksIncluded = has(s, /\b(include|included|includes|inclusions?|brand|brands|specifications?|specs?|compare|difference)\b/)
      || (has(s, /\bpackages?\b/) && has(s, /\b(what|details?|each|all)\b/) && !has(s, /\bcost\b/));
    const asksCost = has(s, /\b(cost|rs|lakh|lakhs|crore|cheap|afford\w*|sqft)\b/);
    const area = AREA_ALIASES.find(a => a.re.test(s))?.area;
    const service = SERVICES.find(sv => sv.re.test(s));

    // "Interior cost for 1200 sq ft" is an interiors question, not house construction.
    if (service && !has(s, /\b(house|build)\b/)) return this.serviceReply(service);

    if (asksExcluded) return this.notIncluded(pkgIndex);
    if ((pkgIndex !== undefined || asksIncluded) && (spec || asksIncluded) && !(asksCost && sqft)) return this.packageDetail(pkgIndex, spec);
    if (asksCost || pkgIndex !== undefined || has(s, /\bpackages?\b/)) return this.cost(sqft, pkgIndex, area);
    if (has(s, /\b(call|phone|mobile|number|whatsapp|contact|talk|speak|email|mail|reach|callback|call back|agent|human|person|executive)\b/)) return this.contact();
    if (area) return this.areaReply(area);
    if (has(s, /\b(areas?|which places|where do you build|do you cover|cover|serve|service area|localit\w*)\b/)) return this.areas();
    if (has(s, /\b(near me|nearby|office|offices|address|located|location|where are you|visit|branch)\b/)) return this.offices();
    if (has(s, /\b(how long|time|timeline|months?|duration|days|complete|completion|finish)\b/)) return this.fromFaq(/how long/i, 'timeline');
    if (has(s, /\b(approval|approvals|permit|permission|cmda|dtcp|sanction|corporation|plan approval)\b/)) return this.approvals();
    if (has(s, /\b(vastu)\b/)) return this.fromFaq(/vastu/i, 'vastu');
    if (has(s, /\b(change|changes|modify|modification|alter|alteration|revis\w*)\b/)) return this.fromFaq(/changes/i, 'changes');
    if (has(s, /\b(payment|payments|pay|instal+ments?|advance|stages?)\b/)) return this.payments();
    if (has(s, /\b(process|steps|procedure|start|begin|how do (you|i))\b/) && has(s, /\b(build|house|process|steps|start|begin)\b/)) return this.process();
    if (has(s, /\b(services?|offer|do you do|what do you)\b/)) return this.services();
    if (has(s, /\b(who are you|about (you|hunter)|company|experience|trust|why (choose|you|hunter))\b/)) return this.about();

    return this.search(raw);
  }

  // --- answers ---------------------------------------------------------------------

  private cost(sqft?: number, pkgIndex?: number, area?: Area): BotReply {
    const from = Math.min(...PACKAGES.map(p => p.pricePerSqft));
    const text = [
      `Our construction packages start at ₹${formatInr(from)} per sq ft of built-up area${area ? `, and the same rates apply in ${area.name}` : ''}.`
    ];
    let list: string[];
    if (sqft) {
      const pkgs = pkgIndex !== undefined ? [PACKAGES[pkgIndex]] : PACKAGES;
      text.push(`For about ${formatInr(sqft)} sq ft, the building would cost roughly:`);
      list = pkgs.map(p => `${p.name}: about ₹${lakh(sqft * p.pricePerSqft)} lakh (₹${formatInr(p.pricePerSqft)}/sq ft)`);
    } else {
      list = PACKAGES.map(p => `${p.name}: ₹${formatInr(p.pricePerSqft)} per sq ft`);
    }
    return {
      text,
      list,
      note: 'Plan approval, compound wall, sump and septic tank, lift and the electricity connection are quoted separately. Your exact cost depends on the plot, floors and finishes, so our team will give you a free, itemised estimate.',
      actions: ALL_ACTIONS,
      chips: ['What is in each package?', 'What is not included?', 'How long does it take?'],
      service: 'Dream Home Construction'
    };
  }

  private packageDetail(pkgIndex: number | undefined, spec?: (typeof SPEC_TOPICS)[number]): BotReply {
    const kbPackages = this.kb?.packages;
    if (!kbPackages?.length) return this.cost(undefined, pkgIndex);
    const pkgs = pkgIndex !== undefined ? [kbPackages[pkgIndex]] : kbPackages;

    if (spec) {
      const list = pkgs.flatMap(p => {
        const section = p.sections.find(sec => spec.section.test(sec.title));
        const items = section?.items.filter(i => !spec.item || spec.item.test(i)) ?? [];
        return (items.length ? items : section?.items ?? []).slice(0, pkgs.length > 1 ? 2 : 8).map(i => `${pkgs.length > 1 ? p.name.replace(' Package', '') + ' – ' : ''}${i}`);
      });
      if (list.length) {
        return {
          text: [pkgs.length > 1 ? 'Here is how our packages compare:' : `In our ${pkgs[0].name} (₹${formatInr(pkgs[0].price)}/sq ft):`],
          list,
          links: [{ label: 'See full package details', url: '/#pricing' }],
          actions: ['lead', 'whatsapp'],
          chips: ['What is not included?', 'House construction cost', 'Talk to the team'],
          service: 'Dream Home Construction'
        };
      }
    }

    if (pkgs.length === 1) {
      const p = pkgs[0];
      const pick = (title: RegExp) => p.sections.find(sec => title.test(sec.title))?.items ?? [];
      const highlights = [
        ...pick(/structure/i).filter(i => /cement|steel|concrete|brick|aac/i.test(i)),
        ...pick(/project management/i).slice(0, 2),
        ...pick(/flooring/i).slice(0, 1),
        ...pick(/bathroom/i).filter(i => /fittings/i.test(i)),
        ...pick(/door/i).slice(0, 1),
        ...pick(/electrical/i).slice(0, 2)
      ];
      return {
        text: [`${p.name} – ₹${formatInr(p.price)} per sq ft. Some of what it includes:`],
        list: highlights,
        links: [{ label: 'See full package details', url: '/#pricing' }],
        actions: ['lead', 'whatsapp', 'call'],
        chips: ['What is not included?', 'Compare cement and steel', 'Talk to the team'],
        service: 'Dream Home Construction'
      };
    }

    return {
      text: ['We have four packages. The main differences are the brands of cement, steel, tiles and fittings, the design drawings you get, and how often the engineer is on site:'],
      list: kbPackages.map(p => {
        const cement = p.sections.find(s => /structure/i.test(s.title))?.items.find(i => /cement/i.test(i)) ?? '';
        const engineer = p.sections.find(s => /project/i.test(s.title))?.items[0] ?? '';
        return `${p.name} (₹${formatInr(p.price)}/sq ft): ${[cement, engineer].filter(Boolean).join('; ')}`;
      }),
      links: [{ label: 'See full package details', url: '/#pricing' }],
      actions: ['lead', 'whatsapp'],
      chips: ['Basic package details', 'Premium package details', 'What is not included?'],
      service: 'Dream Home Construction'
    };
  }

  private notIncluded(pkgIndex?: number): BotReply {
    const pkg = this.kb?.packages[pkgIndex ?? 0];
    const items = pkg?.sections.find(s => /not included/i.test(s.title))?.items
      ?? ['Compound wall and gate', 'Sump and septic tank', 'Lift, lift pit and shaft', 'Electricity connection', 'Building plan approval', 'Special elevation materials'];
    return {
      text: ['These are not part of the per sq ft package rate and are quoted separately:'],
      list: items,
      actions: ['lead', 'whatsapp', 'call'],
      chips: ['House construction cost', 'Do you handle plan approval?'],
      service: 'Dream Home Construction'
    };
  }

  private areaReply(area: Area): BotReply {
    const office = BUSINESS.offices.find(o => o.id === area.servedFrom);
    return {
      text: [
        `Yes, we build in ${area.name} (${area.zone}). What matters most there: ${area.keyConsideration.toLowerCase()}.`,
        `Plan approval for a typical house: ${area.approvals}. ${office ? `Our ${office.area} ${office.label.toLowerCase()} handles projects in this area.` : ''}`
      ],
      links: [
        { label: `Builders in ${area.name}: local guide`, url: `/home-construction/${area.slug}/` },
        { label: 'All areas we build in', url: '/builders-in-chennai/' }
      ],
      actions: ['lead', 'whatsapp', 'call'],
      chips: [`Cost to build in ${area.name}`, 'What is in each package?'],
      service: 'Dream Home Construction'
    };
  }

  private areas(): BotReply {
    const zones = [...new Set(AREAS.map(a => a.zone))];
    return {
      text: [`We build across Chennai, in ${AREAS.length}+ localities. Tell me your area and I will share what matters when building there.`],
      list: zones.map(z => `${z}: ${AREAS.filter(a => a.zone === z).slice(0, 5).map(a => a.name).join(', ')}…`),
      links: [{ label: 'Builders in Chennai: all areas', url: '/builders-in-chennai/' }],
      chips: ['Builders in Velachery', 'Builders in OMR', 'Builders in Anna Nagar'],
      actions: ['lead', 'whatsapp']
    };
  }

  private offices(): BotReply {
    return {
      text: [`We have four offices in Chennai, open Sunday to Friday, 8 AM to 10 PM. For sites anywhere in the city, our engineer visits your plot for a free consultation.`],
      list: BUSINESS.offices.map(o => `${o.label}, ${o.area}: ${o.streetAddress}, Chennai ${o.postalCode}`),
      links: [{ label: 'Areas we build in', url: '/builders-in-chennai/' }, { label: 'Contact page', url: '/contactus/' }],
      actions: ['call', 'whatsapp', 'lead']
    };
  }

  private contact(): BotReply {
    return {
      text: [`You can reach our team on ${CONTACT.telLabel} (call or WhatsApp) or ${CONTACT.email}, Sunday to Friday, 8 AM to 10 PM. Or leave your number and we will call you back.`],
      actions: ALL_ACTIONS
    };
  }

  private approvals(): BotReply {
    return {
      text: [
        'Yes, we prepare the drawings and handle the building plan approval for you. The authority depends on where the plot is: the Greater Chennai Corporation for most houses inside city limits, Tambaram or Avadi City Municipal Corporation there, and CMDA or DTCP for larger buildings or plots outside those limits.',
        'Approval fees are separate from the construction package.'
      ],
      links: [{ label: 'CMDA approval process in Chennai', url: '/home-construction/cmda-approval-chennai-process/' }],
      actions: ['lead', 'whatsapp'],
      service: 'Dream Home Construction'
    };
  }

  private payments(): BotReply {
    return {
      text: ['Payments are made in stages as the work is completed (foundation, each slab, finishing), as set out in the construction agreement. Our team shares the full payment schedule along with your quote.'],
      actions: ['lead', 'whatsapp', 'call'],
      service: 'Dream Home Construction'
    };
  }

  private process(): BotReply {
    return {
      text: ['Here is how a build with us goes:'],
      list: [
        'Free site visit and consultation',
        'Plot and document check',
        'Floor plans, 3D elevation and an itemised estimate',
        'Plan approval with the right authority',
        'Construction with daily progress updates',
        'Final inspection and handover'
      ],
      links: [{ label: 'Home construction services', url: '/home-construction/' }],
      actions: ['lead', 'whatsapp'],
      chips: ['House construction cost', 'How long does it take?'],
      service: 'Dream Home Construction'
    };
  }

  private services(): BotReply {
    return {
      text: ['We handle the whole journey of a property in Chennai:'],
      list: ['House and villa construction', 'Interior design', 'Renovation and repairs', 'Property legal services', 'Joint development', 'Apartments and commercial buildings'],
      links: [{ label: 'All services', url: '/services/' }],
      chips: ['House construction cost', 'Interior design', 'Joint development']
    };
  }

  private serviceReply(sv: (typeof SERVICES)[number]): BotReply {
    return {
      text: [sv.text, 'Costs depend on the scope, so our team gives you a free estimate after a quick visit.'],
      links: [{ label: `${sv.name}`, url: sv.url }],
      actions: ['lead', 'whatsapp', 'call'],
      service: sv.name === 'Interior Design' ? 'Interior Design Solutions'
        : sv.name === 'Renovation' ? 'Renovation & Remodeling'
        : sv.name === 'Property Legal' ? 'Property Legal Services'
        : sv.name === 'Joint Development' ? 'Joint Development Projects'
        : 'Dream Home Construction'
    };
  }

  private about(): BotReply {
    return {
      text: [
        `${BUSINESS.name} is a Chennai construction company building houses, villas, apartments and commercial buildings, with interior design, renovation, property legal and joint development services. We work from four offices: Perambur, Sembiam, Royapettah and Kolathur.`,
        'You get one team from design and approval to handover, a fixed per sq ft package with named brands, and daily progress updates.'
      ],
      links: [{ label: 'About us', url: '/about/' }],
      chips: STARTER_CHIPS
    };
  }

  private fromFaq(question: RegExp, topic: string): BotReply {
    const faq = this.kb?.faqs.find(f => question.test(f.q));
    const fallback: Record<string, string> = {
      timeline: 'Homes usually take 6–9 months and commercial buildings 8–12 months. We share a detailed timeline during planning.',
      vastu: 'Yes, our designs are fully tailored to you and Vastu-compliant.',
      changes: 'Yes, minor revisions are possible early in the construction phase.'
    };
    return {
      text: [faq?.a ?? fallback[topic]],
      actions: ['lead', 'whatsapp'],
      chips: STARTER_CHIPS,
      service: 'Dream Home Construction'
    };
  }

  /** Last resort: the closest FAQ, else the closest guide pages, else a person. */
  private search(raw: string): BotReply {
    const q = tokens(raw);
    if (this.kb && q.length) {
      const score = (doc: string[]) => {
        const set = new Set(doc);
        return q.reduce((n, t) => n + (set.has(t) ? this.idf.get(t) ?? 0 : 0), 0);
      };
      const maxPossible = q.reduce((n, t) => n + (this.idf.get(t) ?? 0), 0) || 1;

      const faqs = this.faqTokens.map((doc, i) => ({ i, s: score(doc) / maxPossible })).sort((a, b) => b.s - a.s);
      if (faqs[0]?.s >= 0.6) {
        const f = this.kb.faqs[faqs[0].i];
        return {
          text: [f.a],
          links: f.url !== '/' ? [{ label: 'Read more', url: f.url }] : undefined,
          actions: ['lead', 'whatsapp'],
          chips: STARTER_CHIPS
        };
      }

      const pages = this.pageTokens.map((doc, i) => ({ i, s: score(doc) / maxPossible })).sort((a, b) => b.s - a.s).filter(p => p.s >= 0.45).slice(0, 3);
      if (pages.length) {
        return {
          text: ['These guides on our site should help:'],
          links: pages.map(p => ({ label: this.kb!.pages[p.i].title, url: this.kb!.pages[p.i].url })),
          actions: ['lead', 'whatsapp'],
          chips: STARTER_CHIPS
        };
      }
    }
    return {
      text: ["I'm not sure I have the right answer for that. Our team can help you directly:"],
      actions: ALL_ACTIONS,
      chips: STARTER_CHIPS
    };
  }

  private findSqft(raw: string): number | undefined {
    const m = raw.toLowerCase().replace(/,/g, '').match(/(\d{3,5})\s*(sq\.?\s*ft|sqft|sft|square\s*f(?:ee|oo)t|sq\s*feet)/);
    const n = m ? Number(m[1]) : undefined;
    return n && n >= 300 && n <= 20000 ? n : undefined;
  }
}
