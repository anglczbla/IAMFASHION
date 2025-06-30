import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-about',
  templateUrl: './aboutus.component.html',
  styleUrls: ['./aboutus.component.css'],
})
export class AboutusComponent implements AfterViewInit, OnDestroy {
  private map: L.Map | undefined;
  currentTime: string = '';
  isOpen: boolean = false;
  private timeUpdateInterval: any; // To store interval ID for cleanup

  ngAfterViewInit(): void {
    this.initMap();
    this.updateTimeAndStatus(); // Initial update
    // Update time every second (1000ms)
    this.timeUpdateInterval = setInterval(
      () => this.updateTimeAndStatus(),
      1000
    );
  }

  ngOnDestroy(): void {
    // Clear interval to prevent memory leaks
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

  private updateTimeAndStatus(): void {
    // Get current time in WIB (UTC+7)
    const now = new Date();
    const wibTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
    );

    // Format time as "HH:mm AM/PM WIB, Day, DD MMMM YYYY"
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    this.currentTime = wibTime.toLocaleString('id-ID', options) + ' WIB';

    // Update store status based on current time
    this.checkStoreStatus(wibTime);
  }

  private checkStoreStatus(time: Date): void {
    const currentHour = time.getHours(); // Get hours (0-23)
    const currentMinute = time.getMinutes(); // Get minutes (0-59)

    const openingHour = 9; // 09:00 WIB
    const closingHour = 18; // 18:00 WIB

    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const openingTimeInMinutes = openingHour * 60;
    const closingTimeInMinutes = closingHour * 60;

    this.isOpen =
      currentTimeInMinutes >= openingTimeInMinutes &&
      currentTimeInMinutes <= closingTimeInMinutes;
  }

  private initMap(): void {
    // Pastikan file ikon Leaflet ada di assets/leaflet/
    const customIcon = L.icon({
      iconUrl: 'assets/leaflet/marker-icon.png',
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
      iconSize: [25, 41], // Ukuran ikon
      iconAnchor: [12, 41], // Titik anchor ikon
      popupAnchor: [1, -34], // Titik anchor popup
      shadowSize: [41, 41], // Ukuran bayangan
    });

    // Koordinat untuk Jl. D.I. Panjaitan, Palembang
    const latitude = -2.9898;
    const longitude = 104.7924;
    this.map = L.map('map', {
      zoomControl: true, // Aktifkan kontrol zoom
      scrollWheelZoom: false, // Nonaktifkan zoom dengan scroll untuk UX yang lebih baik
    }).setView([latitude, longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(this.map);

    // Tambahkan marker dengan ikon kustom
    L.marker([latitude, longitude], { icon: customIcon })
      .addTo(this.map)
      .bindPopup('<b>I Am Fashion Store</b><br>Jl. D.I. Panjaitan, Palembang')
      .openPopup();

    // Pastikan peta dirender ulang setelah inisialisasi
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 0);
  }
}
