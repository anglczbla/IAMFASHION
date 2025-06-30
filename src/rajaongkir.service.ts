import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RajaOngkirService {
  private apiUrl = 'https://be-iamfashion.vercel.app/api/rajaOngkir/cekOngkir';
  private trackingUrl = 'https://be-iamfashion.vercel.app/api/rajaOngkir/cekResi';

  constructor(private http: HttpClient) {}

  cekOngkir(origin: string, destination: string, weight: number, courier: string) {


    const body = new HttpParams()
      .set('origin', origin)
      .set('destination', destination)
      .set('courier', courier)
      .set('weight', weight)

    return this.http.post<any>(this.apiUrl, body.toString());
  }
  cekResi(waybill: string, courier: string) {
    const body = new HttpParams()
      .set('waybill', waybill)
      .set('courier', courier);

    return this.http.post<any>(this.trackingUrl, body.toString());
  }
  
}
