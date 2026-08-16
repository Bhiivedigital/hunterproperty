import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HomeContentService } from '../../../shared/services/home-content.service';
import { HomeTeam } from '../../../shared/models/home-content.model';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss'
})
export class TeamComponent implements OnInit {
  team?: HomeTeam;
  titleHtml?: SafeHtml;

  constructor(private homeContentService: HomeContentService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.homeContentService.getTeam().subscribe(team => {
      this.team = team;
      this.titleHtml = this.sanitizer.bypassSecurityTrustHtml(team.titleHtml);
    });
  }
}
