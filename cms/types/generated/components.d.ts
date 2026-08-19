import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksAccordion extends Struct.ComponentSchema {
  collectionName: 'components_blocks_accordions';
  info: {
    displayName: 'Accordion';
    icon: 'bulletList';
  };
  attributes: {
    items: Schema.Attribute.Component<'shared.faq-item', true>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksBanner extends Struct.ComponentSchema {
  collectionName: 'components_blocks_banners';
  info: {
    displayName: 'Banner';
    icon: 'picture';
  };
  attributes: {
    ctaText: Schema.Attribute.String;
    ctaUrl: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface BlocksContentSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_content_sections';
  info: {
    displayName: 'Content Section';
    icon: 'layout';
  };
  attributes: {
    body: Schema.Attribute.RichText;
    image: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksFaqs extends Struct.ComponentSchema {
  collectionName: 'components_blocks_faqs';
  info: {
    displayName: 'Faqs';
    icon: 'question';
  };
  attributes: {
    items: Schema.Attribute.Component<'shared.faq-item', true>;
    title: Schema.Attribute.String;
  };
}

export interface BlocksQuickLinks extends Struct.ComponentSchema {
  collectionName: 'components_blocks_quick_links';
  info: {
    displayName: 'Quick Links';
    icon: 'bulletList';
  };
  attributes: {
    items: Schema.Attribute.Component<'shared.link-item', true>;
    mainTitle: Schema.Attribute.String;
  };
}

export interface BlocksScripts extends Struct.ComponentSchema {
  collectionName: 'components_blocks_scripts';
  info: {
    displayName: 'Scripts';
    icon: 'code';
  };
  attributes: {
    code: Schema.Attribute.Text;
    name: Schema.Attribute.String;
  };
}

export interface BlocksVideoSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_video_sections';
  info: {
    displayName: 'Video Section';
    icon: 'play';
  };
  attributes: {
    thumbnail: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String;
    videoUrl: Schema.Attribute.String;
  };
}

export interface SharedFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_faq_items';
  info: {
    displayName: 'FAQ Item';
    icon: 'question';
  };
  attributes: {
    answer: Schema.Attribute.RichText;
    question: Schema.Attribute.String;
  };
}

export interface SharedIconTextItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_icon_text_items';
  info: {
    displayName: 'Icon Text Item';
    icon: 'star';
  };
  attributes: {
    icon: Schema.Attribute.Media<'images'>;
    text: Schema.Attribute.RichText;
    title: Schema.Attribute.String;
  };
}

export interface SharedLinkItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_link_items';
  info: {
    displayName: 'Link Item';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    canonicalUrl: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text;
    metaTitle: Schema.Attribute.String;
    noIndex: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    ogDescription: Schema.Attribute.Text;
    ogImage: Schema.Attribute.Media<'images'>;
    ogTitle: Schema.Attribute.String;
  };
}

export interface SharedServiceCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_service_cards';
  info: {
    displayName: 'Service Card';
    icon: 'briefcase';
  };
  attributes: {
    icon: Schema.Attribute.Media<'images'>;
    image: Schema.Attribute.Media<'images'>;
    slug: Schema.Attribute.String;
    text: Schema.Attribute.RichText;
    title: Schema.Attribute.String;
  };
}

export interface SharedSkillBar extends Struct.ComponentSchema {
  collectionName: 'components_shared_skill_bars';
  info: {
    displayName: 'Skill Bar';
    icon: 'bulb';
  };
  attributes: {
    label: Schema.Attribute.String;
    percent: Schema.Attribute.Integer;
  };
}

export interface SharedSlide extends Struct.ComponentSchema {
  collectionName: 'components_shared_slides';
  info: {
    displayName: 'Slide';
    icon: 'image';
  };
  attributes: {
    backgroundImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedStatItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_stat_items';
  info: {
    displayName: 'Stat Item';
    icon: 'chart-bar';
  };
  attributes: {
    icon: Schema.Attribute.Media<'images'>;
    label: Schema.Attribute.String;
    suffix: Schema.Attribute.String;
    value: Schema.Attribute.String;
  };
}

export interface SharedTeamMember extends Struct.ComponentSchema {
  collectionName: 'components_shared_team_members';
  info: {
    displayName: 'Team Member';
    icon: 'user';
  };
  attributes: {
    name: Schema.Attribute.String;
    photo: Schema.Attribute.Media<'images'>;
    role: Schema.Attribute.String;
  };
}

export interface SharedTestimonialItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_testimonial_items';
  info: {
    displayName: 'Testimonial Item';
    icon: 'quote';
  };
  attributes: {
    authorImage: Schema.Attribute.Media<'images'>;
    authorName: Schema.Attribute.String;
    authorRole: Schema.Attribute.String;
    quote: Schema.Attribute.RichText;
    rating: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<5>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'blocks.accordion': BlocksAccordion;
      'blocks.banner': BlocksBanner;
      'blocks.content-section': BlocksContentSection;
      'blocks.faqs': BlocksFaqs;
      'blocks.quick-links': BlocksQuickLinks;
      'blocks.scripts': BlocksScripts;
      'blocks.video-section': BlocksVideoSection;
      'shared.faq-item': SharedFaqItem;
      'shared.icon-text-item': SharedIconTextItem;
      'shared.link-item': SharedLinkItem;
      'shared.seo': SharedSeo;
      'shared.service-card': SharedServiceCard;
      'shared.skill-bar': SharedSkillBar;
      'shared.slide': SharedSlide;
      'shared.stat-item': SharedStatItem;
      'shared.team-member': SharedTeamMember;
      'shared.testimonial-item': SharedTestimonialItem;
    }
  }
}
