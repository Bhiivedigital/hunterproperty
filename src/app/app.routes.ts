import { Routes } from '@angular/router';
import { AboutComponent } from './components/about/about.component';
import { ContactusComponent } from './components/contactus/contactus.component';
import { HomelayoutComponent } from './components/homelayout/homelayout.component';
import { PortfolioComponent } from './components/portfolio/portfolio.component';
import { BlogComponent } from './components/blog/blog.component';
import { ServicesComponent } from './components/services/services.component';
import { LandingpageComponent } from './components/landingpage/landingpage.component';

export const routes: Routes = [
    {path:'', component:HomelayoutComponent},
    {path:'about', component:AboutComponent},
    {path:'contactus', component:ContactusComponent},
    {path:'services', component:ServicesComponent},
    {path:'portfolio', component:PortfolioComponent},
     {path:'blog', component:BlogComponent},
     {path:'home', component:LandingpageComponent}

];
