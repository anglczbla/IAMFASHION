import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { RouterLink, RouterOutlet } from '@angular/router';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-products',
  standalone: true,
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class ProductsComponent implements OnInit {
   products: any[] = []; // Menyimpan data produk
    productsForm!: FormGroup; // Form input produk
    apiUrl = 'https://be-iamfashion.vercel.app/api/products'; // Ganti dengan URL API kamu
    editProductId: string | null = null;
    isSubmitting = false;
    isLoading = true;
    editProductsId: string | null = null;
    selectedFile: File | null = null;

    onFileSelected(event: any): void {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
      }
    }
  
    constructor(private fb: FormBuilder, private http: HttpClient) {}
  
    ngOnInit(): void {
      this.productsForm = this.fb.group({
        nama: [''],
        deskripsi: [''],
        harga: [''],
        kategori: [''],
        brand: [''],
        size: [''],
      });
  
      this.getProducts();
    }
  
    getProducts(): void {
      this.isLoading = true;
      this.http.get<any[]>(this.apiUrl).subscribe(
        data => {
          this.products = data;
          console.log('Data Produk:', this.products);
          this.isLoading = false;
        },
        err => {
          console.error('Error fetching produk data:', err);
          this.isLoading = false;
        }
      );
    }
    
  
    // addProduct(): void {
    //   if (this.productsForm.valid) {
    //     const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    //     this.http.post(this.apiUrl, this.productsForm.value, { headers }).subscribe(() => {
    //       this.getProducts();
    //       this.productsForm.reset();
    //     });
    //   }
    // }
    addProduct(): void {
      if (this.productsForm.valid && this.selectedFile) {
        this.isSubmitting = true;

        const token = localStorage.getItem('authToken');
        const headers = { Authorization: `Bearer ${token}` };
        const formData = new FormData();

        formData.append('nama', this.productsForm.value.nama);
        formData.append('deskripsi', this.productsForm.value.deskripsi);
        formData.append('harga', this.productsForm.value.harga);
        formData.append('kategori', this.productsForm.value.kategori);
        formData.append('brand', this.productsForm.value.brand);
        formData.append('size', this.productsForm.value.size);
        formData.append('foto', this.selectedFile);
    
        this.http.post(this.apiUrl, formData, { headers }).subscribe({
          next: () => {
            this.getProducts();
            this.productsForm.reset();
            this.selectedFile = null;
            this.isSubmitting = false;
            const modalElement = document.getElementById('tambahProdukModal') as HTMLElement;
          if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modalInstance.hide();
          }
          },
          error: (err) => {
            console.error('Gagal menambahkan produk:', err);
            this.isSubmitting = false;
          }
        });
      }
    }
    
  
    editProduct(product: any): void {
      this.editProductId = product._id;
      this.productsForm.patchValue({
        nama: product.nama,
        deskripsi: product.deskripsi,
        harga: product.harga,
        kategori: product.kategori,
        brand: product.brand,
        size: product.size
      });
    }
  
    getProductById(id: string): void {
      this.editProductId = id;
      this.http.get<any>(`${this.apiUrl}/${id}`).subscribe({
        next: (data) => {
          this.productsForm.patchValue(data);
          this.openModal('editProductsModal');
        },
        error: (err) => {
          console.error('Error fetching order by ID:', err);
        },
      });
    }
  
    updateProduct(): void {
      if (this.productsForm.valid && this.editProductId) {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.http.put(`${this.apiUrl}/${this.editProductId}`, this.productsForm.value, { headers }).subscribe(() => {
          this.getProducts();
          this.productsForm.reset();
          this.editProductId = null;
        });
      }
    }
  
    deleteProduct(id: string): void {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
        this.getProducts();
      });
    }
    openModal(modalId: string): void {
        const modalElement = document.getElementById(modalId) as HTMLElement;
        if (modalElement) {
          const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
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
