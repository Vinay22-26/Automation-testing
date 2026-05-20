import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TestService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  startTest(url: string, username?: string, password?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/test`, { url, username, password, testMode: 'quick' });
  }

  startCustomTest(
    url: string,
    username: string,
    password: string,
    categories: string[],
    customInstruction: string
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/test`, {
      url,
      username,
      password,
      categories,
      customInstruction,
      testMode: 'custom'
    });
  }
}