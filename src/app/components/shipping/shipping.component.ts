import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import * as bootstrap from 'bootstrap';
import { RajaOngkirService } from '../../rajaongkir.service';
import Swal from 'sweetalert2';
// import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-shipping',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './shipping.component.html',
  styleUrls: ['./shipping.component.css'],
})
export class ShippingComponent implements OnInit {
  shipping: any[] = [];
  payments: any[] = [];
  selectedService: any[] = [];
  isLoading = true;
  isSubmitting = false;
  editShippingId: string | null = null;
  userRole: string | null = null;

  // Tracking variables
  trackingForm: FormGroup;
  trackingResult: any = null;
  isTracking = false;

  apiShippingUrl = 'https://be-iamfashion.vercel.app/api/shipping';
  apiPaymentsUrl = 'https://be-iamfashion.vercel.app/api/payments';

  shippingForm: FormGroup;
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  constructor(private ongkirService: RajaOngkirService) {
    this.shippingForm = this.fb.group({
      payment_id: ['', Validators.required],
      shippingDate: [new Date()],
      destination: ['', Validators.required],
      origin: ['', Validators.required],
      weight: [1000, [Validators.required, Validators.min(1)]],
      courier: ['jne', Validators.required],
      waybill: [''], // Field untuk waybill
      status: ['pending'] // Field untuk status
    });

    // Form untuk tracking
    this.trackingForm = this.fb.group({
      waybill: ['', Validators.required],
      courier: ['jne', Validators.required]
    });
  }

  cityList = [
    { id: 31555, name: 'Jakarta Selatan' },
    { id: 31556, name: 'Jakarta Pusat' },
    { id: 31557, name: 'Jakarta Barat' },
    { id: 31558, name: 'Jakarta Timur' },
    { id: 31559, name: 'Jakarta Utara' },
    { id: 399, name: 'Surabaya' },
    { id: 501, name: 'Bandung' },
    { id: 505, name: 'Medan' },
    { id: 506, name: 'Bekasi' },
    { id: 507, name: 'Depok' },
    { id: 508, name: 'Semarang' },
    { id: 509, name: 'Makassar' },
    { id: 510, name: 'Palembang' },
    { id: 511, name: 'Tangerang' },
    { id: 512, name: 'Bogor' },
    { id: 513, name: 'Padang' },
    { id: 514, name: 'Malang' },
    { id: 515, name: 'Pekanbaru' },
    { id: 516, name: 'Balikpapan' },
    { id: 517, name: 'Bandar Lampung' },
    { id: 518, name: 'Samarinda' },
    { id: 519, name: 'Banjarmasin' },
    { id: 520, name: 'Yogyakarta' },
  ];

  destinationList = [
    { id: 31555, name: 'Jakarta Selatan' },
    { id: 31556, name: 'Jakarta Pusat' },
    { id: 31557, name: 'Jakarta Barat' },
    { id: 31558, name: 'Jakarta Timur' },
    { id: 31559, name: 'Jakarta Utara' },
    { id: 399, name: 'Surabaya' },
    { id: 501, name: 'Bandung' },
    { id: 505, name: 'Medan' },
    { id: 506, name: 'Bekasi' },
    { id: 507, name: 'Depok' },
    { id: 508, name: 'Semarang' },
    { id: 509, name: 'Makassar' },
    { id: 510, name: 'Palembang' },
    { id: 511, name: 'Tangerang' },
    { id: 512, name: 'Bogor' },
    { id: 513, name: 'Padang' },
    { id: 514, name: 'Malang' },
    { id: 515, name: 'Pekanbaru' },
    { id: 516, name: 'Balikpapan' },
    { id: 517, name: 'Bandar Lampung' },
    { id: 518, name: 'Samarinda' },
    { id: 519, name: 'Banjarmasin' },
    { id: 520, name: 'Yogyakarta' },
  ];

  courierList = [
    { code: 'jne', name: 'JNE' },
    { code: 'sicepat', name: 'SiCepat' },
    { code: 'anteraja', name: 'AnterAja' },
    { code: 'tiki', name: 'TIKI' },
    { code: 'jnt', name: 'J&T' },
    { code: 'ide', name: 'ID Express' },
    { code: 'sap', name: 'SAP Express' },
    { code: 'ncs', name: 'NCS' },
    { code: 'rex', name: 'REX' },
  ];

  statusList = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'success', label: 'Success' }
  ];

  services: any[] = [];
  loading: boolean = false;

  ngOnInit(): void {
    this.userRole = localStorage.getItem('userRole');
    this.getshipping();
    this.getPayments();
    console.log('🚀 Component initialized');
  }

  getshipping(): void {
    console.log('📦 Fetching shipping data...');
    this.isLoading = true;

    this.http.get<any[]>(this.apiShippingUrl).subscribe({
      next: (data) => {
        this.shipping = data;
        this.isLoading = false;
        console.log('✅ Shipping data loaded:', data);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Error fetching shipping:', err);
        Swal.fire('Error', 'Error fetching shipping: ' + err.message, 'error');
      },
    });
  }

  getPayments(): void {
    console.log('💳 Fetching payments data...');
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    this.http.get<any[]>(this.apiPaymentsUrl, { headers }).subscribe({
      next: (data) => {
        this.payments = data;
        console.log('✅ Payments data loaded:', data);
      },
      error: (err) => {
        console.error('❌ Error fetching payments:', err);
        Swal.fire('Error', 'Error fetching payments: ' + err.message, 'error');
      },
    });
  }

  addShipping(): void {
    console.log('➕ Adding shipping...');
    if (this.shippingForm.valid) {
      this.isSubmitting = true;
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      const body = {
        userId: localStorage.getItem('userId') || '',
        payment_id: this.shippingForm.get('payment_id')?.value,
        shippingDate: this.shippingForm.get('shippingDate')?.value,
        origin: this.shippingForm.get('origin')?.value,
        destination: this.shippingForm.get('destination')?.value,
        weight: this.shippingForm.get('weight')?.value,
        courier: this.shippingForm.get('courier')?.value,
        waybill: this.shippingForm.get('waybill')?.value,
        status: this.shippingForm.get('status')?.value
      };

      console.log('📤 Sending shipping data:', body);

      this.http.post(this.apiShippingUrl, body, { headers }).subscribe({
        next: (response) => {
          console.log('✅ Shipping added successfully:', response);
          this.getshipping();
          this.shippingForm.reset();
          this.isSubmitting = false;
          this.closeModal('addShippingModal');
          Swal.fire('Success', 'Shipping added successfully!', 'success');
          window.location.href = '/home';
        },
        error: (err) => {
          console.error('❌ Error adding shipping:', err);
          this.isSubmitting = false;
          Swal.fire('Error', 'Error adding shipping: ' + err.message, 'error');
        },
      });
    } else {
      console.warn('⚠️ Form is invalid');
    }
  }

  deleteShipping(id: string): void {
    console.log('🗑️ Deleting shipping:', id);
    if (confirm('Are you sure you want to delete this shipping record?')) {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      this.http.delete(`${this.apiShippingUrl}/${id}`, { headers }).subscribe({
        next: () => {
          console.log('✅ Shipping deleted successfully');
          this.getshipping();
          Swal.fire('Success', 'Shipping deleted successfully!', 'success');
        },
        error: (err) => {
          console.error('❌ Error deleting shipping:', err);
          Swal.fire(
            'Error',
            'Error deleting shipping: ' + err.message,
            'error'
          );
        },
      });
    }
  }

  getShippingById(id: string): void {
    console.log('🔍 Getting shipping by ID:', id);
    this.editShippingId = id;
    this.http.get<any>(`${this.apiShippingUrl}/${id}`).subscribe({
      next: (data) => {
        console.log('✅ Shipping data retrieved:', data);
        this.shippingForm.patchValue(data);
        this.openModal('editShippingModal');
      },
      error: (err) => {
        console.error('❌ Error fetching shipping by ID:', err);
        Swal.fire(
          'Error',
          'Error fetching shipping by ID: ' + err.message,
          'error'
        );
      },
    });
  }

  updateShipping(): void {
    console.log('🔄 Updating shipping...');
    if (this.shippingForm.valid && this.editShippingId) {
      this.isSubmitting = true;
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      const updateData = this.shippingForm.value;
      console.log('📤 Sending update data:', updateData);

      this.http
        .put(
          `${this.apiShippingUrl}/${this.editShippingId}`,
          updateData,
          { headers }
        )
        .subscribe({
          next: (response) => {
            console.log('✅ Shipping updated successfully:', response);
            this.getshipping();
            this.isSubmitting = false;
            this.closeModal('editShippingModal');
            Swal.fire('Success', 'Shipping updated successfully!', 'success');
          },
          error: (err) => {
            console.error('❌ Error updating shipping:', err);
            this.isSubmitting = false;
            Swal.fire(
              'Error',
              'Error updating shipping: ' + err.message,
              'error'
            );
          },
        });
    }
  }

  // Fungsi tracking resi
  trackPackage(): void {
    console.log('🔍 Starting package tracking...');
    if (this.trackingForm.valid) {
      this.isTracking = true;
      const { waybill, courier } = this.trackingForm.value;
      
      console.log('📦 Tracking data:', { waybill, courier });

      this.ongkirService.cekResi(waybill, courier).subscribe({
        next: (response) => {
          console.log('✅ Tracking result:', response);
          this.trackingResult = response;
          this.isTracking = false;
          
          if (response.data && response.data.tracking) {
            Swal.fire({
              title: 'Tracking Result',
              html: this.formatTrackingResult(response.data.tracking),
              icon: 'info',
              confirmButtonText: 'OK'
            });
          } else {
            Swal.fire('Info', 'No tracking information found', 'info');
          }
        },
        error: (err) => {
          console.error('❌ Error tracking package:', err);
          this.isTracking = false;
          Swal.fire('Error', 'Error tracking package: ' + (err.error?.message || err.message), 'error');
        }
      });
    } else {
      console.warn('⚠️ Tracking form is invalid');
      Swal.fire('Warning', 'Please fill in waybill and courier', 'warning');
    }
  }

  // Tracking dari shipping yang sudah ada
  trackExistingShipping(shipping: any): void {
    console.log('🔍 Tracking existing shipping:', shipping);
    if (!shipping.waybill || !shipping.courier) {
      Swal.fire('Warning', 'Waybill or courier not available for this shipping', 'warning');
      return;
    }

    this.isTracking = true;
    console.log('📦 Tracking existing shipping:', { waybill: shipping.waybill, courier: shipping.courier });

    this.ongkirService.cekResi(shipping.waybill, shipping.courier).subscribe({
      next: (response) => {
        console.log('✅ Tracking result for existing shipping:', response);
        this.isTracking = false;
        
        if (response.data && response.data.tracking) {
          Swal.fire({
            title: `Tracking: ${shipping.waybill}`,
            html: this.formatTrackingResult(response.data.tracking),
            icon: 'info',
            confirmButtonText: 'OK'
          });
        } else {
          Swal.fire('Info', 'No tracking information found', 'info');
        }
      },
      error: (err) => {
        console.error('❌ Error tracking existing shipping:', err);
        this.isTracking = false;
        Swal.fire('Error', 'Error tracking package: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  formatTrackingResult(tracking: any): string {
    if (!tracking || !tracking.history) {
      return '<p>No tracking history available</p>';
    }

    let html = `
      <div style="text-align: left;">
        <p><strong>Waybill:</strong> ${tracking.waybill || 'N/A'}</p>
        <p><strong>Service:</strong> ${tracking.service || 'N/A'}</p>
        <p><strong>Status:</strong> ${tracking.status || 'N/A'}</p>
        <hr>
        <h4>Tracking History:</h4>
    `;

    tracking.history.forEach((item: any, index: number) => {
      html += `
        <div style="margin-bottom: 10px; padding: 8px; border-left: 3px solid #007bff;">
          <p><strong>${item.date || 'N/A'}</strong></p>
          <p>${item.desc || item.description || 'No description'}</p>
          ${item.location ? `<p><small>📍 ${item.location}</small></p>` : ''}
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  openModal(modalId: string): void {
    console.log('🔓 Opening modal:', modalId);
    const modalElement = document.getElementById(modalId) as HTMLElement;
    if (modalElement) {
      const modalInstance =
        bootstrap.Modal.getInstance(modalElement) ||
        new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
  }

  closeModal(modalId: string): void {
    console.log('🔒 Closing modal:', modalId);
    const modalElement = document.getElementById(modalId) as HTMLElement;
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance?.hide();
    }
  }

  getCityName(id: number): string {
    const city = this.cityList.find((city) => city.id === id);
    return city ? city.name : id.toString();
  }

  getCourierName(code: string): string {
    const courier = this.courierList.find((c) => c.code === code);
    return courier ? courier.name : code.toUpperCase();
  }

  getStatusLabel(status: string): string {
    const statusItem = this.statusList.find((s) => s.value === status);
    return statusItem ? statusItem.label : status;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge bg-warning';
      case 'processing':
        return 'badge bg-info';
      case 'shipped':
        return 'badge bg-primary';
      case 'delivered':
        return 'badge bg-success';
      case 'cancelled':
        return 'badge bg-danger';
      case 'success':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  // Helper untuk debugging
  debugLog(message: string, data?: any): void {
    console.log(`🐛 DEBUG: ${message}`, data);
  }
}