import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buildRoute, isArrived, pointAlong, voyageProgress } from '../utils/shipments';

const BRAND = '#0d7a4f';

const portIcon = (label, color) =>
  L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%)">
      <div style="background:${color};color:#fff;font:700 10px/1 system-ui;padding:4px 7px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.2);white-space:nowrap">${label}</div>
      <div style="width:10px;height:10px;background:${color};border:2px solid #fff;border-radius:50%;margin-top:3px;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>
    </div>`,
    iconSize: [0, 0],
  });

const shipIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:40px;height:40px;transform:translate(-50%,-50%);display:grid;place-items:center">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(13,122,79,.22);border:1.5px solid ${BRAND};animation:pulse-ring 2.2s infinite ease-in-out"></div>
    <div style="position:relative;width:26px;height:26px;border-radius:50%;background:${BRAND};border:2px solid #fff;display:grid;place-items:center;box-shadow:0 3px 8px rgba(13,122,79,.4)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/></svg>
    </div>
  </div>`,
  iconSize: [0, 0],
});

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function vesselPosition(shipment) {
  const pos = shipment.currentPosition;
  if (pos?.lat && pos?.lng && pos.source === 'live') return { latlng: [pos.lat, pos.lng], live: true };
  const route = shipment.routePath?.length ? shipment.routePath : buildRoute(shipment.pol, shipment.pod);
  return { latlng: pointAlong(route, voyageProgress(shipment)), live: false };
}

export default function ShipmentMap({ shipment }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  // Create the map once
  useEffect(() => {
    const map = L.map(elRef.current, { zoomControl: false, attributionControl: true, worldCopyJump: true }).setView([20, 90], 3);
    map.attributionControl.setPrefix(false);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 13,
      attribution: '© Esri',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Redraw the route when the shipment changes
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !shipment?.pol || !shipment?.pod) return;
    layer.clearLayers();

    const { pol, pod } = shipment;
    const route = shipment.routePath?.length ? shipment.routePath : buildRoute(pol, pod);
    const { latlng } = vesselPosition(shipment);

    L.polyline(route, { color: BRAND, weight: 8, opacity: 0.15, lineCap: 'round' }).addTo(layer);
    L.polyline(route, { color: BRAND, weight: 3, opacity: 0.85, dashArray: '1 7', lineCap: 'round' }).addTo(layer);

    // travelled part drawn solid
    if (latlng && !isArrived(shipment)) {
      const travelled = [];
      const t = voyageProgress(shipment);
      for (let i = 0; i <= 40; i++) travelled.push(pointAlong(route, (t * i) / 40));
      L.polyline(travelled, { color: BRAND, weight: 3.5, opacity: 1, lineCap: 'round' }).addTo(layer);
    }

    L.marker([pol.lat, pol.lng], { icon: portIcon(esc(pol.code || 'POL'), '#475569') })
      .bindPopup(`<b>${esc(pol.name)}</b><br>Departed ${esc(pol.date)}`)
      .addTo(layer);
    L.marker([pod.lat, pod.lng], { icon: portIcon(esc(pod.code || 'POD'), BRAND) })
      .bindPopup(`<b>${esc(pod.name)}</b><br>ETA ${esc(shipment.timeline?.eta || pod.date)}`)
      .addTo(layer);

    if (latlng && !isArrived(shipment)) {
      L.marker(latlng, { icon: shipIcon, zIndexOffset: 1000 })
        .bindPopup(`<b>${esc(shipment.vesselName || 'Vessel')}</b>${shipment.voyage ? `<br>Voyage ${esc(shipment.voyage)}` : ''}`)
        .addTo(layer);
    }

    map.fitBounds(L.latLngBounds(route), { padding: [28, 28], maxZoom: 6 });
  }, [shipment]);

  return <div ref={elRef} className="h-full w-full" />;
}
