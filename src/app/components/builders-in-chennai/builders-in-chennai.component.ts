import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroLeadFormComponent } from '../homelayout/hero-lead-form/hero-lead-form.component';
import { AreaDirectoryService } from '../../shared/services/area-directory.service';
import { StructuredDataService, FaqEntry } from '../../shared/services/structured-data.service';
import { Area, ZONES, Zone } from '../../shared/seo/areas';
import { BUSINESS, PACKAGES } from '../../shared/seo/business';

const PATH = '/builders-in-chennai';

/** Example budgets shown in the cost table. */
const EXAMPLE_AREAS_SQFT = [1000, 1500, 2000];

/**
 * /builders-in-chennai/ — the hub for "builders in Chennai" searches. It sells
 * the service city-wide and links every published area guide, grouped by part
 * of the city, so each area page is one click from a page that is itself
 * linked from the header, footer and every area page.
 *
 * Title, description and canonical come from static-route-seo.json through
 * SeoService.applyRouteDefaults, like the other fixed routes.
 */
@Component({
  selector: 'app-builders-in-chennai',
  standalone: true,
  imports: [CommonModule, RouterLink, HeroLeadFormComponent],
  templateUrl: './builders-in-chennai.component.html',
  styleUrl: './builders-in-chennai.component.scss'
})
export class BuildersInChennaiComponent implements OnInit {
  readonly packages = PACKAGES;
  readonly offices = BUSINESS.offices;
  readonly telephone = BUSINESS.telephone;
  readonly exampleSizes = EXAMPLE_AREAS_SQFT;

  zones: { zone: Zone; areas: Area[] }[] = [];
  openFaq = 0;

  readonly faqs: FaqEntry[] = [
    {
      question: 'How much does it cost to build a house in Chennai in 2026?',
      answer: 'With Hunter Property, construction costs ₹2,199 per sq ft on the Basic package, ₹2,399 on Standard, ₹2,699 on Premium and ₹3,199 on Ultra Luxury. A 1,500 sq ft house on the Standard package is about ₹36 lakh for construction. Approval fees, soil testing, compound wall and interiors are quoted separately, and every quote lists what is and is not included.'
    },
    {
      question: 'Which areas of Chennai do you build in?',
      answer: 'We build across Chennai: North Chennai near our Perambur, Sembiam and Kolathur offices, Central Chennai from our Royapettah branch, West Chennai, South Chennai and the OMR corridor, and the southern suburbs along GST Road such as Chromepet, Tambaram and Guduvanchery. The area directory on this page links to a guide for each locality.'
    },
    {
      question: 'Do you handle the building plan approval?',
      answer: 'Yes. We prepare the drawings and file for approval with the right authority for your plot: the Greater Chennai Corporation for most individual houses inside city limits, Tambaram or Avadi City Municipal Corporation in those areas, and CMDA or DTCP where the building size or layout requires it. We check the plot documents and layout approval before design starts.'
    },
    {
      question: 'How long does it take to build an individual house in Chennai?',
      answer: 'Homes usually take 6 to 9 months and commercial buildings 8 to 12 months. The schedule depends on plot access, soil, the design and how quickly decisions on finishes are made; we share a detailed timeline during planning.'
    },
    {
      question: 'How do you make sure the quality is right?',
      answer: 'Every project follows a written specification with named brands for cement, steel, tiles and fittings. Our engineers check each stage (foundation, columns, slab, plastering, waterproofing, finishing) before the next starts, and you receive daily progress updates with photos from site.'
    },
    {
      question: 'How are payments made?',
      answer: 'Payments are stage-wise and tied to completed work, such as foundation, each slab and finishing, as set out in the construction agreement. You never pay far ahead of what has been built.'
    },
    {
      question: 'I searched for "builders near me". Do you have an office near me?',
      answer: 'We have four offices in Chennai: Perambur (head office), Sembiam, Royapettah and Kolathur. For sites elsewhere in the city, our engineers visit the plot for a free consultation before we quote.'
    }
  ];

  constructor(private areaDirectory: AreaDirectoryService, private structuredData: StructuredDataService) {}

  ngOnInit(): void {
    this.structuredData.setBreadcrumb([
      { name: 'Home', url: '/' },
      { name: 'Builders in Chennai', url: PATH }
    ]);
    this.structuredData.setFaq(this.faqs);
    this.structuredData.setService({
      name: 'House construction in Chennai',
      serviceType: 'House construction',
      description: 'Individual house, villa and building construction across Chennai, with plan approval, fixed per sq ft packages and stage-wise payments.',
      url: PATH
    });

    this.areaDirectory.getPublishedAreas().subscribe(areas => {
      this.zones = ZONES
        .map(zone => ({ zone, areas: areas.filter(area => area.zone === zone) }))
        .filter(group => group.areas.length);
      this.structuredData.setItemList('Builders in Chennai by area', areas.map(area => ({
        name: `Builders in ${area.name}`,
        url: this.areaDirectory.areaUrl(area)
      })));
    });
  }

  areaUrl(area: Area): string {
    return this.areaDirectory.areaUrl(area);
  }

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? -1 : index;
  }

  /** Rounded to the nearest ₹0.1 lakh for the table. */
  lakh(pricePerSqft: number, sqft: number): string {
    return (Math.round(pricePerSqft * sqft / 10000) / 10).toFixed(1);
  }
}
