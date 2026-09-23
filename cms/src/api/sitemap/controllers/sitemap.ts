export default ({ strapi }: { strapi: any }) => ({
  async index(ctx: any) {
    const xml = await strapi.service('api::sitemap.sitemap').build();
    ctx.type = 'application/xml; charset=utf-8';
    // Short cache: crawlers re-fetching within minutes get a cached copy, and a
    // newly published guide still appears within five minutes.
    ctx.set('Cache-Control', 'public, max-age=300');
    // Keep the XML itself out of search results.
    ctx.set('X-Robots-Tag', 'noindex');
    ctx.body = xml;
  },
});
