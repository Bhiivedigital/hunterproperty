import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HomeContentService } from '../../../shared/services/home-content.service';
import { IconTextItem } from '../../../shared/models/home-content.model';

@Component({
  selector: 'app-workingprocess',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workingprocess.component.html',
  styleUrl: './workingprocess.component.scss'
})
export class WorkingprocessComponent implements OnInit {
  tagline?: string;
  titleHtml?: SafeHtml;
  steps: IconTextItem[] = [];

  constructor(private homeContentService: HomeContentService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.homeContentService.getWorkingProcess().subscribe(data => {
      this.tagline = data.tagline;
      this.titleHtml = this.sanitizer.bypassSecurityTrustHtml(data.titleHtml);
      this.steps = data.steps ?? [];
    });
  }
}
