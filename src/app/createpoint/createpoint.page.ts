import { Component, OnInit, inject } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { DataService } from '../data.service';
import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';
import { ActivatedRoute, Router } from '@angular/router';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-createpoint',
  templateUrl: './createpoint.page.html',
  styleUrls: ['./createpoint.page.scss'],
  standalone: false,
})
export class CreatepointPage implements OnInit {
  map!: L.Map;
  marker!: L.Marker;

  name = '';
  coordinates = '';
  id: string | null = null;
  isEditMode = false;

  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);
  private activatedRoute = inject(ActivatedRoute);

  constructor() { }

  ngOnInit() {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    this.isEditMode = !!this.id;

    setTimeout(() => {
      this.map = L.map('mapcreate').setView([-7.7956, 110.3695], 13);

      var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      osm.addTo(this.map);

      var esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'ESRI'
      });

      var baseMaps = {
        "OpenStreetMap": osm,
        "Esri World Imagery": esri
      };

      L.control.layers(baseMaps).addTo(this.map);

      var tooltip = 'Drag the marker or move the map<br>to change the coordinates<br>of the location';
      this.marker = L.marker([-7.7956, 110.3695], { draggable: true });
      this.marker.addTo(this.map);
      this.marker.bindPopup(tooltip);
      this.marker.openPopup();

      if (this.isEditMode && this.id) {
        this.dataService.getPoint(this.id).then(snapshot => {
          const point = snapshot.val();
          if (point) {
            this.name = point.name;
            this.coordinates = point.coordinates;
            const latlng = point.coordinates.split(',').map(Number);
            this.map.setView(latlng, 13);
            this.marker.setLatLng(latlng);
          }
        });
      } else {
        // push lat lng to coordinates input for new point
        let latlng = this.marker.getLatLng();
        this.coordinates = latlng.lat.toFixed(9) + ',' + latlng.lng.toFixed(9);
      }

      this.marker.on('dragend', (e) => {
        let latlng = e.target.getLatLng();
        let lat = latlng.lat.toFixed(9);
        let lng = latlng.lng.toFixed(9);
        this.coordinates = lat + ',' + lng;
        console.log(this.coordinates);
      });
    });
  }

  async save() {
    if (this.name && this.coordinates) {
      try {
        if (this.isEditMode && this.id) {
          await this.dataService.updatePoint(this.id, { name: this.name, coordinates: this.coordinates });
        } else {
          await this.dataService.savePoint({ name: this.name, coordinates: this.coordinates });
        }
        this.navCtrl.back();
      } catch (error: any) {
        const alert = await this.alertCtrl.create({
          header: this.isEditMode ? 'Update Failed' : 'Save Failed',
          message: error.message,
          buttons: ['OK'],
        });
        await alert.present();
      }
    }
  }

}
