import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Result } from '../../components/result/result';
import { TestService } from '../../services/test';
import { WebsocketService } from '../../services/websocket';

@Component({
  selector: 'app-quick-scan',
  standalone: true,
  imports: [CommonModule, FormsModule, Result],
  templateUrl: './quick-scan.html',
  styleUrls: ['./quick-scan.scss']
})
export class QuickScanComponent {
  url = '';
  username = '';
  password = '';
  selectedCategories = new Set(['security', 'functional', 'session']);
  isLoading = false;
  error = '';
  jobId = '';
  showResult = false;

  categories = [
    { id: 'functional', label: 'Functional', icon: 'ti-forms', sub: 'Forms, buttons, CRUD' },
    { id: 'security', label: 'Security', icon: 'ti-shield-check', sub: 'XSS, SQLi, auth bypass' },
    { id: 'session', label: 'Session & Auth', icon: 'ti-lock', sub: 'Login, logout, guards' },
    { id: 'responsive', label: 'Responsive', icon: 'ti-device-mobile', sub: 'Mobile, tablet, desktop' },
    { id: 'performance', label: 'Performance', icon: 'ti-bolt', sub: 'Load time, speed' },
    { id: 'accessibility', label: 'Accessibility', icon: 'ti-accessible', sub: 'WCAG, keyboard nav' },
  ];

  constructor(
    private testService: TestService,
    private wsService: WebsocketService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  toggleCategory(id: string) {
    if (this.selectedCategories.has(id)) {
      this.selectedCategories.delete(id);
    } else {
      this.selectedCategories.add(id);
    }
  }

  isSelected(id: string) {
    return this.selectedCategories.has(id);
  }

  startTest() {
    if (!this.url.trim()) {
      this.error = 'Please enter a URL';
      return;
    }
    this.isLoading = true;
    this.error = '';

    this.testService.startTest(this.url, this.username, this.password).subscribe({
      next: (res) => {
        this.jobId = res.jobId;
        this.showResult = true;
        this.isLoading = false;
        this.wsService.subscribeToJob(this.jobId);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.error = 'Cannot connect to backend. Is Spring Boot running on port 8080?';
        this.cdr.detectChanges();
      }
    });
  }

  resetTest() {
    this.showResult = false;
    this.jobId = '';
    this.url = '';
    this.cdr.detectChanges();
  }
}