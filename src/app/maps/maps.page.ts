import { Component, OnInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { DataService } from '../data.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false,
})
export class MapsPage implements OnInit {
  map!: L.Map;
  private markers: L.Marker[] = [];

  private dataService = inject(DataService);
  private alertController = inject(AlertController);
  private router = inject(Router);

  constructor() { }

  async loadPoints() {
    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    const points: any = await this.dataService.getPoints();
    for (const key in points) {
      if (points.hasOwnProperty(key)) {
        const point = points[key];
        const coordinates = point.coordinates.split(',').map((c: string) => parseFloat(c));
        const marker = L.marker(coordinates as L.LatLngExpression).addTo(this.map);
        
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
          ${point.name}<br>
          <ion-icon name="create" color="warning" class="edit-btn" style="cursor: pointer; margin-right: 10px; font-size: 20px;"></ion-icon>
          <ion-icon name="trash" color="danger" class="delete-btn" style="cursor: pointer; font-size: 20px;"></ion-icon>
        `;

        const editBtn = popupContent.querySelector('.edit-btn');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            this.editPoint(key);
          });
        }

        const deleteBtn = popupContent.querySelector('.delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            this.confirmDelete(key);
          });
        }

        marker.bindPopup(popupContent);
        this.markers.push(marker);
      }
    }
  }

  editPoint(key: string) {
    this.router.navigate(['/createpoint', key]);
  }

  async confirmDelete(key: string) {
    const alert = await this.alertController.create({
      header: 'Konfirmasi Hapus',
      message: 'Apakah Anda yakin ingin menghapus titik ini?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Hapus',
          handler: () => {
            this.deletePoint(key);
          }
        }
      ]
    });

    await alert.present();
  }

  async deletePoint(key: string) {
    await this.dataService.deletePoint(key);
    this.map.closePopup();
    this.loadPoints();
  }


  ngOnInit() {
    if (!this.map) {
      setTimeout(() => {
        this.map = L.map('map').setView([-7.7956, 110.3695], 13);

        var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        });

        osm.addTo(this.map);
        const iconRetinaUrl = 'assets/marker-icon-2x.png';
        const iconUrl = 'assets/marker-icon.png';
        const shadowUrl = 'assets/marker-shadow.png';
        const iconDefault = L.icon({
          iconRetinaUrl,
          iconUrl,
          shadowUrl,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          tooltipAnchor: [16, -28],
          shadowSize: [41, 41]
        });
        L.Marker.prototype.options.icon = iconDefault;
        L.marker([-7.7956, 110.3695]).addTo(this.map)
          .bindPopup('yogyakarta')
          .openPopup();

        this.loadPoints();
      });
    }
  }

}
