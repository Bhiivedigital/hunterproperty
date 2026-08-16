import type { Core } from '@strapi/strapi';

const PUBLIC_PERMISSIONS: Record<string, string[]> = {
  'api::service-content-category.service-content-category': ['find', 'findOne'],
  'api::service-content-page.service-content-page': ['find', 'findOne'],
  'api::legal-page.legal-page': ['find', 'findOne'],
  'api::lead.lead': ['create'],
  'api::home-banner.home-banner': ['find'],
  'api::home-about.home-about': ['find'],
  'api::home-features.home-features': ['find'],
  'api::home-services.home-services': ['find'],
  'api::home-skills.home-skills': ['find'],
  'api::home-stats.home-stats': ['find'],
  'api::home-team.home-team': ['find'],
  'api::home-why-choose-us.home-why-choose-us': ['find'],
  'api::home-working-process.home-working-process': ['find'],
  'api::home-portfolio.home-portfolio': ['find'],
  'api::home-logo-slider.home-logo-slider': ['find'],
  'api::home-faq.home-faq': ['find'],
  'api::home-testimonials.home-testimonials': ['find'],
  'api::about-page.about-page': ['find'],
  'api::services-page.services-page': ['find'],
  'api::portfolio-page.portfolio-page': ['find'],
};

async function setPublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!publicRole) return;

  const existing = await strapi.query('plugin::users-permissions.permission').findMany({
    where: { role: publicRole.id },
  });
  const existingActions = new Set(existing.map((p: any) => p.action));

  const creations: Promise<unknown>[] = [];
  for (const [uid, actions] of Object.entries(PUBLIC_PERMISSIONS)) {
    for (const action of actions) {
      const fullAction = `${uid}.${action}`;
      if (!existingActions.has(fullAction)) {
        creations.push(
          strapi.query('plugin::users-permissions.permission').create({
            data: { action: fullAction, role: publicRole.id },
          })
        );
      }
    }
  }
  await Promise.all(creations);
}

const CATEGORIES = [
  { name: 'Home Construction', slug: 'home-construction', icon: 'fa-solid fa-house-chimney', description: 'Guides on planning, budgeting, and executing a residential construction project in Chennai from first sketch to handover.', menuOrder: 1, image: 'assets/img/service/01.jpg' },
  { name: 'Interior Design', slug: 'interior-design', icon: 'fa-solid fa-couch', description: 'Practical guides on interior design, modular kitchens, and material choices that keep a home feeling current for years.', menuOrder: 2, image: 'assets/img/service/02.jpg' },
  { name: 'Property Legal', slug: 'property-legal', icon: 'fa-solid fa-scale-balanced', description: 'Everything buyers and landowners need to know about title verification, documentation, and legal due diligence.', menuOrder: 3, image: 'assets/img/service/03.jpg' },
  { name: 'Renovation', slug: 'renovation', icon: 'fa-solid fa-trowel', description: 'Guides on renovation and remodeling — when to refresh, when to rebuild, and how to budget for it.', menuOrder: 4, image: 'assets/img/service/04.jpg' },
  { name: 'Joint Development', slug: 'joint-development', icon: 'fa-solid fa-handshake', description: 'How joint development agreements work, and what landowners and developers should verify before signing one.', menuOrder: 5, image: 'assets/img/service/05.jpg' },
];

const CONTENT_PAGES = [
  {
    slug: 'planning-your-dream-home-from-blueprint-to-handover',
    title: 'Planning Your Dream Home: From Blueprint to Handover',
    excerpt: 'A well-planned construction journey saves time, money, and stress. Here is how we take a project from first sketch to move-in day.',
    content: `
      <p>Building a dream home is a journey that starts long before the first brick is laid. It begins with understanding how you live, what you need, and how your family will grow into the space over the years.</p>
      <p>Our process starts with architectural planning that balances aesthetics with structural practicality, followed by a detailed execution plan covering electrical, plumbing, and finishing work.</p>
      <blockquote class="blockqoute">
        A house is built with bricks, but a home is built with careful planning.
        <i class="fas fa-quote-right blockqoute-icon"></i>
      </blockquote>
      <p>From site assessment to handover, every milestone is tracked and communicated, so there are no surprises along the way.</p>
    `,
    categorySlug: 'home-construction',
    tags: ['Construction', 'Planning', 'New Build'],
    featured: true,
    showInMenu: true,
    menuOrder: 1,
    coverImage: 'assets/img/portfolio/01.jpg',
  },
  {
    slug: 'structural-work-that-stands-the-test-of-time',
    title: 'Structural Work That Stands the Test of Time',
    excerpt: 'Foundations and framing decisions made today determine how a building performs for decades. Here is what we prioritize.',
    content: `
      <p>Structural integrity is the single biggest factor in a building's long-term safety and value. We follow strict quality checks at every stage of the structural build.</p>
      <p>Material selection, soil testing, and reinforcement detailing are handled by our engineering team before any concrete is poured.</p>
    `,
    categorySlug: 'home-construction',
    tags: ['Construction', 'Structure'],
    featured: false,
    showInMenu: true,
    menuOrder: 2,
    coverImage: 'assets/img/portfolio/02.jpg',
  },
  {
    slug: 'designing-interiors-that-reflect-your-lifestyle',
    title: 'Designing Interiors That Reflect Your Lifestyle',
    excerpt: 'Good interior design balances beauty and function. Here is how we turn a blank space into a cohesive, personal environment.',
    content: `
      <p>Every interior project starts with a conversation about how you actually use your space day to day, not just how it should look in a photograph.</p>
      <p>From layout planning to material and colour selection, we design around your routines, your storage needs, and the way light moves through the home.</p>
    `,
    categorySlug: 'interior-design',
    tags: ['Interior', 'Design'],
    featured: true,
    showInMenu: true,
    menuOrder: 1,
    coverImage: 'assets/img/portfolio/03.jpg',
  },
  {
    slug: 'choosing-materials-and-decor-that-last',
    title: 'Choosing Materials and Décor That Last',
    excerpt: 'The right finishes make a space feel complete for years, not just at handover. A quick guide to durable, timeless choices.',
    content: `
      <p>Trends come and go, but a well-chosen material palette keeps a home feeling current for far longer than a purely trend-led approach.</p>
      <p>We help clients choose finishes that age well, are easy to maintain, and still feel personal to their taste.</p>
    `,
    categorySlug: 'interior-design',
    tags: ['Interior', 'Materials'],
    featured: false,
    showInMenu: true,
    menuOrder: 2,
    coverImage: 'assets/img/portfolio/04.jpg',
  },
  {
    slug: 'understanding-property-title-verification',
    title: 'Understanding Property Title Verification',
    excerpt: 'Clear title is the foundation of any safe property purchase. Here is what a thorough legal check actually covers.',
    content: `
      <p>Title verification protects buyers from disputes that can surface years after a purchase. Our legal team reviews ownership history, encumbrances, and approvals before any transaction proceeds.</p>
      <p>We work only with title-clear, CMDA-approved parcels, and document every step of the verification for full transparency.</p>
    `,
    categorySlug: 'property-legal',
    tags: ['Legal', 'Title Verification'],
    featured: true,
    showInMenu: true,
    menuOrder: 1,
    coverImage: 'assets/img/portfolio/05.jpg',
  },
  {
    slug: 'documentation-checklist-before-you-sign',
    title: 'Documentation Checklist Before You Sign',
    excerpt: 'A practical checklist of the documents every buyer should verify before signing a sale agreement.',
    content: `
      <p>From encumbrance certificates to patta and approved building plans, missing a single document can delay or derail a purchase.</p>
      <p>Our legal desk prepares a clear checklist for every client, so nothing is missed before signing.</p>
    `,
    categorySlug: 'property-legal',
    tags: ['Legal', 'Documentation'],
    featured: false,
    showInMenu: true,
    menuOrder: 2,
    coverImage: 'assets/img/portfolio/06.jpg',
  },
  {
    slug: 'renovation-vs-remodeling-what-your-home-needs',
    title: 'Renovation vs. Remodeling: What Your Home Needs',
    excerpt: 'Not every old space needs a full remodel. Here is how we decide between a refresh and a complete rebuild.',
    content: `
      <p>Renovation restores what already works, while remodeling changes the structure and layout entirely. Choosing the right approach saves both time and budget.</p>
      <p>We assess the condition of existing structures before recommending a path, so clients only pay for the work that actually adds value.</p>
    `,
    categorySlug: 'renovation',
    tags: ['Renovation', 'Remodeling'],
    featured: false,
    showInMenu: true,
    menuOrder: 1,
    coverImage: 'assets/img/portfolio/07.jpg',
  },
  {
    slug: 'joint-development-a-win-win-for-landowners-and-developers',
    title: 'Joint Development: A Win-Win for Landowners and Developers',
    excerpt: 'Joint development lets landowners unlock value without upfront capital. Here is how the process typically works.',
    content: `
      <p>In a joint development, the landowner contributes the land and the developer funds and executes construction, with returns shared based on an agreed ratio.</p>
      <p>We identify title-clear, CMDA-approved parcels and structure agreements that protect both landowners and developers throughout the project.</p>
    `,
    categorySlug: 'joint-development',
    tags: ['Joint Development', 'Land'],
    featured: false,
    showInMenu: true,
    menuOrder: 1,
    coverImage: 'assets/img/portfolio/08.jpg',
  },
];

const LEGAL_PAGES = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `
      <p>Hunter Property ("we", "us", "our") respects your privacy and is committed to protecting the personal information you share with us through our website and services. This Privacy Policy explains what information we collect, how we use it, and the choices you have.</p>

      <h4>1. Information We Collect</h4>
      <p>We may collect the following types of information when you use our website, contact us, or enquire about our services:</p>
      <ul>
        <li>Contact details such as name, email address, and phone number submitted through our forms.</li>
        <li>Property and project preferences you share with us for construction, interior, legal, or joint development enquiries.</li>
        <li>Technical data such as browser type, device information, and pages visited, collected automatically through cookies and similar technologies.</li>
      </ul>

      <h4>2. How We Use Your Information</h4>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Respond to enquiries and provide quotes or consultations.</li>
        <li>Communicate updates about your project or requested services.</li>
        <li>Improve our website, services, and customer experience.</li>
        <li>Comply with legal and regulatory obligations.</li>
      </ul>

      <h4>3. Sharing of Information</h4>
      <p>We do not sell your personal information. We may share information with trusted partners, contractors, and legal advisors only where necessary to deliver the services you have requested, or where required by law.</p>

      <h4>4. Cookies</h4>
      <p>Our website may use cookies to improve functionality and analyse site traffic. You can control cookie preferences through your browser settings at any time.</p>

      <h4>5. Data Security</h4>
      <p>We take reasonable technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction.</p>

      <h4>6. Your Rights</h4>
      <p>You may request access to, correction of, or deletion of your personal information held by us at any time by contacting us using the details below.</p>

      <h4>7. Changes to This Policy</h4>
      <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with a revised "last updated" date.</p>

      <h4>8. Contact Us</h4>
      <p>If you have questions about this Privacy Policy, please contact us at 61 Mir Bakshi Ali Street, Royapettah, Chennai-14, Tamil Nadu, India, or call +075501 10784.</p>
    `,
  },
  {
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    content: `
      <p>These Terms & Conditions govern your use of the Hunter Property website and services. By accessing our website or engaging our services, you agree to be bound by these terms.</p>

      <h4>1. Services</h4>
      <p>Hunter Property provides construction, interior design, property legal services, renovation, remodeling, and joint development consultation. Specific engagements are governed by separate written agreements executed between Hunter Property and the client.</p>

      <h4>2. Use of Website</h4>
      <p>You agree to use this website only for lawful purposes and in a manner that does not infringe the rights of, or restrict, or inhibit the use of the site by any third party.</p>

      <h4>3. Enquiries and Quotations</h4>
      <p>Any quotation, estimate, or proposal shared through the website or in response to an enquiry is indicative and subject to confirmation following a site visit, requirement assessment, and formal agreement.</p>

      <h4>4. Intellectual Property</h4>
      <p>All content on this website, including text, images, logos, and designs, is the property of Hunter Property unless otherwise stated, and may not be reproduced without prior written consent.</p>

      <h4>5. Limitation of Liability</h4>
      <p>While we take care to ensure the accuracy of information on this website, Hunter Property is not liable for any loss or damage arising from reliance on website content. Project-specific liabilities are governed by the executed service agreement.</p>

      <h4>6. Third-Party Links</h4>
      <p>Our website may contain links to third-party sites. We are not responsible for the content or privacy practices of those external sites.</p>

      <h4>7. Governing Law</h4>
      <p>These Terms & Conditions are governed by the laws of India, and any disputes shall be subject to the exclusive jurisdiction of the courts in Chennai, Tamil Nadu.</p>

      <h4>8. Changes to These Terms</h4>
      <p>We may revise these Terms & Conditions at any time. Continued use of the website after changes are posted constitutes acceptance of the updated terms.</p>

      <h4>9. Contact Us</h4>
      <p>For questions about these Terms & Conditions, please contact us at 61 Mir Bakshi Ali Street, Royapettah, Chennai-14, Tamil Nadu, India, or call +075501 10784.</p>
    `,
  },
];

async function seedContent(strapi: Core.Strapi) {
  const existingCategories = await strapi.documents('api::service-content-category.service-content-category').count({});
  if (existingCategories === 0) {
    const categoryDocIds: Record<string, string> = {};
    for (const category of CATEGORIES) {
      const { slug, ...rest } = category;
      const created = await strapi.documents('api::service-content-category.service-content-category').create({
        data: {
          slug,
          ...rest,
          seo: { metaTitle: `${category.name} Guides | Hunter Property`, metaDescription: category.description },
        },
      });
      categoryDocIds[slug] = created.documentId;
    }

    for (const page of CONTENT_PAGES) {
      const { categorySlug, ...data } = page;
      await strapi.documents('api::service-content-page.service-content-page').create({
        data: {
          ...data,
          category: categoryDocIds[categorySlug],
          seo: { metaTitle: `${page.title} | Hunter Property`, metaDescription: page.excerpt },
        },
        status: 'published',
      });
    }
  }

  const existingLegalPages = await strapi.documents('api::legal-page.legal-page').count({});
  if (existingLegalPages === 0) {
    for (const page of LEGAL_PAGES) {
      await strapi.documents('api::legal-page.legal-page').create({ data: page });
    }
  }
}

const HOME_SEED: { uid: string; data: Record<string, unknown> }[] = [
  {
    uid: 'api::home-banner.home-banner',
    data: {
      heroSubTitle: 'Build Your Dream',
      heroTitleBefore: 'Expert Residential & Commercial',
      heroTitleHighlight: 'Construction',
      heroTitleAfter: 'in Chennai',
      trustBadgeTitle: 'Trusted by Homeowners Across Chennai',
      trustBadgeSubtitle: '15+ Years of Construction Excellence',
      slides: [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ backgroundImage: `assets/img/hero/slider-${n}.jpg` })),
    },
  },
  {
    uid: 'api::home-about.home-about',
    data: {
      tagline: 'About Us',
      titleHtml: 'We Are The <span>Best and Expert</span> For Construction',
      paragraphs: [
        'At Hunter Property, real estate is not just our business—it’s our legacy. As a trusted construction company in Chennai with three generations of experience, we specialize in building premium homes, commercial spaces, and builder-ready land projects tailored to your lifestyle and aspirations.',
        'From family residences in Chennai to commercial construction, real estate development, and land partnerships, we offer unmatched local market expertise, transparent service, and a deep commitment to quality. Whether you are buying property in Chennai, selling land, leasing commercial buildings, or investing in real estate, our mission is to bring your vision to life—on time, and with precision.',
        'We don’t just construct buildings—we build trust, value, and long-lasting relationships with every project we undertake.',
      ],
      experienceYears: '15',
      experienceLabel: 'Years Of Experience',
      image1: 'assets/img/about/01.jpg',
      image2: 'assets/img/about/02.jpg',
    },
  },
  {
    uid: 'api::home-features.home-features',
    data: {
      items: [
        { icon: 'assets/img/icon/money.svg', title: 'The Best Price', text: 'Chennai’s affordable construction partner for villas, apartments, and commercial buildings. Competitive rates with clear, honest quotes.' },
        { icon: 'assets/img/icon/consultation.svg', title: 'Daily Consultant', text: 'As a trusted Chennai builder, we provide real-time updates. Our site consultants keep you informed on materials, progress, and timelines.' },
        { icon: 'assets/img/icon/design.svg', title: 'Custom Design', text: 'Expert custom home design in Chennai with Vastu-compliant layouts, sleek interiors, and modern architecture—crafted for your lifestyle.' },
      ],
    },
  },
  {
    uid: 'api::home-services.home-services',
    data: {
      tagline: 'Services',
      titleHtml: 'What Services we are <span>provide</span> to you',
      items: [
        { image: 'assets/img/service/01.jpg', icon: 'assets/img/icon/construction.svg', title: 'Dream Home Construction', text: 'We specialize in constructing custom-built homes that reflect your personality, lifestyle, and future aspirations. From blueprint to handover, our end-to-end construction services cover architectural planning, structural work, electrical and plumbing, finishing, and landscaping.' },
        { image: 'assets/img/service/02.jpg', icon: 'assets/img/icon/maintenance.svg', title: 'Interior Design Solutions', text: 'Our team crafts personalized spaces that reflect your unique style, balancing beauty and functionality to enhance everyday living. From layout planning to décor selection, every detail is thoughtfully considered. We work closely with you to turn your vision into a cohesive, inspiring environment that aligns with your lifestyle and needs.' },
        { image: 'assets/img/service/03.jpg', icon: 'assets/img/icon/design-2.svg', title: 'Property Legal Services', text: 'Experience seamless property transactions with our end-to-end legal support. We handle documentation, title verification, approvals, and compliance with ease—ensuring every deal is secure, transparent, and hassle-free' },
      ],
    },
  },
  {
    uid: 'api::home-skills.home-skills',
    data: {
      tagline: 'Our Skills',
      titleHtml: 'We Offers You Best <span>Construction</span> Services',
      text: "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.",
      image: 'assets/img/skill/01.jpg',
      skills: [
        { label: 'Construction', percent: 85 },
        { label: 'Experience', percent: 65 },
        { label: 'Architecture', percent: 75 },
      ],
    },
  },
  {
    uid: 'api::home-stats.home-stats',
    data: {
      stats: [
        { icon: 'assets/img/icon/construction.svg', value: '150', suffix: 'k', label: 'Projects Done' },
        { icon: 'assets/img/icon/happy.svg', value: '25', suffix: 'K', label: 'Happy Clients' },
        { icon: 'assets/img/icon/team-2.svg', value: '120', suffix: '+', label: 'Experts Staff' },
        { icon: 'assets/img/icon/award.svg', value: '50', suffix: '+', label: 'Win Awards' },
      ],
    },
  },
  {
    uid: 'api::home-team.home-team',
    data: {
      tagline: 'Our Team',
      titleHtml: 'Meet With Our <span>Experts</span>',
      members: [
        { photo: 'assets/img/team/01.jpg', name: '', role: 'CEO & Founder' },
        { photo: 'assets/img/team/02.jpg', name: '', role: 'Project Manager' },
        { photo: 'assets/img/team/03.jpg', name: '', role: 'Marketing Manager' },
        { photo: 'assets/img/team/04.jpg', name: '', role: 'Civil Engineer' },
      ],
    },
  },
  {
    uid: 'api::home-why-choose-us.home-why-choose-us',
    data: {
      tagline: 'Why Choose Us',
      titleHtml: 'We deliver expertise you can trust our <span>service</span>',
      text: "At Hunter Property, we combine affordability, expertise, and transparency to deliver end-to-end construction solutions tailored to your needs. Whether you're building a home or a commercial space, we ensure a hassle-free experience backed by expert guidance and consistent communication.",
      items: [
        { icon: 'assets/img/icon/money.svg', title: 'Affordable Cost', text: 'Clear pricing, no hidden charges, and flexible packages' },
        { icon: 'assets/img/icon/team.svg', title: 'Our Experience Team', text: 'Our team brings years of experience in residential and commercial construction.' },
        { icon: 'assets/img/icon/certified.svg', title: 'Reliable Company', text: 'We prioritize communication, quality control, and customer satisfaction.' },
      ],
      image1: 'assets/img/choose/01.jpg',
      image2: 'assets/img/choose/02.jpg',
      videoTagline: 'Happy Clients',
      videoTitleHtml: 'Celebrating every handover with our families.',
      videoText: "From sign-up to move-in, every milestone with a Hunter Property family is one worth celebrating. Here's a look at a few of them.",
      videoBgImage: 'assets/img/video/01.jpg',
      videoCtaText: 'Get In Touch',
      galleryImages: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `assets/img/gallery/gallery-0${n}.png`),
    },
  },
  {
    uid: 'api::home-working-process.home-working-process',
    data: {
      tagline: 'Working Process',
      titleHtml: 'Easy steps for <span>Hunter Property</span>',
      steps: [
        { icon: 'assets/img/icon/service.svg', title: 'Choose Service', text: 'From home builds to office interiors find the right construction service in Chennai for you.' },
        { icon: 'assets/img/icon/consultation.svg', title: 'Free  Consultation', text: 'Discuss your ideas with our team for a free, no-obligation planning session.' },
        { icon: 'assets/img/icon/money.svg', title: 'Estimate Budget', text: 'Know your budget upfront. We provide clear construction pricing in Chennai.' },
        { icon: 'assets/img/icon/construction-2.svg', title: 'Project Production', text: 'Once we begin, expect on-site supervision, real-time reports, and timely delivery.' },
      ],
    },
  },
  {
    uid: 'api::home-portfolio.home-portfolio',
    data: {
      images: [1, 2, 3, 4, 5].map(n => `assets/img/portfolio/0${n}.jpg`),
    },
  },
  {
    uid: 'api::home-logo-slider.home-logo-slider',
    data: {
      logos: [
        'assets/img/partner/01.png',
        'assets/img/partner/02.png',
        'assets/img/partner/03.png',
        'assets/img/partner/01.png',
        'assets/img/partner/02.png',
        'assets/img/partner/03.png',
        'assets/img/partner/02.png',
      ],
    },
  },
  {
    uid: 'api::home-faq.home-faq',
    data: {
      tagline: "Faq's",
      titleHtml: 'General <span>frequently</span> asked questions',
      introText1: 'Starting a construction project in Chennai—whether it’s residential home building, villa construction, apartment development, or commercial property renovation—can bring many questions about cost estimates, timelines, materials, and approvals. At Hunter Property, we prioritize transparency and clear communication to guide you through every step of your construction journey.',
      introText2: 'This FAQ section answers common queries on affordable construction pricing, Vastu-compliant designs, project scheduling, quality control, legal permits, and site management. Our aim is to help you make informed decisions with confidence and ensure your project is completed on time, within budget, and to the highest standards.',
      ctaText: 'Have Any Question ?',
      items: [
        { question: 'What types of projects do you handle?', answer: 'We build homes, villas, apartments, office spaces, and commercial buildings. We also offer interior renovation services in Chennai.' },
        { question: 'How long does a project usually take?', answer: 'Homes: 6–9 months, Commercial: 8–12 months, We share detailed timelines during the planning stage.' },
        { question: 'Are your designs custom and Vastu-compliant?', answer: 'Yes! We provide fully tailored and Vastu-approved building designs.' },
        { question: 'Can changes be made mid-project?', answer: 'Yes, minor revisions are possible early in the construction phase.' },
      ],
    },
  },
  {
    uid: 'api::home-testimonials.home-testimonials',
    data: {
      tagline: 'Testimonials',
      titleHtml: "What Our Client <span>Say's</span> about us",
      items: [
        { quote: 'The construction quality is Amazing, out elevation and interior very good price also comport for us. Thank you for Mr. Ali sir 🙏🙏🙏', authorName: 'sk anbalagan', authorRole: 'Customer', authorImage: 'assets/img/testimonial/03.jpg', rating: 5 },
        { quote: 'A very helpful and reliable partner who helped me register the land for my ancestral house and also built our dream home.', authorName: 'Tathheer Fathima Syed', authorRole: 'Customer', authorImage: 'assets/img/testimonial/04.jpg', rating: 5 },
        { quote: "Very Fair & transparent people, it's one stop shop for all ur needs, most importantly they make u feel comfortable, I already have 2 properties developed and looking forward fr many more A special thanks to the Boss ALI bhai", authorName: 'samkay india enterprises', authorRole: 'Customer', authorImage: 'assets/img/testimonial/01.jpg', rating: 5 },
        { quote: 'Excellent one stop shop for all your real estate needs. Ali Bhai will guide you smoothly and ensure your requirements are fulfilled. I am very satisfied with the service and Ali Bhai has helped me with my concerns very satisfactorily. Highly recommended!', authorName: 'Syed Safdar Hussain', authorRole: 'Customer', authorImage: 'assets/img/testimonial/02.jpg', rating: 5 },
        { quote: "It's good quality material for a construction on site,so never comparmais quality makeing.then complestion for on time.i give my thoughts for 5 star ratings for HP it's more growing and more successful project.", authorName: 'Dinesh Ca', authorRole: 'Customer', authorImage: 'assets/img/testimonial/04.jpg', rating: 5 },
      ],
    },
  },
  {
    uid: 'api::about-page.about-page',
    data: {
      heroTitleHtml: 'We Don’t <span>Just Build </span>Structures <br> We Build <span>Dreams</span>',
    },
  },
  {
    uid: 'api::services-page.services-page',
    data: {
      heroTitleHtml: 'We <span>offer </span>end-to-end <span> Construction </span> services',
      tagline: 'Services',
      titleHtml: 'What Services we are <span>provide</span> to you',
      items: [
        { slug: 'home-construction', image: 'assets/img/service/01.jpg', icon: 'assets/img/icon/construction.svg', title: 'Dream Home Construction', text: 'We specialize in constructing custom-built homes that reflect your personality, lifestyle, and future aspirations. From blueprint to handover, our end-to-end construction services cover architectural planning, structural work, electrical and plumbing, finishing, and landscaping.' },
        { slug: 'interior-design', image: 'assets/img/service/02.jpg', icon: 'assets/img/icon/maintenance.svg', title: 'Interior Design Solutions', text: 'Our team crafts personalized spaces that reflect your unique style, balancing beauty and functionality to enhance everyday living. From layout planning to décor selection, every detail is thoughtfully considered. We work closely with you to turn your vision into a cohesive, inspiring environment that aligns with your lifestyle and needs.' },
        { slug: 'property-legal', image: 'assets/img/service/03.jpg', icon: 'assets/img/icon/design-2.svg', title: 'Property Legal Services', text: 'Whether structural upgrades or cosmetic enhancements, we specialize in transforming outdated spaces into modern, efficient, and stylish living areas.' },
        { slug: 'renovation', image: 'assets/img/service/04.jpg', icon: 'assets/img/icon/plan.svg', title: 'Renovation & Remodeling', text: 'Whether it’s structural upgrades or aesthetic enhancements, we breathe new life into old spaces. Our team specializes in transforming outdated interiors into modern, functional, and visually stunning living environments. From concept to completion, we ensure every detail reflects your vision, lifestyle, and comfort' },
        { slug: 'joint-development', image: 'assets/img/service/05.jpg', icon: 'assets/img/icon/contract.svg', title: 'Joint Development Projects', text: 'We enable successful collaborations between landowners and top-tier developers. Our focus is on identifying and offering title-clear, CMDA-approved land parcels suited for residential, commercial, and integrated developments. With a sharp eye on compliance and value creation, we simplify the joint development process from start to finish.' },
      ],
    },
  },
  {
    uid: 'api::portfolio-page.portfolio-page',
    data: {
      tagline: 'Our Portfolio',
      titleHtml: "Let's check our latest portfolio",
      images: Array.from({ length: 12 }, (_, i) => `assets/img/portfolio/${String(i + 1).padStart(2, '0')}.jpg`),
    },
  },
];

async function seedHomeContent(strapi: Core.Strapi) {
  for (const { uid, data } of HOME_SEED) {
    const existing = await strapi.documents(uid as any).findFirst({});
    if (existing) continue;
    await strapi.documents(uid as any).create({ data: data as any });
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await setPublicPermissions(strapi);
    await seedContent(strapi);
    await seedHomeContent(strapi);
  },
};
