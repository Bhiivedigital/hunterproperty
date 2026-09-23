// Public, no API token: search engines fetch this directly.
export default {
  routes: [
    {
      method: 'GET',
      path: '/sitemap.xml',
      handler: 'sitemap.index',
      config: { auth: false },
    },
  ],
};
