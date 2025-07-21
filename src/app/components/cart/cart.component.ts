import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  imports: [CommonModule, FormsModule],
})
export class CartComponent implements OnInit {
  cart: any = { items: [], total: 0 };
  token: string | null = localStorage.getItem('authToken');
  userName: string = ''; // Input nama pengguna
  apiUrl = 'https://be-iamfashion.vercel.app/api/cart';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    if (!this.token) {
      Swal.fire('Error!', 'Silakan login terlebih dahulu.', 'error');
      return;
    }

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.token}`
    );
    this.http.get<any>(this.apiUrl, { headers }).subscribe({
      next: (data) => {
        this.cart = data || { items: [], total: 0 };
        console.log('Loaded cart:', this.cart); // Debug
      },
      error: (err) => {
        console.error('Error loading cart:', err);
        this.cart = { items: [], total: 0 };
      },
    });
  }

  addToCart(productId: string, quantity: number) {
    if (!this.token || !productId || !quantity || quantity <= 0) {
      Swal.fire('Error!', 'Data tidak valid atau silakan login.', 'error');
      return;
    }

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.token}`
    );
    this.http
      .post<any>(`${this.apiUrl}`, { productId, quantity }, { headers })
      .subscribe({
        next: (data) => {
          this.cart = data || this.cart;
          Swal.fire('Sukses!', 'Produk ditambahkan ke keranjang.', 'success');
          this.loadCart(); // Refresh cart
        },
        error: (err) => {
          console.error('Error adding to cart:', err);
          Swal.fire(
            'Error!',
            err.error?.message || 'Gagal menambahkan ke keranjang.',
            'error'
          );
        },
      });
  }

  removeFromCart(productId: string, size: string) {
    if (!this.token || !productId) {
      Swal.fire('Error!', 'Data tidak valid atau silakan login.', 'error');
      return;
    }

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.token}`
    );

    // Kirim size dalam request body untuk DELETE request
    this.http
      .request<any>('DELETE', `${this.apiUrl}/${productId}`, {
        headers,
        body: { size },
      })
      .subscribe({
        next: (data) => {
          this.cart = data || this.cart;
          Swal.fire('Sukses!', 'Produk dihapus dari keranjang.', 'success');
          this.loadCart(); // Refresh cart
        },
        error: (err) => {
          console.error('Error removing from cart:', err);
          Swal.fire(
            'Error!',
            err.error?.message || 'Gagal menghapus dari keranjang.',
            'error'
          );
        },
      });
  }

  incrementItem(productId: string, size: string) {
    if (!this.token || !productId) {
      Swal.fire('Error!', 'Data tidak valid atau silakan login.', 'error');
      return;
    }

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.token}`
    );
    // Kirim size dalam request body
    this.http
      .put<any>(`${this.apiUrl}/increment/${productId}`, { size }, { headers })
      .subscribe({
        next: (data) => {
          this.cart = data || this.cart;
          Swal.fire('Sukses!', 'Jumlah produk bertambah.', 'success');
          this.loadCart();
        },
        error: (err) => {
          console.error('Error incrementing item:', err);
          Swal.fire(
            'Error!',
            err.error?.message || 'Gagal menambah jumlah.',
            'error'
          );
        },
      });
  }

  decrementItem(productId: string, size: string) {
    if (!this.token || !productId) {
      Swal.fire('Error!', 'Data tidak valid atau silakan login.', 'error');
      return;
    }

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.token}`
    );
    this.http
      .put<any>(`${this.apiUrl}/decrement/${productId}`, { size }, { headers })
      .subscribe({
        next: (data) => {
          this.cart = data || this.cart;
          Swal.fire('Sukses!', 'Jumlah produk berkurang.', 'success');
          this.loadCart();
        },
        error: (err) => {
          console.error('Error decrementing item:', err);
          Swal.fire(
            'Error!',
            err.error?.message || 'Gagal mengurangi jumlah.',
            'error'
          );
        },
      });
  }

  checkout(): void {
    if (!this.token) {
      Swal.fire('Error!', 'Silakan login terlebih dahulu.', 'error');
      return;
    }

    // Meminta nama pengguna saat checkout
    Swal.fire({
      title: 'Masukkan Nama Anda',
      input: 'text',
      inputPlaceholder: 'Nama Anda',
      showCancelButton: true,
      confirmButtonText: 'Lanjutkan',
      cancelButtonText: 'Batal',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return 'Nama tidak boleh kosong!';
        }
        return null;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const userName = result.value.trim();

        // Validasi awal
        if (!this.cart.items || this.cart.items.length === 0) {
          Swal.fire(
            'Error!',
            'Keranjang kosong, tidak dapat checkout.',
            'error'
          );
          return;
        }

        const totalQuantity = this.cart.items.reduce(
          (sum: number, item: any) => sum + (item.quantity || 0),
          0
        );
        if (totalQuantity <= 0) {
          Swal.fire('Error!', 'Jumlah produk tidak valid.', 'error');
          return;
        }

        if (this.cart.total <= 0) {
          Swal.fire('Error!', 'Total pembayaran tidak valid.', 'error');
          return;
        }

        // Validasi productId
        const invalidItems = this.cart.items.some(
          (item: any) => !item.productId || item.productId === ''
        );
        if (invalidItems) {
          Swal.fire(
            'Error!',
            'Ada item dengan productId tidak valid.',
            'error'
          );
          return;
        }

        // PERBAIKAN: Ekstrak sizes dengan productId dari cart.items
        const sizes = this.cart.items.map((item: any) => ({
          productId: item.productId, // TAMBAHKAN INI
          size: item.size || 'N/A',
          quantity: item.quantity || 1,
        }));

        // Debug log untuk memastikan format data benar
        console.log('Cart items:', this.cart.items);
        console.log('Sizes with productId:', sizes);

        // Format mata uang menggunakan Intl.NumberFormat
        const formatter = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
        });
        const productDetails = this.cart.items
          .map(
            (item: any) =>
              `${item.nama} - Harga: ${formatter.format(item.harga)}, Ukuran: ${
                item.size || 'N/A'
              }, Jumlah: ${item.quantity}, Total: ${formatter.format(
                item.total
              )}`
          )
          .join('<br>');

        // Konfirmasi pembelian dengan detail
        Swal.fire({
          title: 'Apakah Anda Yakin Ingin Membeli?',
          html: `
          <p><strong>Nama Pembeli:</strong> ${userName}</p>
          <p><strong>Detail Produk:</strong></p>
          <div>${productDetails}</div>
          <p><strong>Total Pembayaran:</strong> ${formatter.format(
            this.cart.total
          )}</p>
        `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Ya, Lanjutkan',
          cancelButtonText: 'Batal',
        }).then((confirmResult) => {
          if (confirmResult.isConfirmed) {
            const headers = new HttpHeaders().set(
              'Authorization',
              `Bearer ${this.token}`
            );
            const userId = localStorage.getItem('userId');
            if (!userId) {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'User ID tidak tersedia. Silakan login ulang.',
              });
              return;
            }

            const order = {
              nama: userName,
              order: new Date(),
              total: this.cart.total,
              jumlahOrder: totalQuantity,
              products_id: this.cart.items.map((item: any) => item.productId),
              userId: userId,
              sizes: sizes, // Sekarang sizes sudah include productId
            };

            // Debug log
            console.log('Order data to send:', order);

            this.http
              .post<any>('https://be-iamfashion.vercel.app/api/orders', order, {
                headers,
              })
              .subscribe({
                next: (res) => {
                  Swal.fire(
                    'Berhasil!',
                    'Pesanan Anda telah dibuat.',
                    'success'
                  );
                  this.cart = { items: [], total: 0 }; // Kosongkan cart
                  this.loadCart(); // Refresh cart
                  this.router.navigate(['/payments'], {
                    state: {
                      orderId: res._id,
                      totalPrice: res.total,
                      buyerName: res.nama,
                      product: res.products_id,
                      orderQty: res.jumlahOrder,
                      sizes: res.sizes, // Kirim sizes ke payment
                    },
                  });
                },
                error: (err) => {
                  console.error('Error creating order:', err);
                  Swal.fire(
                    'Error!',
                    err.error?.message || 'Gagal membuat pesanan.',
                    'error'
                  );
                },
              });
          }
        });
      }
    });
  }
}
