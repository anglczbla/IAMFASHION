import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Validators,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';
import { NgxPaginationModule } from 'ngx-pagination';
import { RouterLink, RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-orders',
  standalone: true,
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  products: any[] = [];
  currentPage = 1;
  itemsPerPage = 5;
  isLoading = true;
  isSubmitting = false;
  editOrderId: string | null = null;
  
  // Property untuk detail order
  selectedOrder: any = null;

  apiOrdersUrl = 'https://be-iamfashion.vercel.app/api/orders'; // Set the correct API endpoint
  apiProductsUrl = 'https://be-iamfashion.vercel.app/api/products'; // Set the correct API endpoint

  orderForm: FormGroup;
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  constructor() {
    this.orderForm = this.fb.group({
      nama: ['', Validators.required], // Nama wajib diisi
      order: ['', Validators.required], // Order wajib diisi (misalnya, tanggal)
      total: [0, Validators.required], // Total harus diisi, default 0
      jumlahOrder: [1, Validators.required], // Jumlah order harus diisi, default 1
      products_id: ['', Validators.required], // Produk harus dipilih
    });
  }

  ngOnInit(): void {
    this.getOrders();
    this.getProducts();
  }

  recapData: any[] = [];
  recapType: string = 'daily';
  totalPesanan: number = 0; // Variabel untuk menyimpan total pesanan
  totalHarga: number = 0; // Variabel untuk menyimpan total harga
  showRecap: boolean = false;
  userRole: string | null = null;

  /**
   * Fungsi untuk melihat detail order
   * @param order - Order yang akan ditampilkan detailnya
   */
  viewOrderDetail(order: any): void {
    console.log('Selected order for detail:', order);
    this.selectedOrder = { ...order }; // Clone object untuk menghindari reference issues
    
    // Debug log untuk memastikan data tersedia
    console.log('Selected order products:', this.selectedOrder.products_id);
    console.log('Selected order sizes:', this.selectedOrder.sizes);
  }

  getRecap(type: 'daily' | 'weekly' | 'monthly'): void {
    this.isLoading = true;
    const token = localStorage.getItem('authToken');
    console.log('Token retrieved from localStorage:', token);
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    console.log('Headers sent with request:', headers);

    this.http
      .get<any[]>(`${this.apiOrdersUrl}/recap?type=${type}`, { headers })
      .subscribe({
        next: (data) => {
          this.recapData = data.map((item) => ({
            period: item._id,
            totalOrders: item.totalOrders,
            totalAmount: item.totalAmount,
          }));
          this.recapType = type;
          // Hitung total pesanan dan total harga
          this.totalPesanan = this.recapData.reduce(
            (sum, item) => sum + item.totalOrders,
            0
          );
          this.totalHarga = this.recapData.reduce(
            (sum, item) => sum + item.totalAmount,
            0
          );

          this.isLoading = false;
        },
        error: (err) => {
          console.error(`Error fetching ${type} recap:`, err);
          if (err.status === 401) {
            Swal.fire({
              icon: 'error',
              title: 'Unauthorized',
              text: 'Your session has expired. Please log in again.',
            }).then(() => {
              localStorage.removeItem('authToken');
            });
          } else if (err.status === 500) {
            Swal.fire({
              icon: 'error',
              title: 'Server Error',
              text: 'An error occurred on the server. Please try again later or contact support.',
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: `Failed to fetch ${type} recap. Please try again later.`,
            });
          }
          this.isLoading = false;
        },
      });
  }

  // Fungsi untuk menampilkan rekap saat tombol "SEE RECAP" diklik
  showRecapSection(): void {
    this.showRecap = true;
    this.getRecap('daily'); // Tampilkan rekap harian secara default saat tombol diklik
  }

  getOrders(): void {
    this.isLoading = true;
    this.http.get<any[]>(this.apiOrdersUrl).subscribe({
      next: (data) => {
        console.log('Raw orders data:', data);
        console.log('First order structure:', data[0]);
        console.log('Products in first order:', data[0]?.products_id);
        this.orders = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching orders data:', err);
        alert('Failed to fetch orders. Please try again later.');
        this.isLoading = false;
      },
    });
  }

  getProducts(): void {
    this.http.get<any[]>(this.apiProductsUrl).subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (err) => {
        console.error('Error fetching products data:', err);
        alert('Failed to fetch products. Please try again later.');
      },
    });
  }

  addOrder(): void {
    if (this.orderForm.valid) {
      this.isSubmitting = true;

      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('userId tidak ditemukan di localStorage');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'User ID tidak tersedia. Silakan login ulang.',
        });
        this.isSubmitting = false;
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const body = {
        ...this.orderForm.value,
        userId: userId, // Pastikan userId selalu disertakan
      };

      console.log('Data yang dikirim ke backend:', body); // Debug untuk memverifikasi

      this.http.post(this.apiOrdersUrl, body, { headers }).subscribe({
        next: (response) => {
          console.log('Order successfully added:', response);
          this.getOrders();
          Swal.fire({
            icon: 'success',
            title: 'Order Successful',
            text: 'Order data has been successfully saved.',
          });
          this.orderForm.reset();
          this.isSubmitting = false;

          const modalElement = document.getElementById('tambahOrderModal') as HTMLElement;
          if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modalInstance.hide();
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
          }
        },
        error: (err) => {
          console.error('Error adding order:', err);
          this.isSubmitting = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to add order: ' + err.message,
          });
        },
      });
    } else {
      console.log('Form tidak valid:', this.orderForm.errors);
    }
  }

  deleteOrder(id: string): void {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Token tidak ditemukan. Pengguna belum login.');
        return;
      }

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      this.http.delete(`${this.apiOrdersUrl}/${id}`, { headers }).subscribe({
        next: () => {
          this.getOrders(); // Changed from getProducts() to getOrders()
          Swal.fire({
            icon: 'success',
            title: 'Orders Success to delete',
            text: 'Orders data has been successfully deleted.',
          });
          console.log(`Order dengan ID ${id} berhasil dihapus`);
        },
        error: (err) => {
          console.error('Error deleting order:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete order.',
          });
        },
      });
    }
  }

  getOrderById(id: string): void {
    this.editOrderId = id;
    this.http.get<any>(`${this.apiOrdersUrl}/${id}`).subscribe({
      next: (data) => {
        this.orderForm.patchValue(data);
        this.openModal('editOrderModal');
      },
      error: (err) => {
        console.error('Error fetching order by ID:', err);
      },
    });
  }

  updateOrder(): void {
    // Pastikan form valid dan sedang dalam mode edit
    if (this.orderForm.valid && this.editOrderId) {
      this.isSubmitting = true;

      // Ambil token autentikasi dari localStorage
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      // Lakukan request PUT ke endpoint API
      this.http
        .put(`${this.apiOrdersUrl}/${this.editOrderId}`, this.orderForm.value, {
          headers,
        })
        .subscribe({
          next: () => {
            // Refresh data orders
            this.getOrders();
            Swal.fire({
              icon: 'success',
              title: 'Orders Success to update',
              text: 'Orders data has been successfully updated.',
            });
            this.isSubmitting = false;

            // Reset form dan state
            this.orderForm.reset();
            this.editOrderId = null;

            // Tutup modal jika ada
            const modalElement = document.getElementById(
              'editOrderModal'
            ) as HTMLElement;
            if (modalElement) {
              const modalInstance = bootstrap.Modal.getInstance(modalElement);
              modalInstance?.hide();
            }
          },
          error: (err) => {
            console.error('Error updating order:', err);
            this.isSubmitting = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to update order.',
            });
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