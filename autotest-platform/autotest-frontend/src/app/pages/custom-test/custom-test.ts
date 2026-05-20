import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestService } from '../../services/test';
import { WebsocketService } from '../../services/websocket';
import { Result } from '../../components/result/result';

interface TestCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  examples: string[];
  checks: string[];
}

@Component({
  selector: 'app-custom-test',
  standalone: true,
  imports: [CommonModule, FormsModule, Result],
  templateUrl: './custom-test.html',
  styleUrls: ['./custom-test.scss']
})
export class CustomTest {
  // Step tracking
  currentStep = 1; // 1=URL, 2=Categories, 3=Config, 4=Result
  steps = ['Target', 'Categories', 'Configure', 'Results'];

  // Form values
  url = '';
  username = '';
  password = '';
  customInstruction = '';
  selectedCategories = new Set<string>();
  expandedCategory: string | null = null;

  // State
  isLoading = false;
  error = '';
  jobId = '';

  categories: TestCategory[] = [
    {
      id: 'functional',
      label: 'Functional Testing',
      icon: 'ti-list-check',
      description: 'Verifies all features work as expected',
      examples: ['Test login with valid/invalid credentials', 'Check form submissions', 'Verify CRUD operations'],
      checks: ['Button & link functionality', 'Form validation (valid + invalid inputs)', 'Login/logout/signup flows', 'Search, filter & sort features', 'File upload/download']
    },
    {
      id: 'security',
      label: 'Security Testing',
      icon: 'ti-shield-check',
      description: 'Checks for vulnerabilities and attack vectors',
      examples: ['SQL injection in all input fields', 'XSS script injection', 'Auth bypass attempts'],
      checks: ['SQL injection on all inputs', 'XSS script injection', 'CSRF protection', 'Auth & session security', 'Protected route access without login']
    },
    {
      id: 'ui',
      label: 'UI / UX Testing',
      icon: 'ti-layout',
      description: 'Validates design, layout and user experience',
      examples: ['Check alignment & spacing', 'Verify fonts & colors', 'Check broken images'],
      checks: ['Element alignment & spacing', 'Font & color consistency', 'Broken images detection', 'Navigation flow', 'No overlapping elements']
    },
    {
      id: 'responsive',
      label: 'Compatibility Testing',
      icon: 'ti-device-mobile',
      description: 'Tests across devices, browsers and screen sizes',
      examples: ['Mobile 375px viewport', 'Tablet 768px viewport', 'Desktop 1440px viewport'],
      checks: ['Mobile viewport (375px)', 'Tablet viewport (768px)', 'Desktop viewport (1440px)', 'Different screen resolutions']
    },
    {
      id: 'performance',
      label: 'Performance Testing',
      icon: 'ti-bolt',
      description: 'Measures speed, load time and resource usage',
      examples: ['Page load time', 'Time to interactive', 'Network request analysis'],
      checks: ['Page load time measurement', 'Time to first byte (TTFB)', 'Number of network requests', 'Total page size', 'Render blocking resources']
    },
    {
      id: 'accessibility',
      label: 'Accessibility Testing',
      icon: 'ti-accessible',
      description: 'Ensures the app is usable by everyone',
      examples: ['Keyboard navigation', 'Image alt text', 'Color contrast ratio'],
      checks: ['Keyboard navigation', 'Image alt attributes', 'Form label associations', 'Color contrast (WCAG AA)', 'Focus indicators visible']
    },
    {
      id: 'api',
      label: 'API Testing',
      icon: 'ti-api',
      description: 'Validates API endpoints, responses and status codes',
      examples: ['Check API response codes', 'Validate JSON structure', 'Test auth headers'],
      checks: ['API response status codes', 'Response format validation', 'Auth token handling', 'Error response handling', 'Request/response logging']
    },
    {
      id: 'database',
      label: 'Database Testing',
      icon: 'ti-database',
      description: 'Verifies data integrity between UI and backend',
      examples: ['Data persists after form submit', 'Deleted records removed', 'Data consistency'],
      checks: ['Form data persistence check', 'UI-backend data consistency', 'Error on invalid data', 'Constraint validation']
    },
    {
      id: 'regression',
      label: 'Regression Testing',
      icon: 'ti-refresh',
      description: 'Re-tests all major flows to catch regressions',
      examples: ['Full end-to-end workflow', 'All critical user paths', 'Post-update validation'],
      checks: ['Full login/logout cycle', 'Core user workflows', 'Critical form submissions', 'Navigation paths']
    }
  ];

  constructor(
    private testService: TestService,
    private wsService: WebsocketService,
    private cdr: ChangeDetectorRef
  ) {}

  toggleCategory(id: string) {
    if (this.selectedCategories.has(id)) {
      this.selectedCategories.delete(id);
    } else {
      this.selectedCategories.add(id);
    }
  }

  selectAll() {
    this.categories.forEach(c => this.selectedCategories.add(c.id));
  }

  clearAll() {
    this.selectedCategories.clear();
  }

  toggleExpand(id: string) {
    this.expandedCategory = this.expandedCategory === id ? null : id;
  }

  nextStep() {
    if (this.currentStep === 1 && !this.url.trim()) {
      this.error = 'Please enter a URL to continue';
      return;
    }
    if (this.currentStep === 2 && this.selectedCategories.size === 0) {
      this.error = 'Select at least one test category';
      return;
    }
    this.error = '';
    this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  runTests() {
    this.isLoading = true;
    this.error = '';

    this.testService.startCustomTest(
      this.url,
      this.username,
      this.password,
      Array.from(this.selectedCategories),
      this.customInstruction
    ).subscribe({
      next: (res) => {
        this.jobId = res.jobId;
        this.wsService.subscribeToJob(this.jobId);
        setTimeout(() => {
          this.currentStep = 4;
          this.isLoading = false;
          this.cdr.detectChanges();
        }, 800);
      },
      error: () => {
        this.isLoading = false;
        this.error = 'Cannot connect to backend. Is Spring Boot running?';
      }
    });
  }

  resetTest() {
    this.currentStep = 1;
    this.jobId = '';
    this.url = '';
    this.selectedCategories.clear();
    this.customInstruction = '';
  }

  get selectedCount() { return this.selectedCategories.size; }
  isSelected(id: string) { return this.selectedCategories.has(id); }
}