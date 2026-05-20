import { Routes } from '@angular/router';
import { QuickScanComponent } from './pages/quick-scan/quick-scan';
import { Result } from './components/result/result';
import { CustomTest } from './pages/custom-test/custom-test';
import { Dashboard } from './pages/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'quick-scan',
    pathMatch: 'full'
  },
  {
    path: 'quick-scan',
    component:QuickScanComponent
  },
  {
    path: 'custom-test',
    component:CustomTest
  },
  {
    path: 'dashboard',
   component:Dashboard
  },
  {
    path: 'history',
   component:History
  },
  {
    path: 'result/:jobId',
    component:Result
  },
];