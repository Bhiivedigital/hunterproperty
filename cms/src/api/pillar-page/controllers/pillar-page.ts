import { factories } from '@strapi/strapi';

/**
 * A pillar page is a dynamic zone of blocks, and every visual block hangs its
 * image off a nested media field. Getting that back over the REST API means a
 * `populate[contentBlocks][on][blocks.x][populate][image]` for every component
 * — a query string the front end has to keep in lockstep with this schema, and
 * one Strapi rejects outright (400) the moment the two drift apart.
 *
 * Populating server-side instead means the client asks for a pillar page by
 * category slug and nothing else, and images can never go missing because a
 * caller forgot a populate key.
 */
const DEEP_POPULATE = {
  heroImage: true,
  category: { fields: ['name', 'slug', 'icon', 'description'] },
  quickLinks: { populate: { items: true } },
  seo: { populate: { ogImage: true } },
  contentBlocks: {
    on: {
      'blocks.content-section': { populate: { image: true } },
      'blocks.image-block': { populate: { image: true } },
      'blocks.banner': { populate: { image: true } },
      'blocks.video-section': { populate: { thumbnail: true } },
      'blocks.quick-links': { populate: { items: true } },
      'blocks.accordion': { populate: { items: true } },
      'blocks.faqs': { populate: { items: true } },
    },
  },
};

export default factories.createCoreController('api::pillar-page.pillar-page', () => ({
  async find(ctx) {
    ctx.query = { ...ctx.query, populate: DEEP_POPULATE as any };
    return await super.find(ctx);
  },

  async findOne(ctx) {
    ctx.query = { ...ctx.query, populate: DEEP_POPULATE as any };
    return await super.findOne(ctx);
  },
}));
