import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule]
})
export class NavbarComponent implements OnInit {
  isLoggedIn: boolean = false;
  userRole: string | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    // Check if user is logged in and get their role
    this.isLoggedIn = !!localStorage.getItem('authToken');
    this.userRole = localStorage.getItem('userRole');
    console.log('Navbar - userRole:', this.userRole, 'isLoggedIn:', this.isLoggedIn); // Debugging
  }

  onLogout() {
    // Clear auth token and role, then redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    this.isLoggedIn = false;
    this.userRole = null;
    this.router.navigate(['/home']);
  }
}