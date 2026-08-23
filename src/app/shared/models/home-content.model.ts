import { CmsImage } from './cms-image.model';

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
  photo: CmsImage;
  name: string;
  role: string;
}

export interface ServiceCard {
  image: CmsImage;
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
  authorImage: CmsImage;
  rating: number;
}

export interface HomeBanner {
  heroSubTitle: string;
  heroTitleBefore: string;
  heroTitleHighlight: string;
  heroTitleAfter: string;
  trustBadgeTitle: string;
  trustBadgeSubtitle: string;
  slides: { backgroundImage: CmsImage }[];
}

export interface HomeAbout {
  tagline: string;
  titleHtml: string;
  paragraphs: string;
  experienceYears: string;
  experienceLabel: string;
  image1: CmsImage;
  image2: CmsImage;
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
  image: CmsImage;
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
  image1: CmsImage;
  image2: CmsImage;
  videoTagline: string;
  videoTitleHtml: string;
  videoText: string;
  videoBgImage: CmsImage;
  videoCtaText: string;
  galleryImages: CmsImage[];
}

export interface HomeWorkingProcess {
  tagline: string;
  titleHtml: string;
  steps: IconTextItem[];
}

export interface HomePortfolio {
  images: CmsImage[];
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
  images: CmsImage[];
}
