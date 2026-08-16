import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HomeContentService } from '../../../shared/services/home-content.service';
import { HomeSkills } from '../../../shared/models/home-content.model';

@Component({
  selector: 'app-ourskills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ourskills.component.html',
  styleUrl: './ourskills.component.scss'
})
export class OurskillsComponent implements OnInit {
  skills?: HomeSkills;
  titleHtml?: SafeHtml;

  constructor(private homeContentService: HomeContentService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.homeContentService.getSkills().subscribe(skills => {
      this.skills = skills;
      this.titleHtml = this.sanitizer.bypassSecurityTrustHtml(skills.titleHtml);
    });
  }
}
