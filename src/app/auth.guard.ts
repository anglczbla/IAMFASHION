import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('authToken');
    console.log('AuthGuard - token:', token); // Debugging
    if (token) {
      return true; // Izinkan akses jika token ada (untuk semua pengguna terautentikasi)
    }
    Swal.fire('Error', 'Silakan login untuk melanjutkan.', 'error');
    this.router.navigate(['/auth']); // Arahkan ke halaman login/auth
    return false;
  }
}