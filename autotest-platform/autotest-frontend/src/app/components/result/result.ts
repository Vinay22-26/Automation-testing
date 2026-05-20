import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProgressComponent } from '../progress/progress';
import { WebsocketService } from '../../services/websocket';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule, ProgressComponent],
  templateUrl: './result.html',
  styleUrls: ['./result.scss']
})
export class Result implements OnInit, OnDestroy {
  @Input() jobId: string = '';
  
  progressLogs: string[] = [];
  report: any = null;
  isComplete: boolean = false;
  connectionStatus: boolean = false;
  private subs: Subscription[] = [];

  constructor(
    private router: Router,
    public wsService: WebsocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.wsService.connectionStatus$.subscribe(status => {
        this.connectionStatus = status;
        this.cdr.detectChanges();
      })
    );

    this.subs.push(
      this.wsService.progressMessages$.subscribe((msg) => {
        this.progressLogs = [...this.progressLogs, msg];
        this.cdr.detectChanges();
      })
    );

    this.subs.push(
      this.wsService.completedReport$.subscribe((report) => {
        this.report = report;
        this.isComplete = true;
        this.cdr.detectChanges();
      })
    );
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'WARN': return '⚠️';
      default: return 'ℹ️';
    }
  }

  getSeverityClass(severity: string): string {
    return severity === 'HIGH' ? 'high' : 'medium';
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}