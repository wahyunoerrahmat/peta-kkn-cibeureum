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

// Fungsi untuk menggambar rute (Jalan Darat OSRM dengan Fallback Offline)
window.drawRoute = async function(destLat, destLng) {
    if (!userMarker) {
        alert("Silakan tekan tombol 'Lacak Posisi Saya' di bawah agar sistem mengetahui titik awal Anda!");
        return;
    }
    
    const userLat = userMarker.getLatLng().lat;
    const userLng = userMarker.getLatLng().lng;
    
    if (routeLine) map.removeLayer(routeLine);
    
    distanceBadge.innerText = 'Menghitung rute...';
    distanceBadge.style.display = 'block';
    distanceBadge.style.backgroundColor = '#3b82f6';
    
    try {
        // Coba request ke server OSRM (Butuh Internet)
        const response = await fetch(`https://router.project-osrm.org/route/v1/walking/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson`);
        if (!response.ok) throw new Error("Gagal mengambil rute");
        
        const data = await response.json();
        const routeData = data.routes[0];
        const coordinates = routeData.geometry.coordinates;
        const distMeters = routeData.distance; // Real road distance
        
        // Konversi koordinat GeoJSON [lng, lat] ke Leaflet [lat, lng]
        const latLngs = coordinates.map(coord => [coord[1], coord[0]]);
        
        // Gambar jalur darat meliuk-liuk
        routeLine = L.polyline(latLngs, {
            color: '#10b981', // Hijau (Berhasil rute darat)
            weight: 6,
            opacity: 0.8
        }).addTo(map);
        
        let distText = distMeters < 1000 ? Math.round(distMeters) + ' m' : (distMeters/1000).toFixed(2) + ' km';
        distanceBadge.innerText = 'Jarak Darat (Jalan/Motor): ' + distText;
        distanceBadge.style.backgroundColor = '#10b981';
        
    } catch (error) {
        // FALLBACK OFFLINE: Jika tidak ada sinyal internet, gunakan garis lurus!
        console.warn("Sedang offline atau server rute mati. Beralih ke rute lurus.");
        
        routeLine = L.polyline([[userLat, userLng], [destLat, destLng]], {
            color: '#ef4444', // Merah (Offline lurus)
            weight: 5,
            dashArray: '10, 10'
        }).addTo(map);
        
        const distMeters = map.distance([userLat, userLng], [destLat, destLng]);
        let distText = distMeters < 1000 ? Math.round(distMeters) + ' m' : (distMeters/1000).toFixed(2) + ' km';
        
        distanceBadge.innerText = 'Jarak Udara (Mode Offline): ' + distText;
        distanceBadge.style.backgroundColor = '#f59e0b';
    }
    
    // Sesuaikan layar agar pengguna dan tujuan terlihat
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    destMarker.closePopup();
};
