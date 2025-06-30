import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as bootstrap from 'bootstrap';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Interface untuk size order
interface SizeOrder {
  size: string;
  quantity: number;
}

@Component({
  selector: 'app-products-anak',
  standalone: true,
  templateUrl: './products-anak.component.html',
  styleUrls: ['./products-anak.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})

export class ProductsAnakComponent implements OnInit {
  products: any[] = [];
  productsForm!: FormGroup;
  apiUrl = 'https://be-iamfashion.vercel.app/api/products';
  cartApiUrl = 'https://be-iamfashion.vercel.app/api/cart';
  editProductId: string | null = null;
  isSubmitting = false;
  isLoading = true;
  selectedFile: File | null = null;
  showOrderForm = false;
  buyerName: string = '';
  selectedProduct: any = null;
  orderQty: number = 1;
  selectedSize: string = '';
  isLoggedIn: boolean = false;
  userRole: string | null = null;

  // Multiple sizes support
  selectedSizes: SizeOrder[] = [];
  currentSize: string = '';
  currentQuantity: number = 1;

  // Size management for forms
  sizes: { size: string; stok: number }[] = [];
  newSize: string = '';
  newStock: number = 0;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userRole = localStorage.getItem('userRole');
    this.isLoggedIn = !!localStorage.getItem('authToken');
    console.log('userRole:', this.userRole, 'isLoggedIn:', this.isLoggedIn);

    this.productsForm = this.fb.group({
      nama: [''],
      deskripsi: [''],
      harga: [''],
      kategori: ['anak'],
      brand: [''],
      foto: [''],
    });

    this.getProducts();
  }

  getProducts(): void {
    this.isLoading = true;
    this.http.get<any[]>(this.apiUrl).subscribe(
      (data) => {
        this.products = data.filter(
          (p) => p.kategori?.toLowerCase() === 'anak'
        );
        this.isLoading = false;
      },
      (err) => {
        console.error('Error fetching products:', err);
        this.isLoading = false;
      }
    );
  }

  // Size management methods
  addSize(): void {
    if (this.newSize.trim() && this.newStock >= 0) {
      const existingSize = this.sizes.find(
        (s) => s.size.toLowerCase() === this.newSize.toLowerCase()
      );
      if (existingSize) {
        Swal.fire('Error', 'Size sudah ada!', 'error');
        return;
      }

      this.sizes.push({
        size: this.newSize.trim().toUpperCase(),
        stok: this.newStock,
      });
      this.newSize = '';
      this.newStock = 0;
    }
  }

  removeSize(index: number): void {
    this.sizes.splice(index, 1);
  }

  resetSizes(): void {
    this.sizes = [];
    this.newSize = '';
    this.newStock = 0;
  }

  // Get available sizes for a product
  getAvailableSizes(product: any): any[] {
    return product.sizes?.filter((size: any) => size.stok > 0) || [];
  }

  // Multiple sizes management methods
  addSizeToOrder(size: string, quantity: number): void {
    if (!size || quantity <= 0) {
      Swal.fire('Error', 'Please select valid size and quantity', 'error');
      return;
    }

    const maxStock = this.getSizeStock(size);
    if (quantity > maxStock) {
      Swal.fire('Error', `Maximum quantity available for size ${size} is ${maxStock}`, 'error');
      return;
    }

    // Check if size already exists
    const existingIndex = this.selectedSizes.findIndex(s => s.size === size);
    if (existingIndex >= 0) {
      // Update quantity if size already exists
      this.selectedSizes[existingIndex].quantity = quantity;
    } else {
      // Add new size
      this.selectedSizes.push({ size, quantity });
    }

    // Reset current inputs
    this.currentSize = '';
    this.currentQuantity = 1;
  }

  removeSizeFromOrder(size: string): void {
    this.selectedSizes = this.selectedSizes.filter(s => s.size !== size);
  }

  getSizeStock(size: string): number {
    if (!this.selectedProduct) return 0;
    const sizeObj = this.selectedProduct.sizes?.find((s: any) => s.size === size);
    return sizeObj ? sizeObj.stok : 0;
  }

  getTotalQuantity(): number {
    return this.selectedSizes.reduce((total, sizeOrder) => total + sizeOrder.quantity, 0);
  }

  getTotalPrice(): number {
    const totalQty = this.getTotalQuantity();
    return this.selectedProduct ? totalQty * this.selectedProduct.harga : 0;
  }

  // Get selected size stock (for backward compatibility)
  getSelectedSizeStock(): number {
    if (!this.selectedProduct || !this.selectedSize) return 0;
    const sizeObj = this.selectedProduct.sizes?.find(
      (s: any) => s.size === this.selectedSize
    );
    return sizeObj?.stok || 0;
  }

  // Add to Cart with size selection
  addToCart(product: any): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      Swal.fire('Error', 'Please login to add items to cart', 'error');
      this.router.navigate(['/auth']);
      return;
    }

    // Check if product has sizes
    const availableSizes = this.getAvailableSizes(product);
    if (availableSizes.length === 0) {
      Swal.fire('Error', 'Product is out of stock', 'error');
      return;
    }

    // If only one size available, use it directly
    if (availableSizes.length === 1) {
      this.addToCartWithSize(product, availableSizes[0].size);
      return;
    }

    // Show size selection modal
    this.showSizeSelection(product, 'cart');
  }

  addToCartWithSize(product: any, size: string): void {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!userId) {
      Swal.fire('Error', 'User ID not available. Please login again.', 'error');
      this.router.navigate(['/auth']);
      return;
    }

    if (!size) {
      Swal.fire('Error', 'Size is required to add item to cart', 'error');
      return;
    }

    const quantity = 1;
    const total = product.harga * quantity;

    const cartItem = {
      userId,
      items: [
        {
          productId: product._id,
          quantity,
          total,
          foto: product.foto || '',
          size
        }
      ],
      total: total
    };

    console.log('Cart item to send:', cartItem);

    this.http
      .post<any>('https://be-iamfashion.vercel.app/api/cart', cartItem, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .subscribe({
        next: (res) => {
          Swal.fire('Success', 'Item added to cart!', 'success');
        },
        error: (err) => {
          console.error('Error adding to cart:', err);
          Swal.fire('Error', `Failed to add item to cart: ${err.error.message || 'Unknown error'}`, 'error');
        }
      });
  }

  // Show size selection modal
  showSizeSelection(product: any, action: 'cart' | 'order'): void {
    const availableSizes = this.getAvailableSizes(product);

    const sizeOptions = availableSizes
      .map(
        (size) =>
          `<option value="${size.size}">${size.size} (Stock: ${size.stok})</option>`
      )
      .join('');

    if (action === 'order') {
      // For orders, open the multiple sizes modal
      this.openOrderModal(product);
      return;
    }

    Swal.fire({
      title: 'Select Size',
      html: `
        <select id="sizeSelect" class="swal2-select">
          <option value="">Choose size...</option>
          ${sizeOptions}
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Add to Cart',
      preConfirm: () => {
        const selectedSize = (
          document.getElementById('sizeSelect') as HTMLSelectElement
        ).value;
        if (!selectedSize) {
          Swal.showValidationMessage('Please select a size');
          return false;
        }
        return selectedSize;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.addToCartWithSize(product, result.value);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onProductClick(product: any): void {
    const availableSizes = this.getAvailableSizes(product);
    if (availableSizes.length === 0) {
      Swal.fire('Error', 'Product is out of stock', 'error');
      return;
    }

    this.openOrderModal(product);
  }

  openOrderModal(product: any): void {
    this.selectedProduct = product;
    this.selectedSizes = []; // Reset selected sizes
    this.buyerName = '';
    this.currentSize = '';
    this.currentQuantity = 1;

    const modalElement = document.getElementById('orderModal') as HTMLElement;
    if (modalElement) {
      const modalInstance =
        bootstrap.Modal.getInstance(modalElement) ||
        new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
  }

  // Updated submitOrder method for multiple sizes
  submitOrder(): void {
    if (
      !this.selectedProduct ||
      this.selectedSizes.length === 0 ||
      !this.buyerName.trim()
      
    ) 
    {
      Swal.fire('Error', 'Please fill all required fields and select at least one size', 'error');
      return;
    }

    // Validate each size and quantity
    for (const sizeOrder of this.selectedSizes) {
      const maxStock = this.getSizeStock(sizeOrder.size);
      if (sizeOrder.quantity > maxStock) {
        Swal.fire('Error', `Maximum quantity available for size ${sizeOrder.size} is ${maxStock}`, 'error');
        return;
      }
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      Swal.fire('Error', 'User ID not available. Please login again.', 'error');
      return;
    }

    const totalQuantity = this.getTotalQuantity();
    const totalPrice = this.getTotalPrice();

    const order = {
      nama: this.buyerName,
      order: new Date().toISOString(),
      total: totalPrice,
      jumlahOrder: totalQuantity,
      products_id: [this.selectedProduct._id],
      userId: userId,
      sizes: this.selectedSizes // Send sizes array
    };

    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };

    // Generate HTML for order confirmation
    const sizesHtml = this.selectedSizes.map(sizeOrder => 
      `Size ${sizeOrder.size}: ${sizeOrder.quantity} pcs`
    ).join('<br>');

    Swal.fire({
      title: 'Confirm Order',
      html: `
        <strong>${this.selectedProduct.nama}</strong><br>
        ${sizesHtml}<br>
        Total Quantity: ${totalQuantity}<br>
        Total: Rp${totalPrice.toLocaleString()}
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Order Now',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.http
          .post<any>('https://be-iamfashion.vercel.app/api/orders', order, { headers })
          .subscribe({
            next: (res) => {
              Swal.fire('Success!', 'Your order has been created.', 'success');
              this.resetOrderForm();
              this.closeModal('orderModal');
              this.router.navigate(['/payments'], {
                state: {
                  orderId: res._id,
                  totalPrice: res.total,
                  buyerName: res.nama,
                  product: res.products_id,
                  orderQty: res.jumlahOrder,
                  sizes: res.sizes, // Send sizes array to payment
                },
              });
            },
            error: (err) => {
              Swal.fire('Failed!', 'Order could not be submitted.', 'error');
              console.error('Error submitting order:', err);
            },
          });
      }
    });
  }

  resetOrderForm(): void {
    this.selectedProduct = null;
    this.selectedSize = '';
    this.selectedSizes = [];
    this.orderQty = 1;
    this.buyerName = '';
    this.currentSize = '';
    this.currentQuantity = 1;
  }

  addProduct(): void {
    if (this.userRole !== 'admin') {
      Swal.fire('Error', 'You do not have permission to add products', 'error');
      return;
    }

    if (
      !this.productsForm.valid ||
      !this.selectedFile ||
      this.sizes.length === 0
    ) {
      Swal.fire(
        'Error',
        'Please fill all fields and add at least one size',
        'error'
      );
      return;
    }

    this.isSubmitting = true;
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    const formData = new FormData();

    formData.append('nama', this.productsForm.value.nama);
    formData.append('deskripsi', this.productsForm.value.deskripsi);
    formData.append('harga', this.productsForm.value.harga);
    formData.append('kategori', this.productsForm.value.kategori);
    formData.append('brand', this.productsForm.value.brand);
    formData.append('sizes', JSON.stringify(this.sizes));
    formData.append('foto', this.selectedFile);

    this.http.post(this.apiUrl, formData, { headers }).subscribe({
      next: () => {
        this.getProducts();
        Swal.fire('Success', 'Product successfully added', 'success');
        this.resetForm();
        this.closeModal('tambahProdukModal');
      },
      error: (err) => {
        console.error('Error adding product:', err);
        Swal.fire('Error', 'Failed to add product', 'error');
        this.isSubmitting = false;
      },
    });
  }

  getProductById(id: string): void {
    if (this.userRole !== 'admin') {
      Swal.fire(
        'Error',
        'You do not have permission to edit products',
        'error'
      );
      return;
    }

    this.editProductId = id;
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get(`${this.apiUrl}/${id}`, { headers }).subscribe({
      next: (data: any) => {
        this.productsForm.patchValue({
          nama: data.nama,
          deskripsi: data.deskripsi,
          harga: data.harga,
          kategori: data.kategori,
          brand: data.brand,
        });

        // Load existing sizes
        this.sizes = data.sizes || [];

        this.openModal('editProdukModal');
      },
      error: (err) => {
        console.error('Error fetching product:', err);
      },
    });
  }

  updateProduct(): void {
    if (this.userRole !== 'admin') {
      Swal.fire(
        'Error',
        'You do not have permission to update products',
        'error'
      );
      return;
    }

    if (
      !this.productsForm.valid ||
      !this.editProductId ||
      this.sizes.length === 0
    ) {
      Swal.fire(
        'Error',
        'Please fill all fields and add at least one size',
        'error'
      );
      return;
    }

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const formData = new FormData();

    formData.append('nama', this.productsForm.value.nama);
    formData.append('deskripsi', this.productsForm.value.deskripsi);
    formData.append('harga', this.productsForm.value.harga);
    formData.append('kategori', this.productsForm.value.kategori);
    formData.append('brand', this.productsForm.value.brand);
    formData.append('sizes', JSON.stringify(this.sizes));

    if (this.selectedFile) {
      formData.append('foto', this.selectedFile);
    }

    this.http
      .put(`${this.apiUrl}/${this.editProductId}`, formData, { headers })
      .subscribe({
        next: () => {
          this.getProducts();
          Swal.fire('Success', 'Product successfully updated', 'success');
          this.resetForm();
          this.closeModal('editProdukModal');
        },
        error: (err) => {
          console.error('Error updating product:', err);
          Swal.fire('Error', 'Failed to update product', 'error');
        },
      });
  }

  deleteProduct(id: string): void {
    if (this.userRole !== 'admin') {
      Swal.fire(
        'Error',
        'You do not have permission to delete products',
        'error'
      );
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem('authToken');
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

        this.http.delete(`${this.apiUrl}/${id}`, { headers }).subscribe({
          next: () => {
            this.getProducts();
            Swal.fire('Deleted!', 'Product has been deleted.', 'success');
          },
          error: (err) => {
            console.error('Error deleting product:', err);
            Swal.fire('Error', 'Failed to delete product', 'error');
          },
        });
      }
    });
  }

  resetForm(): void {
    this.productsForm.reset();
    this.selectedFile = null;
    this.editProductId = null;
    this.resetSizes();
    this.isSubmitting = false;
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