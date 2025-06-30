import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
})
export class HistoryComponent implements OnInit {
  orders: any[] = [];
  payments: any[] = [];
  shipping: any[] = [];
  userRole: string | null = null;
  userId: string | null = null;
  isLoading = true;
  hasUserIdError = false; // Flag untuk menunjukkan error userId

  apiOrdersUrl = 'https://be-iamfashion.vercel.app/api/orders';
  apiPaymentsUrl = 'https://be-iamfashion.vercel.app/api/payments';
  apiShippingUrl = 'https://be-iamfashion.vercel.app/api/shipping';

  private http = inject(HttpClient);
  private router = inject(Router);

  ngOnInit(): void {
    this.userRole = localStorage.getItem('userRole');
    this.userId = localStorage.getItem('userId'); // Ambil userId dari localStorage
    console.log(this.userId);
    

    // Cek apakah userId ada dan valid
    if (!this.userId || this.userId.trim() === '') {
      this.hasUserIdError = true;
      console.warn('UserId tidak ditemukan atau tidak valid. Mengarahkan ke login...');
      this.router.navigate(['/auth']); // Arahkan ke halaman login jika userId tidak ada
      return;
    }

    this.hasUserIdError = false;
    this.getOrders();
    this.getPayments();
    this.getShipping();
  }

  getOrders(): void {
    if (!this.userId || this.hasUserIdError) return;
    this.isLoading = true;
    this.http.get<any[]>(`${this.apiOrdersUrl}?userId=${this.userId}`).subscribe({
      next: (data) => {
        // Ambil entri terbaru berdasarkan createdAt
        this.orders = data.length > 0 ? [data.reduce((latest, current) => 
          new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current)] : [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching orders:', err);
        this.isLoading = false;
      },
    });
  }

  getPayments(): void {
    if (!this.userId || this.hasUserIdError) return;
    this.http.get<any[]>(`${this.apiPaymentsUrl}?userId=${this.userId}`).subscribe({
      next: (data) => {
        // Ambil entri terbaru berdasarkan paymentDate
        this.payments = data.length > 0 ? [data.reduce((latest, current) => 
          new Date(latest.paymentDate) > new Date(current.paymentDate) ? latest : current)] : [];
      },
      error: (err) => {
        console.error('Error fetching payments:', err);
      },
    });
  }

  getShipping(): void {
    if (!this.userId || this.hasUserIdError) return;
    this.http.get<any[]>(`${this.apiShippingUrl}?userId=${this.userId}`).subscribe({
      next: (data) => {
        // Ambil entri terbaru berdasarkan shippingDate
        this.shipping = data.length > 0 ? [data.reduce((latest, current) => 
          new Date(latest.shippingDate) > new Date(current.shippingDate) ? latest : current)] : [];
      },
      error: (err) => {
        console.error('Error fetching shipping:', err);
      },
    });
  }
}