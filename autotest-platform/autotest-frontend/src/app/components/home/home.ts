import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TestService } from '../../services/test';
import { WebsocketService } from '../../services/websocket';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home {
  url: string = '';
  isLoading: boolean = false;
  error: string = '';

  constructor(
    private testService: TestService,
    private wsService: WebsocketService,
    private router: Router
  ) {}
  startTest(): void {
  if (!this.url.trim()) {
    this.error = 'Please enter a valid URL';
    return;
  }

  console.log('Starting test for:', this.url);
  this.isLoading = true;
  this.error = '';

  this.testService.startTest(this.url).subscribe({
    next: (response) => {
      const jobId = response.jobId;
      console.log('Got jobId:', jobId);

      // Subscribe to WebSocket FIRST before navigating
      this.wsService.subscribeToJob(jobId);

      // Wait 1 second for WebSocket to connect, then navigate
      setTimeout(() => {
        this.router.navigate(['/result', jobId]);
      }, 1000);
    },
    error: (err) => {
      console.error('Error:', err);
      this.isLoading = false;
      this.error = 'Could not connect to testing engine. Make sure Spring Boot is running.';
    }
  });
}

  
}
