// Global variable
let favoriteSurahs = JSON.parse(localStorage.getItem('favoriteSurahs')) || [];
window.surahData = [];

// Ambil data surah dan render grid
async function getSurah() {
  try {
    const res = await fetch('https://equran.id/api/v2/surat');
    if (!res.ok) throw new Error('Gagal mengambil data');
    const data = await res.json();
    window.surahData = data.data;
    renderSurahGrid(window.surahData);
  } catch (e) {
    console.error('Gagal mengambil data surah:', e);
  }
}

// Render daftar surah dalam grid tiga kolom
function renderSurahGrid(arr) {
  const grid = document.getElementById('surah-grid');
  grid.innerHTML = '';
  arr.forEach(surah => {
    const item = document.createElement('div');
    item.className = 'surah-item';
    item.innerHTML = `
      <div class="surah-number">${surah.nomor}</div>
      <div class="surah-name">${surah.namaLatin}</div>
      <div class="surah-meta">${surah.arti} - ${surah.jumlahAyat} ayat</div>
    `;
    // Saat diklik, arahkan ke halaman detail (misalnya surah.html) dengan parameter nomor surah
    item.addEventListener('click', () => {
      window.location.href = `surah.html?surah=${surah.nomor}`;
    });
    grid.appendChild(item);
  });
}

// Fungsi pencarian
document.getElementById('search-surah').addEventListener('input', function () {
  const q = this.value.trim().toLowerCase();
  if (!q) {
    renderSurahGrid(window.surahData);
    return;
  }
  const filtered = window.surahData.filter(s =>
    s.namaLatin.toLowerCase().includes(q) ||
    s.arti.toLowerCase().includes(q) ||
    s.nomor.toString().includes(q)
  );
  renderSurahGrid(filtered);
});

window.onload = getSurah;
