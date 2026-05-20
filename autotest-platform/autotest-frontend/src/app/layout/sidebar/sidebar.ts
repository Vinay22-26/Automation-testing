import { Component } from '@angular/core';
import {  RouterLinkActive, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule,  CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar {
  navItems = [
    {
      section: 'TESTING',
      items: [
        { label: 'Quick scan', icon: 'ti-rocket', route: '/quick-scan' },
        { label: 'Custom test', icon: 'ti-list-check', route: '/custom-test', badge: 'New' },
        { label: 'Scheduled', icon: 'ti-clock-play', route: '/scheduled', soon: true },
      ]
    },
    {
      section: 'REPORTS',
      items: [
        { label: 'Dashboard', icon: 'ti-chart-bar', route: '/dashboard' },
        { label: 'History', icon: 'ti-history', route: '/history' },
      ]
    },
    {
      section: 'WORKSPACE',
      items: [
        { label: 'Projects', icon: 'ti-building', route: '/projects', soon: true },
        { label: 'Team', icon: 'ti-users', route: '/team', soon: true },
        { label: 'Settings', icon: 'ti-settings', route: '/settings', soon: true },
      ]
    }
  ];
}