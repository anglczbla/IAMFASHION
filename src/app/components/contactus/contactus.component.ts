import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  

@Component({
  standalone: true,
  selector: 'app-contactus',
  templateUrl: './contactus.component.html',
  styleUrls: ['./contactus.component.css'],
  imports: [CommonModule,FormsModule]
})
export class ContactusComponent {
  onSubmit() {
    alert('Thank you for contacting us!');
  }
}
