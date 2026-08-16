import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LegalPageService } from '../../shared/services/legal-page.service';
import { LegalPage } from '../../shared/models/legal-page.model';

@Component({
  selector: 'app-terms-conditions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './terms-conditions.component.html',
  styleUrl: './terms-conditions.component.scss'
})
export class TermsConditionsComponent implements OnInit {

  page?: LegalPage;

  constructor(private legalPageService: LegalPageService) {}

  ngOnInit(): void {
    this.legalPageService.getPageBySlug('terms-and-conditions').subscribe(page => this.page = page);
  }
}
