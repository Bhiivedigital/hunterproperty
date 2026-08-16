export interface IconTextItem {
  icon: string;
  title: string;
  text: string;
}

export interface StatItem {
  icon: string;
  value: string;
  suffix: string;
  label: string;
}

export interface SkillBar {
  label: string;
  percent: number;
}

export interface TeamMember {
  photo: string;
  name: string;
  role: string;
}

export interface ServiceCard {
  image: string;
  icon: string;
  title: string;
  text: string;
  slug?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface TestimonialItem {
  quote: string;
  authorName: string;
  authorRole: string;
  authorImage: string;
  rating: number;
}

export interface HomeBanner {
  heroSubTitle: string;
  heroTitleBefore: string;
  heroTitleHighlight: string;
  heroTitleAfter: string;
  trustBadgeTitle: string;
  trustBadgeSubtitle: string;
  slides: { backgroundImage: string }[];
}

export interface HomeAbout {
  tagline: string;
  titleHtml: string;
  paragraphs: string[];
  experienceYears: string;
  experienceLabel: string;
  image1: string;
  image2: string;
}

export interface HomeFeatures {
  items: IconTextItem[];
}

export interface HomeServices {
  tagline: string;
  titleHtml: string;
  items: ServiceCard[];
}

export interface HomeSkills {
  tagline: string;
  titleHtml: string;
  text: string;
  image: string;
  skills: SkillBar[];
}

export interface HomeStats {
  stats: StatItem[];
}

export interface HomeTeam {
  tagline: string;
  titleHtml: string;
  members: TeamMember[];
}

export interface HomeWhyChooseUs {
  tagline: string;
  titleHtml: string;
  text: string;
  items: IconTextItem[];
  image1: string;
  image2: string;
  videoTagline: string;
  videoTitleHtml: string;
  videoText: string;
  videoBgImage: string;
  videoCtaText: string;
  galleryImages: string[];
}

export interface HomeWorkingProcess {
  tagline: string;
  titleHtml: string;
  steps: IconTextItem[];
}

export interface HomePortfolio {
  images: string[];
}

export interface HomeLogoSlider {
  logos: string[];
}

export interface HomeFaq {
  tagline: string;
  titleHtml: string;
  introText1: string;
  introText2: string;
  ctaText: string;
  items: FaqItem[];
}

export interface HomeTestimonials {
  tagline: string;
  titleHtml: string;
  items: TestimonialItem[];
}

export interface AboutPage {
  heroTitleHtml: string;
}

export interface ServicesPage {
  heroTitleHtml: string;
  tagline: string;
  titleHtml: string;
  items: ServiceCard[];
}

export interface PortfolioPage {
  tagline: string;
  titleHtml: string;
  images: string[];
}
