import { Component } from '@angular/core';
import { HomeblogComponent } from "../homelayout/homeblog/homeblog.component";
import { BannerComponent } from "../homelayout/banner/banner.component";
import { FeatureareaComponent } from "../homelayout/featurearea/featurearea.component";
import { AboutsectionComponent } from "../homelayout/aboutsection/aboutsection.component";
import { ServicesectionComponent } from "../homelayout/servicesection/servicesection.component";
import { WorkingprocessComponent } from "../homelayout/workingprocess/workingprocess.component";
import { HomeportfolioComponent } from "../homelayout/homeportfolio/homeportfolio.component";
import { PricingComponent } from "../homelayout/pricing/pricing.component";
import { ProjectskillsComponent } from "../homelayout/projectskills/projectskills.component";
import { WhychooseusComponent } from "../homelayout/whychooseus/whychooseus.component";
import { TeamComponent } from "../homelayout/team/team.component";
import { RequestquoteComponent } from "../homelayout/requestquote/requestquote.component";
import { FaqComponent } from "../homelayout/faq/faq.component";

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [HomeblogComponent, BannerComponent, AboutsectionComponent, ServicesectionComponent, WorkingprocessComponent, HomeportfolioComponent, PricingComponent, ProjectskillsComponent, WhychooseusComponent, TeamComponent, RequestquoteComponent, FaqComponent],
  templateUrl: './landingpage.component.html',
  styleUrl: './landingpage.component.scss'
})
export class LandingpageComponent {

}
