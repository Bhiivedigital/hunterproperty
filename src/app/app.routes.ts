import { Routes } from '@angular/router';
import { AboutComponent } from './components/about/about.component';
import { ContactusComponent } from './components/contactus/contactus.component';
import { HomelayoutComponent } from './components/homelayout/homelayout.component';
import { PortfolioComponent } from './components/portfolio/portfolio.component';
import { ServicesComponent } from './components/services/services.component';
import { ServiceDetailComponent } from './components/service-detail/service-detail.component';
import { CategoryPageComponent } from './components/category-page/category-page.component';
import { ContentDetailComponent } from './components/content-detail/content-detail.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { LandingpageComponent } from './components/landingpage/landingpage.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { TermsConditionsComponent } from './components/terms-conditions/terms-conditions.component';

export const routes: Routes = [
    // Explicit fixed routes must precede the dynamic :categorySlug routes below,
    // since Angular's router matches the array in order and the first match wins.
    {path:'', component:HomelayoutComponent},
    {path:'home', component:LandingpageComponent},
    {path:'about', component:AboutComponent},
    {path:'contactus', component:ContactusComponent},
    {path:'services', component:ServicesComponent},
    {path:'services/:slug', component:ServiceDetailComponent},
    {path:'portfolio', component:PortfolioComponent},
    {path:'privacy-policy', component:PrivacyPolicyComponent},
    {path:'terms-and-conditions', component:TermsConditionsComponent},
    {path:'not-found', component:NotFoundComponent},

    // SEO content hub: /:categorySlug (category listing) and /:categorySlug/:contentSlug
    // (individual guide). Must stay below every explicit route above.
    {path:':categorySlug/:contentSlug', component:ContentDetailComponent},
    {path:':categorySlug', component:CategoryPageComponent},

    {path:'**', component:NotFoundComponent}
];
