// Inisialisasi Peta (Koordinat Desa Cibeureum)
const map = L.map('map').setView([-6.7232875, 106.9506175], 15);

// Base Map: Google Maps Satellite (URL ini mendukung caching dengan baik)
L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: 'Google Maps'
}).addTo(map);

let userMarker = null;
let userCircle = null;

// Fitur Geolocation GPS
const locateBtn = document.getElementById('locate-btn');
const statusBox = document.getElementById('status');

locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert("Browser Anda tidak mendukung fitur GPS Geolocation.");
        return;
    }
    
    statusBox.style.display = 'block';
    statusBox.innerText = 'Mencari sinyal GPS Anda...';
    
    // Gunakan high accuracy agar bekerja maksimal di smartphone
    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
            statusBox.style.display = 'none';
            
            if (userMarker) {
                map.removeLayer(userMarker);
                map.removeLayer(userCircle);
            }
            
            // Marker GPS Pengguna
            userMarker = L.marker([lat, lng]).addTo(map)
                .bindPopup("Posisi Anda Saat Ini").openPopup();
                
            userCircle = L.circle([lat, lng], { radius: accuracy, color: '#3b82f6' }).addTo(map);
            
            // Auto zoom ke posisi user
            map.setView([lat, lng], 17);
        },
        error => {
            statusBox.innerText = 'Gagal mendapat sinyal GPS. Pastikan GPS HP menyala.';
            setTimeout(() => { statusBox.style.display = 'none'; }, 3000);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
});

// --- FITUR LOKASI PENTING & PETUNJUK ARAH ---
let destMarker = null;
let routeLine = null;
const locationSelect = document.getElementById('location-select');
const distanceBadge = document.getElementById('distance-badge');

locationSelect.addEventListener('change', (e) => {
    if (destMarker) map.removeLayer(destMarker);
    if (routeLine) map.removeLayer(routeLine);
    distanceBadge.style.display = 'none';
    
    if (!e.target.value) return;
    
    const [lat, lng] = e.target.value.split(',').map(Number);
    const destName = e.target.options[e.target.selectedIndex].text;
    
    destMarker = L.marker([lat, lng]).addTo(map);
    
    const popupContent = `
        <div style="text-align:center;">
            <b>${destName}</b><br>
            <button class="route-btn" onclick="drawRoute(${lat}, ${lng})">Rute (Garis Lurus GPS)</button>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" class="gmaps-btn">Rute di Google Maps (Online)</a>
        </div>
    `;
    
    destMarker.bindPopup(popupContent).openPopup();
    map.setView([lat, lng], 17);
});

// Fungsi untuk menggambar rute lurus
window.drawRoute = function(destLat, destLng) {
    if (!userMarker) {
        alert("Silakan tekan tombol 'Lacak Posisi Saya' di bawah agar sistem mengetahui titik awal Anda!");
        return;
    }
    
    const userLat = userMarker.getLatLng().lat;
    const userLng = userMarker.getLatLng().lng;
    
    if (routeLine) map.removeLayer(routeLine);
    
    // Gambar garis putus-putus merah
    routeLine = L.polyline([[userLat, userLng], [destLat, destLng]], {
        color: '#ef4444',
        weight: 5,
        dashArray: '10, 10'
    }).addTo(map);
    
    // Sesuaikan layar agar pengguna dan tujuan terlihat
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    
    // Hitung jarak
    const distMeters = map.distance([userLat, userLng], [destLat, destLng]);
    let distText = distMeters < 1000 ? Math.round(distMeters) + ' m' : (distMeters/1000).toFixed(2) + ' km';
    
    distanceBadge.innerText = 'Jarak Udara: ' + distText;
    distanceBadge.style.display = 'block';
    
    destMarker.closePopup();
};
