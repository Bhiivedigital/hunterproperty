import { DefaultUrlSerializer, UrlTree } from '@angular/router';

export class TrailingSlashUrlSerializer extends DefaultUrlSerializer {
  override parse(url: string): UrlTree {
    const [path, hash] = url.split('#');
    const [pathOnly, query] = path.split('?');
    const normalizedPath = pathOnly.length > 1 && pathOnly.endsWith('/') ? pathOnly.slice(0, -1) : pathOnly;
    const normalizedUrl = normalizedPath + (query ? `?${query}` : '') + (hash ? `#${hash}` : '');
    return super.parse(normalizedUrl);
  }
}
