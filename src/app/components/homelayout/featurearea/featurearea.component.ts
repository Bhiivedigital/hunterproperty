import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HomeContentService } from '../../../shared/services/home-content.service';
import { IconTextItem } from '../../../shared/models/home-content.model';

@Component({
  selector: 'app-featurearea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './featurearea.component.html',
  styleUrl: './featurearea.component.scss'
})
export class FeatureareaComponent implements OnInit {
  items: IconTextItem[] = [];

  constructor(private homeContentService: HomeContentService) {}

  ngOnInit(): void {
    this.homeContentService.getFeatures().subscribe(features => this.items = features.items ?? []);
  }
}
