import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HomeContentService } from '../../../shared/services/home-content.service';
import { StatItem } from '../../../shared/models/home-content.model';

@Component({
  selector: 'app-projectskills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projectskills.component.html',
  styleUrl: './projectskills.component.scss'
})
export class ProjectskillsComponent implements OnInit {
  stats: StatItem[] = [];

  constructor(private homeContentService: HomeContentService) {}

  ngOnInit(): void {
    this.homeContentService.getStats().subscribe(data => this.stats = data.stats ?? []);
  }
}
