import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private client: Client | null = null;

  progressMessages$ = new Subject<string>();
  completedReport$ = new Subject<any>();
  connectionStatus$ = new BehaviorSubject<boolean>(false);

  subscribeToJob(jobId: string): void {
    // Clean up any existing connection first
    if (this.client?.active) {
      this.client.deactivate();
    }

    this.client = new Client({
      // Use direct WebSocket URL instead of SockJS to avoid SSR issues
      brokerURL: 'ws://localhost:8080/ws/websocket',
      reconnectDelay: 3000,
      debug: (str) => console.log('[STOMP]', str),

      onConnect: () => {
        console.log('WebSocket connected!');
        this.connectionStatus$.next(true);

        // Subscribe to progress channel
        this.client!.subscribe(`/topic/progress/${jobId}`, (message) => {
          const body = JSON.parse(message.body);
          console.log('Progress received:', body.message);
          this.progressMessages$.next(body.message);
        });

        // Subscribe to completed channel
        this.client!.subscribe(`/topic/completed/${jobId}`, (message) => {
          const body = JSON.parse(message.body);
          console.log('Report received:', body);
          this.completedReport$.next(body.report);
        });
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },

      onDisconnect: () => {
        console.log('WebSocket disconnected');
        this.connectionStatus$.next(false);
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client?.active) {
      this.client.deactivate();
    }
  }
}