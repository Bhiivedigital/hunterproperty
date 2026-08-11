import { Component } from '@angular/core';
import { BannerComponent } from './banner/banner.component';
import { FeatureareaComponent } from './featurearea/featurearea.component';
import { AboutsectionComponent } from './aboutsection/aboutsection.component';
import { ServicesectionComponent } from './servicesection/servicesection.component';
import { OurskillsComponent } from './ourskills/ourskills.component';
import { HomeportfolioComponent } from './homeportfolio/homeportfolio.component';
import { PricingComponent } from "./pricing/pricing.component";
import { WhychooseusComponent } from './whychooseus/whychooseus.component';
import { TeamComponent } from "./team/team.component";
import { FaqComponent } from './faq/faq.component';
import { BlogComponent } from "../blog/blog.component";
import { HomeblogComponent } from './homeblog/homeblog.component';
import { WorkingprocessComponent } from './workingprocess/workingprocess.component';
import { ProjectskillsComponent } from './projectskills/projectskills.component';
import { RequestquoteComponent } from "./requestquote/requestquote.component";

@Component({
  selector: 'app-homelayout',
  standalone: true,
  imports: [BannerComponent, FeatureareaComponent, AboutsectionComponent, ServicesectionComponent, HomeportfolioComponent, PricingComponent, PricingComponent, WhychooseusComponent, TeamComponent, FaqComponent, HomeblogComponent, WorkingprocessComponent, ProjectskillsComponent, RequestquoteComponent],
  templateUrl: './homelayout.component.html',
  styleUrl: './homelayout.component.scss'
})
export class HomelayoutComponent {

}
