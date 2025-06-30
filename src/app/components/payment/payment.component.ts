import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import * as bootstrap from 'bootstrap';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
})
export class PaymentComponent implements OnInit {
  payments: any[] = [];
  orders: any[] = [];
  currentPage = 1;
  itemsPerPage = 5;
  isLoading = true;
  isSubmitting = false;
  editPaymentId: string | null = null;
  isModalShown: boolean = false;
  userRole: string | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  userPayments: any[] = [];
  showStatusModal = false;
  selectedPaymentForStatus: any = null;

  apiPaymentsUrl = 'https://be-iamfashion.vercel.app/api/payments';
  apiOrdersUrl = 'https://be-iamfashion.vercel.app/api/orders';

  paymentForm: FormGroup;
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  constructor() {
    this.paymentForm = this.fb.group({
      country: ['Indonesia', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      address: ['', Validators.required],
      apartment: [''],
      city: ['', Validators.required],
      province: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^\+?[\d\s-]{10,15}$/)],
      ],
      saveInfo: [false],
      orders_id: ['', Validators.required],
      amount: [
        { value: 0, disabled: true },
        [Validators.required, Validators.min(0)],
      ],
      paymentMethod: ['', Validators.required],
      status: ['pending'],
      paymentDate: [new Date()],
      proof: [''] // Adding proof field for existing proof URL
    });
  }

  provinces: string[] = [
    'Aceh',
    'Bali',
    'Banten',
    'Bengkulu',
    'DI Yogyakarta',
    'DKI Jakarta',
    'Gorontalo',
    'Jambi',
    'Jawa Barat',
    'Jawa Tengah',
    'Jawa Timur',
    'Kalimantan Barat',
    'Kalimantan Selatan',
    'Kalimantan Tengah',
    'Kalimantan Timur',
    'Kalimantan Utara',
    'Kepulauan Bangka Belitung',
    'Kepulauan Riau',
    'Lampung',
    'Maluku',
    'Maluku Utara',
    'Nusa Tenggara Barat',
    'Nusa Tenggara Timur',
    'Papua',
    'Papua Barat',
    'Papua Pegunungan',
    'Papua Barat Daya',
    'Papua Tengah',
    'Papua Selatan',
    'Riau',
    'Sulawesi Barat',
    'Sulawesi Selatan',
    'Sulawesi Tengah',
    'Sulawesi Tenggara',
    'Sulawesi Utara',
    'Sumatera Barat',
    'Sumatera Selatan',
    'Sumatera Utara',
  ];

 ngOnInit(): void {
    this.userRole = localStorage.getItem('userRole');
    this.getPayments();
    this.getOrders();

    const state = history.state;
    if (state?.orderId && !this.isModalShown) {
      this.paymentForm.patchValue({
        country: 'Indonesia',
        firstName: state.buyerName || '',
        lastName: '',
        address: '',
        apartment: '',
        city: '',
        province: '',
        postalCode: '',
        phone: '',
        saveInfo: false,
        orders_id: state.orderId,
        amount: state.totalPrice || 0,
        paymentMethod: '',
        status: 'pending',
        paymentDate: new Date(),
      });

      setTimeout(() => {
        const modalEl = document.getElementById('addPaymentModal');
        if (modalEl && !this.isModalShown) {
          const modal = new bootstrap.Modal(modalEl);
          modal.show();
          this.isModalShown = true;
        }
      }, 200);

      history.replaceState({}, document.title);
    }

    if (this.userRole !== 'admin') {
      // Auto refresh untuk user setiap 30 detik
      setInterval(() => {
        this.getUserPaymentsWithStatus();
      }, 30000);
      
      // Load initial data
      this.getUserPaymentsWithStatus();
    }
}
  

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire('Error!', 'Hanya file gambar (JPG, PNG) dan PDF yang diperbolehkan.', 'error');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        Swal.fire('Error!', 'Ukuran file maksimal 5MB.', 'error');
        return;
      }

      this.selectedFile = file;

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrl = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        this.previewUrl = null; // Reset preview for non-image files
      }
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    // Reset file input
    const fileInput = document.getElementById('proofFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  updatePaymentStatus(paymentId: string, newStatus: string): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.patch(
      `${this.apiPaymentsUrl}/${paymentId}/status`,
      { status: newStatus },
      { headers }
    ).subscribe({
      next: (response: any) => {
        Swal.fire('Sukses!', response.message, 'success');
        this.getPayments(); // Refresh data
      },
      error: (err) => {
        console.error('Error updating status:', err);
        Swal.fire('Error!', 'Gagal update status', 'error');
      }
    });
  }

  //method ini untuk user cek status:
  getUserPaymentsWithStatus(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get(`${this.apiPaymentsUrl}/user/status`, { headers }).subscribe({
      next: (data: any) => {
        this.userPayments = data;
      },
      error: (err) => console.error('Error:', err)
    });
  }

  // method ini untuk cek update status:
  // checkForStatusUpdates(): void {
  //   const recentlyUpdated = this.userPayments.filter(payment => {
  //     const updatedTime = new Date(payment.statusUpdatedAt);
  //     const now = new Date();
  //     const diffMinutes = (now.getTime() - updatedTime.getTime()) / (1000 * 60);
  //     return diffMinutes < 60 && payment.status !== 'pending'; // Update dalam 1 jam terakhir
  //   });

  //   if (recentlyUpdated.length > 0) {
  //     recentlyUpdated.forEach(payment => {
  //       const statusText = payment.status === 'confirmed' ? 'dikonfirmasi' : 'ditolak';
  //       Swal.fire({
  //         title: 'Update Status Payment',
  //         text: `Payment untuk Order #${payment.orders_id} telah ${statusText}`,
  //         icon: payment.status === 'confirmed' ? 'success' : 'error',
  //         timer: 5000
  //       });
  //     });
  //   }
  // }

  submitPayment(): void {
    if (this.paymentForm.valid) {
      this.isSubmitting = true;
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all form fields to FormData
      const paymentData = {
        ...this.paymentForm.value,
        amount: Number(this.paymentForm.get('amount')?.value),
        userId: localStorage.getItem('userId'),
      };

      // Append all data to FormData
      Object.keys(paymentData).forEach(key => {
        if (paymentData[key] !== null && paymentData[key] !== undefined) {
          formData.append(key, paymentData[key]);
        }
      });

      // Add file if selected
      if (this.selectedFile) {
        formData.append('proof', this.selectedFile, this.selectedFile.name);
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        Swal.fire(
          'Error!',
          'No authentication token found. Please log in.',
          'error'
        );
        this.isSubmitting = false;
        return;
      }

      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.post(this.apiPaymentsUrl, formData, { headers }).subscribe({
        next: (response: any) => {
          Swal.fire('Sukses!', 'Pembayaran berhasil dikirim.', 'success');
          this.paymentForm.reset({
            country: 'Indonesia',
            province: '',
            status: 'pending',
            paymentDate: new Date(),
          });
          this.removeSelectedFile(); // Clear file selection
          this.getPayments();
          this.closeModal('addPaymentModal');
          this.router.navigate(['/home'], {
            state: { paymentId: paymentData.orders_id },
          });
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error submitting payment:', err);
          let errorMessage = 'Pembayaran gagal dikirim. ';
          if (err.status === 401) {
            errorMessage += 'Unauthorized: Please log in again.';
          } else if (err.status === 403) {
            errorMessage +=
              'Access Denied: Check your permissions or contact admin.';
          } else if (err.status === 400) {
            errorMessage +=
              'Invalid data: ' + (err.error?.message || 'Check your input.');
          } else {
            errorMessage += 'Server error. Try again later.';
          }
          Swal.fire('Gagal!', errorMessage, 'error');
          this.isSubmitting = false;
        },
        complete: () => (this.isSubmitting = false),
      });
    } else {
      Swal.fire(
        'Form Tidak Valid',
        'Mohon lengkapi semua data yang wajib diisi.',
        'warning'
      );
      this.paymentForm.markAllAsTouched();
    }
  }

  routerNavigate():void{
    this.closeModal('addPaymentModal');
    this.router.navigate(['/products'])
  }

  getPayments(): void {
    this.isLoading = true;
    const token = localStorage.getItem('authToken');
    const headers = token
      ? new HttpHeaders().set('Authorization', `Bearer ${token}`)
      : undefined;
    this.http.get<any[]>(this.apiPaymentsUrl, { headers }).subscribe({
      next: (data) => {
        this.payments = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching payments:', err);
        alert('Failed to fetch payment. Please try again later.');
        this.isLoading = false;
      },
    });
  }

  getOrders(): void {
    this.isLoading = true;
    this.http.get<any[]>(this.apiOrdersUrl).subscribe({
      next: (data) => {
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

  deletePayment(id: string): void {
    if (confirm('Are you sure you want to delete this payment?')) {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      this.http.delete(`${this.apiPaymentsUrl}/${id}`, { headers }).subscribe({
        next: () => {
          this.getPayments();
          Swal.fire({
            icon: 'success',
            title: 'Payment Success to delete',
            text: 'Payment data has been successfully deleted.',
          });
        },
        error: (err) => console.error('Error deleting payment:', err),
      });
    }
  }

  getPaymentById(id: string): void {
    this.editPaymentId = id;
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    this.http.get<any>(`${this.apiPaymentsUrl}/${id}`, { headers }).subscribe({
      next: (data) => {
        this.paymentForm.patchValue(data);
        // Set preview if there's existing proof
        if (data.proof) {
          this.previewUrl = data.proof;
        }
        this.openModal('editPaymentModal');
      },
      error: (err) => console.error('Error fetching payment by ID:', err),
      complete: () => (this.isLoading = false),
    });
  }

  updatePayment(): void {
    if (this.paymentForm.valid && this.editPaymentId) {
      this.isSubmitting = true;
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all form fields to FormData
      const updateData = this.paymentForm.value;
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== null && updateData[key] !== undefined && key !== 'proof') {
          formData.append(key, updateData[key]);
        }
      });

      // Add file if selected (new file to replace existing one)
      if (this.selectedFile) {
        formData.append('proof', this.selectedFile, this.selectedFile.name);
      }

      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http
        .put(
          `${this.apiPaymentsUrl}/${this.editPaymentId}`,
          formData,
          { headers }
        )
        .subscribe({
          next: () => {
            this.getPayments();
            this.isSubmitting = false;
            this.removeSelectedFile(); // Clear file selection
            this.closeModal('editPaymentModal');
            Swal.fire('Sukses!', 'Data pembayaran berhasil diperbarui.', 'success');
          },
          error: (err) => {
            console.error('Error updating payment:', err);
            this.isSubmitting = false;
            Swal.fire('Error!', 'Gagal memperbarui data pembayaran.', 'error');
          },
        });
    }
  }

  viewProof(proofUrl: string): void {
    if (proofUrl) {
      // Open proof in new window/tab
      window.open(proofUrl, '_blank');
    } else {
      Swal.fire('Info', 'Bukti pembayaran tidak tersedia.', 'info');
    }
  }

  downloadProof(proofUrl: string, paymentId: string): void {
    if (proofUrl) {
      const link = document.createElement('a');
      link.href = proofUrl;
      link.download = `payment_proof_${paymentId}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    // Clear file selection when closing modal
    this.removeSelectedFile();
  }
}