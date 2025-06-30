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
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class ProductsListComponent implements OnInit {
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
  
    }
  
 
  
}
