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
