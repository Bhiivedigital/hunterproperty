import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

// Entry point for build-time prerendering only. Hostinger serves the output as
// static files; there is no Node server in production.
//
// The context carries the server platform the renderer created for this page.
// Without it bootstrapApplication falls back to a browser platform, which
// fails in Node with "document is not defined".
const bootstrap = (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context);

export default bootstrap;
