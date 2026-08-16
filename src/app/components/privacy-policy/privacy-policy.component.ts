import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LegalPageService } from '../../shared/services/legal-page.service';
import { LegalPage } from '../../shared/models/legal-page.model';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss'
})
export class PrivacyPolicyComponent implements OnInit {

  page?: LegalPage;

  constructor(private legalPageService: LegalPageService) {}

  ngOnInit(): void {
    this.legalPageService.getPageBySlug('privacy-policy').subscribe(page => this.page = page);
  }
}
