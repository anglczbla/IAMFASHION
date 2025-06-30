import { Component } from '@angular/core';
import {  RouterOutlet } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';  // Mengimpor RouterModule
import { Router } from '@angular/router';  // Mengimpor Route
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    
    MatListModule,
    RouterOutlet,
    RouterModule,
    CommonModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  // Fungsi untuk scroll ke div tertentu
  gotoDiv(page: string): void {
    const element = document.getElementById(page);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
  // isLoggedIn: boolean = false; // Menyimpan status login
  // constructor(private router: Router) { } // Menambahkan router pada konstruktor
  
  // ngOnInit() {
  //   // Memeriksa apakah ada token di localStorage
  //   this.isLoggedIn = !!localStorage.getItem('authToken');
  // }

  // onLogout() {
  //   // Menghapus token dari localStorage saat logout
  //   localStorage.removeItem('authToken');
  //   this.isLoggedIn = false; // Mengubah status login menjadi false
  //   this.router.navigate(['/auth']); // Arahkan ke halaman login setelah logout
  // }

}
