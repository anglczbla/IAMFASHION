import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ReviewComponent implements OnInit {
[x: string]: any;
  reviews: any[] = [];
  reviewForm!: FormGroup;
  orders: any[] = [];
  editReviewId: string | null = null;
  isSubmitting = false;
  isLoading = true;
  userRole: string | null = null;
  reviewUrl = 'https://be-iamfashion.vercel.app/api/review';
  purchasedProductsUrl = 'https://be-iamfashion.vercel.app/api/review/purchased-products';

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.userRole = localStorage.getItem('userRole');
    this.reviewForm = this.fb.group({
      nama: ['', Validators.required],
      orders_id: ['', Validators.required],
      pesan: ['', [Validators.required, Validators.minLength(5)]],
      rating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
    });

    this.getReviews();
    this.getPurchasedOrders();
  }

  getReviews(): void {
    this.http.get<any[]>(this.reviewUrl).subscribe({
      next: (data) => {
        console.log('Data reviews dari API:', data);
        this.reviews = data.map(review => ({
          ...review,
          products_id: Array.isArray(review.products_id) ? review.products_id : [review.products_id].filter(id => id), // Handle jika products_id adalah string
          orders_id: review.orders_id || { nama: 'Tidak tersedia' }
        }));
      },
      error: (err) => {
        console.error('Error fetching reviews data:', err);
        alert('Failed to fetch reviews. Please try again later.');
      },
    });
  }

  getPurchasedOrders(): void {
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    this.isLoading = true;
    this.http.get<any[]>(this.purchasedProductsUrl, { headers }).subscribe({
      next: (data) => {
        console.log('Data orders dari API:', data);
        this.orders = data.map(order => ({
          ...order,
          products_id: Array.isArray(order.products_id) ? order.products_id : [],
          nama: order.nama || 'Tidak tersedia'
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching purchased orders data:', err);
        // alert('Failed to fetch purchased orders. Please try again later.');
        this.isLoading = false;
      },
    });
  }

  addReview(): void {
    if (this.reviewForm.valid) {
      console.log(this.reviewForm.valid)
      this.isSubmitting = true;
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      const reviewData = {
        nama: this.reviewForm.value.nama,
        orders_id: this.reviewForm.value.orders_id,
        pesan: this.reviewForm.value.pesan,
        rating: this.reviewForm.value.rating
      };

      this.http
        .post(this.reviewUrl, reviewData, { headers })
        .subscribe({
          next: (response) => {
            console.log('Response dari addReview:', response);
            this.getReviews();
            Swal.fire({
              icon: 'success',
              title: 'Review Accepted',
              text: 'Review data has been successfully saved.',
            });
            this.reviewForm.reset();
            this.isSubmitting = false;
            this.closeModal('tambahReviewModal');
          },
          error: (err) => {
            console.error('Error adding review:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.message || 'Failed to add review.',
            });
            this.isSubmitting = false;
          },
        });
    }
  }

  deleteReview(id: string): void {
    if (confirm('Apakah Anda yakin ingin menghapus review ini?')) {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      this.http.delete(`${this.reviewUrl}/${id}`, { headers }).subscribe({
        next: () => {
          this.getReviews();
          console.log(`Review dengan ID ${id} berhasil dihapus`);
        },
        error: (err) => {
          console.error('Error deleting review:', err);
        },
      });
    }
  }

  openModal(modalId: string): void {
    const modalElement = document.getElementById(modalId) as HTMLElement;
    if (modalElement) {
      const modalInstance =
        bootstrap.Modal.getInstance(modalElement) ||
        new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
  }

  closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId) as HTMLElement;
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance?.hide();
    }
  }
}