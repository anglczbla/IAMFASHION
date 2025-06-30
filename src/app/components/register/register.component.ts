import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isSubmitting: boolean = false;
  apiUrl = 'https://be-iamfashion.vercel.app/api/auth/register';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user', [Validators.required]]
    });
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { name, email, password, role } = this.registerForm.value;

    this.http.post(this.apiUrl, { name, email, password, role }).subscribe({
      next: (response: any) => {
        if (response.token) {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('userRole', response.role || role);
          localStorage.setItem('userId', response.userId); 
          console.log('Register berhasil:', response);
          window.location.href = '/auth';
        } else {
          console.error('Token tidak ditemukan dalam response:', response);
          alert('Registrasi gagal. Tidak ada token.');
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Registrasi gagal:', error);
        alert('Registrasi gagal. ' + (error.error?.message || 'Periksa data yang dimasukkan.'));
        this.isSubmitting = false;
      }
    });
  }
}