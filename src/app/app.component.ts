import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from './components/navbar/navbar.component';
import { NgxPaginationModule } from 'ngx-pagination';

import { HttpClient, HttpClientModule } from '@angular/common/http';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatToolbarModule,
    MatMenuModule,
    RouterModule,
    RouterOutlet,
    HttpClientModule,
    NavbarComponent,
    FormsModule,
  ],

  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent implements OnInit {
  title = 'spa-angular';

  isLoggedIn: boolean = false; // Menyimpan status login
  constructor(private router: Router) {} // Menambahkan router pada konstruktor

  ngOnInit() {
    // Memeriksa apakah ada token di localStorage
    this.isLoggedIn = !!localStorage.getItem('authToken');
    NgxPaginationModule
  }

  onLogout() {
    // Menghapus token dari localStorage saat logout
    localStorage.removeItem('authToken');
    this.isLoggedIn = false; // Mengubah status login menjadi false
    this.router.navigate(['/auth']); // Arahkan ke halaman login setelah logout
  }
  shouldShowNavbar(): boolean {
    const currentRoute = this.router.url;
    return currentRoute !== '/auth' && currentRoute !== '/register'; // Sembunyikan navbar untuk /auth dan /register
  }
}
