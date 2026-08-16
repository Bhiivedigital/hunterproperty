import type { Schema, Struct } from '@strapi/strapi';

export interface SharedFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_faq_items';
  info: {
    displayName: 'FAQ Item';
    icon: 'question';
  };
  attributes: {
    answer: Schema.Attribute.Text;
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
    icon: Schema.Attribute.String;
    text: Schema.Attribute.Text;
    title: Schema.Attribute.String;
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
    icon: Schema.Attribute.String;
    image: Schema.Attribute.String;
    slug: Schema.Attribute.String;
    text: Schema.Attribute.Text;
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
    backgroundImage: Schema.Attribute.String;
  };
}

export interface SharedStatItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_stat_items';
  info: {
    displayName: 'Stat Item';
    icon: 'chart-bar';
  };
  attributes: {
    icon: Schema.Attribute.String;
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
    photo: Schema.Attribute.String;
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
    authorImage: Schema.Attribute.String;
    authorName: Schema.Attribute.String;
    authorRole: Schema.Attribute.String;
    quote: Schema.Attribute.Text;
    rating: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<5>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'shared.faq-item': SharedFaqItem;
      'shared.icon-text-item': SharedIconTextItem;
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
