// Update ikon navigasi dan inisialisasi dropdown Cari Ayat setelah DOM siap
document.addEventListener('DOMContentLoaded', function() {
  // Update ikon navigasi
  const backBtn = document.getElementById('back-button');
  const prevBtn = document.getElementById('prev-surah');
  const nextBtn = document.getElementById('next-surah');
  if (backBtn) backBtn.innerHTML = '<i class="fa-solid fa-backward"></i>';
  if (prevBtn) prevBtn.innerHTML = '<i class="fa-solid fa-backward-step"></i>';
  if (nextBtn) nextBtn.innerHTML = '<i class="fa-solid fa-forward-step"></i>';

  // Inisialisasi dropdown Cari Ayat (jika sudah ada di DOM)
  initAyatSearchDropdown();
});

// Fungsi untuk menginisialisasi ulang dropdown Cari Ayat
function initAyatSearchDropdown() {
  const searchToggle = document.getElementById('ayat-search-toggle');
  const searchMenu = document.getElementById('ayat-search-menu');
  const searchInput = document.getElementById('search-ayat-input');
  const searchResults = document.getElementById('ayat-search-results');

  if (searchToggle && searchMenu && searchInput && searchResults) {
    // Pastikan listener tidak ditambahkan dua kali (jika perlu, Anda bisa menambahkan removeEventListener)
    searchToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      searchMenu.classList.toggle('hide');
      if (!searchMenu.classList.contains('hide')) {
        // Saat dropdown terbuka, segera tampilkan opsi nomor ayat
        populateAyatOptions();
        searchInput.focus();
      }
    });

    document.addEventListener('click', function() {
      if (!searchMenu.classList.contains('hide')) {
        searchMenu.classList.add('hide');
      }
    });

    // Jika pengguna mengetik, filter opsi (opsional)
    searchInput.addEventListener('input', function() {
      const query = this.value.trim().toLowerCase();
      const options = searchResults.querySelectorAll('.ayat-search-result');
      options.forEach(option => {
        if (option.textContent.toLowerCase().includes(query)) {
          option.style.display = 'block';
        } else {
          option.style.display = 'none';
        }
      });
    });
  }
}

// Fungsi untuk mengisi dropdown dengan pilihan nomor ayat berdasarkan surah yang sedang dimuat
function populateAyatOptions() {
  const searchResults = document.getElementById('ayat-search-results');
  // Dapatkan semua elemen ayat yang telah dirender
  const ayatWrappers = document.querySelectorAll('#ayat-container .ayat-wrapper');
  searchResults.innerHTML = '';
  if (ayatWrappers.length === 0) {
    searchResults.innerHTML = '<div style="text-align:center; color:#777;">Belum ada ayat</div>';
    return;
  }
  ayatWrappers.forEach(wrapper => {
    const verseNumber = wrapper.getAttribute('data-verse');
    const option = document.createElement('div');
    option.className = 'ayat-search-result';
    option.innerHTML = `Ayat ${verseNumber}`;
    option.addEventListener('click', function() {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      wrapper.classList.add('highlight');
      setTimeout(() => {
        wrapper.classList.remove('highlight');
      }, 2000);
      document.getElementById('ayat-search-menu').classList.add('hide');
    });
    searchResults.appendChild(option);
  });
}

// Global Variables
let favoriteAyats = JSON.parse(localStorage.getItem('favoriteAyats')) || [],
    listenedSurahs = JSON.parse(localStorage.getItem('listenedSurahs')) || [],
    currentAudio = null,
    currentPlayButton = null,
    audioQueue = [],
    isPlayingAll = false,
    isRepeat = false,
    currentSurahNumber = null;

window.surahData = [];

// Fungsi menghentikan audio dan reset tombol play
function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (currentPlayButton) {
    currentPlayButton.innerHTML = `<i class="fa-solid fa-play"></i>`;
    currentPlayButton = null;
  }
  isPlayingAll = false;
}

// Ambil data surah dari API
async function getSurah() {
  try {
    const res = await fetch('https://equran.id/api/v2/surat');
    if (!res.ok) throw new Error('Gagal mengambil data');
    const data = await res.json();
    window.surahData = data.data;
    renderSurahList(window.surahData);
    document.getElementById('list-page').classList.remove('hide');
    document.getElementById('detail-page').classList.add('hide');
    document.getElementById('nav-buttons')?.classList.add('hide');
  } catch (e) {
    console.error('Gagal mengambil data surah:', e);
  }
}

// Render daftar surah
function renderSurahList(arr) {
  const list = document.getElementById('surah-list');
  list.innerHTML = '';
  arr.forEach(surah => {
    const item = document.createElement('div');
    item.className = 'surah-item';
    item.setAttribute('data-surah', surah.nomor);
    const favoriteIcon = `<i class="favorite-surah-icon ${listenedSurahs.includes(surah.nomor.toString()) ? 'fa-solid' : 'fa-regular'} fa-star" data-surah="${surah.nomor}"></i>`;
    item.innerHTML = `
      <div class="surah-number-container">
        <div class="surah-number">${surah.nomor}</div>
        <div class="favorite-icon-container">${favoriteIcon}</div>
      </div>
      <div class="surah-details">
        <div class="surah-info-container">
          <div class="surah-name">${surah.namaLatin}</div>
          <div class="surah-meta">${surah.arti} - ${surah.jumlahAyat} ayat</div>
        </div>
      </div>
    `;
    item.onclick = (e) => {
      if (e.target.classList.contains('favorite-surah-icon')) return;
      loadSurah(surah.nomor, item);
      document.getElementById('list-page').classList.add('hide');
      document.getElementById('detail-page').classList.remove('hide');
      document.getElementById('nav-buttons')?.classList.remove('hide');
    };
    list.appendChild(item);
  });
}

// Event delegation untuk toggle favorit surah
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('favorite-surah-icon')) {
    const surahNumber = e.target.getAttribute('data-surah');
    toggleFavoriteSurah(surahNumber, e.target);
    e.stopPropagation();
  }
});

// Toggle favorit surah
function toggleFavoriteSurah(surahNumber, iconElement) {
  const index = listenedSurahs.indexOf(surahNumber.toString());
  if (index === -1) {
    listenedSurahs.push(surahNumber.toString());
    iconElement.classList.remove('fa-regular');
    iconElement.classList.add('fa-solid');
  } else {
    listenedSurahs.splice(index, 1);
    iconElement.classList.remove('fa-solid');
    iconElement.classList.add('fa-regular');
  }
  localStorage.setItem('listenedSurahs', JSON.stringify(listenedSurahs));
}

// Search surah
document.getElementById('search-surah').addEventListener('input', function () {
  const q = this.value.trim().toLowerCase();
  if (!q) {
    renderSurahList(window.surahData);
    return;
  }
  const filtered = window.surahData.filter(s =>
    s.namaLatin.toLowerCase().includes(q) ||
    s.arti.toLowerCase().includes(q) ||
    s.nomor.toString().includes(q)
  );
  renderSurahList(filtered);
});

// Render surah favorit
function renderFavoriteSurahs() {
  const favoriteContainer = document.getElementById('favorites-page');
  const favoriteList = document.getElementById('favorite-list');
  favoriteList.innerHTML = '';
  const favorites = window.surahData.filter(surah =>
    listenedSurahs.includes(surah.nomor.toString())
  );
  if (favorites.length === 0) {
    favoriteList.innerHTML = `<p style="text-align:center;">Belum ada surah favorit.</p>`;
    return;
  }
  favorites.forEach(surah => {
    const item = document.createElement('div');
    item.className = 'surah-item';
    item.setAttribute('data-surah', surah.nomor);
    item.innerHTML = `
      <div class="surah-number-container">
        <div class="surah-number">${surah.nomor}</div>
      </div>
      <div class="surah-details">
        <div class="surah-info-container">
          <div class="surah-name">${surah.namaLatin}</div>
          <div class="surah-meta">${surah.arti} - ${surah.jumlahAyat} ayat</div>
        </div>
      </div>
    `;
    item.onclick = (e) => {
      if (e.target.classList.contains('favorite-surah-icon')) return;
      loadSurah(surah.nomor, item);
      favoriteContainer.classList.add('hide');
      document.getElementById('list-page').classList.add('hide');
      document.getElementById('detail-page').classList.remove('hide');
      document.getElementById('nav-buttons')?.classList.remove('hide');
    };
    favoriteList.appendChild(item);
  });
}

// Toggle ikon favorit surah via bintang di search
document.getElementById('filter-fav-surah').addEventListener('click', function () {
  this.classList.toggle('fa-regular');
  this.classList.toggle('fa-solid');
  if (listenedSurahs.length > 0) {
    document.getElementById('list-page').classList.add('hide');
    document.getElementById('detail-page').classList.add('hide');
    document.getElementById('favorites-page').classList.remove('hide');
    renderFavoriteSurahs();
  } else {
    alert('Belum ada surah favorit.');
  }
});

// Tombol kembali dari halaman favorit ke daftar surah
document.getElementById('back-to-list').addEventListener('click', function () {
  document.getElementById('favorites-page').classList.add('hide');
  document.getElementById('list-page').classList.remove('hide');
});

// Toggle favorit ayat (detail page)
function toggleFavoriteAyat(id, btn) {
  const idx = favoriteAyats.indexOf(id);
  if (idx === -1) {
    favoriteAyats.push(id);
    if (currentSurahNumber && !listenedSurahs.includes(currentSurahNumber)) {
      listenedSurahs.push(currentSurahNumber);
      localStorage.setItem('listenedSurahs', JSON.stringify(listenedSurahs));
      renderSurahList(window.surahData);
    }
  } else {
    favoriteAyats.splice(idx, 1);
    if (!favoriteAyats.length && currentSurahNumber) {
      const i = listenedSurahs.indexOf(currentSurahNumber);
      if (i !== -1) {
        listenedSurahs.splice(i, 1);
        localStorage.setItem('listenedSurahs', JSON.stringify(listenedSurahs));
        renderSurahList(window.surahData);
      }
    }
  }
  localStorage.setItem('favoriteAyats', JSON.stringify(favoriteAyats));
  updateFavoriteAyatIcon(btn, idx === -1);
}
  
// Update ikon favorit ayat
function updateFavoriteAyatIcon(btn, fav) {
  const icon = btn.querySelector('i');
  if (fav) {
    icon.classList.remove('fa-regular');
    icon.classList.add('fa-solid', 'fa-bookmark');
  } else {
    icon.classList.remove('fa-solid', 'fa-bookmark');
    icon.classList.add('fa-regular', 'fa-bookmark');
  }
}
  
// Konversi angka Latin ke angka Arab
function convertToArabicNumber(num) {
  const ar = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return num.toString().split('').map(d => ar[+d]).join('');
}
  
// Toggle bookmark untuk ayat
function toggleBookmark(verse, btn) {
  if (!currentSurahNumber) {
    alert("Tidak ada surah yang sedang dibaca.");
    return;
  }
  let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
  if (bookmarks[currentSurahNumber] && bookmarks[currentSurahNumber].verse == verse) {
    delete bookmarks[currentSurahNumber];
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    btn.innerHTML = `<i class="fa-regular fa-bookmark"></i>`;
  } else {
    let now = new Date();
    let day = now.getDate().toString().padStart(2, '0');
    let month = now.toLocaleString('default', { month: 'short' }).toLowerCase();
    let year = now.getFullYear();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let formattedDate = `${day} ${month} ${year} ${hours}:${minutes}`;
    bookmarks[currentSurahNumber] = { verse: verse, time: formattedDate };
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    btn.innerHTML = `<i class="fa-solid fa-bookmark"></i>`;
  }
}
  
// Load detail surah
async function loadSurah(surahNumber, clickedItem) {
  try {
    stopAudio();
    document.querySelectorAll('.surah-item').forEach(item => item.classList.remove('active'));
    if (clickedItem) clickedItem.classList.add('active');
    currentSurahNumber = surahNumber.toString();
    document.getElementById('ayat-container').innerHTML = '<div class="loading">Loading...</div>';
    
    const res = await fetch(`https://equran.id/api/v2/surat/${surahNumber}`);
    if (!res.ok) throw new Error('Gagal mengambil data');
    const data = await res.json();
    
    const surahDetail = document.getElementById('surah-detail');
    surahDetail.innerHTML = `
      <div class="surah-header">
        <p class="surah-arabic">${data.data.nama}</p>
        <h2 class="surah-latin">${data.data.namaLatin}</h2>
        <p class="surah-info">${data.data.tempatTurun} · ${data.data.jumlahAyat} Ayat</p>
      </div>
    `;
    const arElem = surahDetail.querySelector('.surah-arabic'),
          ltElem = surahDetail.querySelector('.surah-latin');
    if (arElem && ltElem) {
      ltElem.innerHTML += ` (<span class="arabic-inline">${arElem.textContent}</span>)`;
      arElem.remove();
    }
    
    // Sisipkan tombol "Play All" dan dropdown Cari Ayat
    document.getElementById('play-all-container').innerHTML = `
      <div class="play-all-wrapper" style="display:flex; align-items:center; gap:10px;">
        <button id="play-all" onclick="togglePlayAll(this)" title="Play All">
          <i class="fa-solid fa-circle-play"></i>
        </button>
        <!-- Dropdown Cari Ayat -->
        <div id="ayat-search-dropdown" class="ayat-search-dropdown">
          <button id="ayat-search-toggle" title="Cari Ayat">
            <i class="fa-solid fa-search"></i>
          </button>
          <div id="ayat-search-menu" class="ayat-search-menu hide">
            <input type="text" id="search-ayat-input" placeholder="Cari ayat..." />
            <div id="ayat-search-results"></div>
          </div>
        </div>
      </div>
    `;
    // Inisialisasi ulang dropdown agar event listener baru terpasang
    initAyatSearchDropdown();
    
    const ayatContainer = document.getElementById('ayat-container');
    ayatContainer.innerHTML = '';
    audioQueue = [];
    
    // Tambahkan Bismillah (kecuali surah 1 dan 9)
    if (surahNumber !== 9 && surahNumber !== 1) {
      ayatContainer.innerHTML += `<p class="ayat bismillah">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p><hr>`;
      audioQueue.push("https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps/001001.mp3");
    }
    
    // Siapkan queue audio
    data.data.ayat.forEach(ayat => { audioQueue.push(ayat.audio['01']); });
    
    // Render setiap ayat
    data.data.ayat.forEach(ayat => {
      const wrapper = document.createElement('div');
      wrapper.className = 'ayat-wrapper';
      wrapper.setAttribute('data-verse', ayat.nomorAyat);
      const arabicHtml = ayat.teksArab.split(' ').map(w => `<span class="arabic-word">${w}</span>`).join(' ');
      const numDecor = `<span class="nomor-ayat-decor">${convertToArabicNumber(ayat.nomorAyat)}</span>`;
      const pArab = document.createElement('p');
      pArab.className = 'ayat';
      pArab.innerHTML = `${arabicHtml} ${numDecor}`;
      wrapper.appendChild(pArab);
      const pLatin = document.createElement('p');
      pLatin.className = 'latin';
      pLatin.innerText = ayat.teksLatin;
      wrapper.appendChild(pLatin);
      const pTerjemahan = document.createElement('p');
      pTerjemahan.className = 'terjemahan';
      pTerjemahan.innerText = ayat.teksIndonesia;
      wrapper.appendChild(pTerjemahan);
      
      const btnContainer = document.createElement('div');
      btnContainer.className = 'button-container';
      
      // Tombol Play per ayat
      const playBtn = document.createElement('button');
      playBtn.className = 'play-ayat';
      playBtn.setAttribute('data-audio', ayat.audio['01']);
      playBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
      btnContainer.appendChild(playBtn);
      
      // Tombol Bookmark Ayat
      const bookmarkBtn = document.createElement('button');
      bookmarkBtn.className = 'bookmark-ayat-btn';
      bookmarkBtn.setAttribute('data-ayat', ayat.nomorAyat);
      bookmarkBtn.title = 'Bookmark ayat ini untuk dibaca nanti';
      let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
      if (bookmarks[currentSurahNumber] && bookmarks[currentSurahNumber].verse == ayat.nomorAyat) {
         bookmarkBtn.innerHTML = `<i class="fa-solid fa-bookmark"></i>`;
      } else {
         bookmarkBtn.innerHTML = `<i class="fa-regular fa-bookmark"></i>`;
      }
      bookmarkBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          toggleBookmark(ayat.nomorAyat, bookmarkBtn);
      });
      btnContainer.appendChild(bookmarkBtn);
      
      // Tombol Copy
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-ayat';
      copyBtn.innerHTML = `<i class="fa-solid fa-copy"></i>`;
      btnContainer.appendChild(copyBtn);
      
      // Tombol Share
      const shareBtn = document.createElement('button');
      shareBtn.className = 'share-ayat';
      const originalShareIcon = `<i class="fa-solid fa-share"></i>`;
      shareBtn.innerHTML = originalShareIcon;
      shareBtn.dataset.expanded = 'false';
      shareBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (this.dataset.expanded === 'true') {
          revertShareBtn(this);
          return;
        }
        this.dataset.expanded = 'true';
        const txt = wrapper.querySelector('.ayat').innerText;
        this.innerHTML = `
          <button class="share-inline-icon share-facebook"><i class="fa-brands fa-facebook-f"></i></button>
          <button class="share-inline-icon share-twitter"><i class="fa-brands fa-twitter"></i></button>
          <button class="share-inline-icon share-whatsapp"><i class="fa-brands fa-whatsapp"></i></button>
          <button class="share-inline-icon share-close"><i class="fa-solid fa-x"></i></button>
        `;
        const fbBtn = this.querySelector('.share-facebook');
        const twBtn = this.querySelector('.share-twitter');
        const waBtn = this.querySelector('.share-whatsapp');
        const closeBtn = this.querySelector('.share-close');
        fbBtn.addEventListener('click', () => {
          window.open(
            'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href) +
            '&quote=' + encodeURIComponent(txt),
            '_blank'
          );
          revertShareBtn(this);
        });
        twBtn.addEventListener('click', () => {
          window.open(
            'https://twitter.com/intent/tweet?text=' + encodeURIComponent(txt),
            '_blank'
          );
          revertShareBtn(this);
        });
        waBtn.addEventListener('click', () => {
          window.open(
            'https://api.whatsapp.com/send?text=' + encodeURIComponent(txt),
            '_blank'
          );
          revertShareBtn(this);
        });
        closeBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          revertShareBtn(this);
        });
      });
      function revertShareBtn(btn) {
        btn.dataset.expanded = 'false';
        btn.innerHTML = originalShareIcon;
      }
      shareBtn.style.marginLeft = "auto";
      btnContainer.appendChild(shareBtn);
      
      wrapper.appendChild(btnContainer);
      ayatContainer.appendChild(wrapper);
      ayatContainer.appendChild(document.createElement('hr'));
      
      copyBtn.addEventListener('click', () => {
        const ayatText = wrapper.querySelector('.ayat').innerText;
        const latinText = wrapper.querySelector('.latin').innerText;
        const terjemahanText = wrapper.querySelector('.terjemahan').innerText;
        const fullText = ayatText + "\n" + latinText + "\n" + terjemahanText;
        navigator.clipboard.writeText(fullText)
          .then(() => {
            copyBtn.innerHTML = `<i class="fa-solid fa-check"></i>`;
            setTimeout(() => { copyBtn.innerHTML = `<i class="fa-solid fa-copy"></i>`; }, 2000);
          })
          .catch(() => alert('Gagal menyalin ayat.'));
      });
      
      playBtn.addEventListener('click', function () {
        if (currentAudio && currentAudio.src === this.getAttribute('data-audio')) {
          if (!currentAudio.paused) {
            currentAudio.pause();
            this.innerHTML = `<i class="fa-solid fa-play"></i>`;
          } else {
            currentAudio.play();
            this.innerHTML = `<i class="fa-solid fa-pause"></i>`;
          }
          return;
        }
        stopAudio();
        currentPlayButton = this;
        const src = this.getAttribute('data-audio');
        currentAudio = new Audio(src);
        currentAudio.addEventListener('loadedmetadata', () => {
          currentAudio.play();
          currentPlayButton.innerHTML = `<i class="fa-solid fa-pause"></i>`;
        });
        currentAudio.onended = () => {
          currentPlayButton.innerHTML = `<i class="fa-solid fa-play"></i>`;
        };
      });
    });
    updateNavButtons();
  } catch (e) {
    console.error('Gagal mengambil data ayat:', e);
  }
}
  
// Tombol Play All Surah
function togglePlayAll(btn) {
  if (isPlayingAll) {
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      btn.innerHTML = `<i class="fa-solid fa-circle-play"></i>`;
    } else if (currentAudio && currentAudio.paused) {
      currentAudio.play();
      btn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
    }
    return;
  } else {
    isPlayingAll = true;
    btn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
    playAllAyat(btn);
  }
}
  
function playAllAyat(btn) {
  if (!audioQueue.length) return;
  let i = 0;
  let hasBismillah = false;
  if (currentSurahNumber !== "1" && currentSurahNumber !== "9") { hasBismillah = true; }
  const wrappers = document.querySelectorAll('.ayat-wrapper');
  function playNext() {
    if (i >= audioQueue.length || !isPlayingAll) {
      stopAudio();
      btn.innerHTML = `<i class="fa-solid fa-circle-play"></i>`;
      wrappers.forEach(el => el.classList.remove('active-ayat'));
      return;
    }
    wrappers.forEach(el => el.classList.remove('active-ayat'));
    if (hasBismillah && i === 0) {
      // Tidak ada highlight untuk Bismillah
    } else {
      let highlightIndex = hasBismillah ? i - 1 : i;
      if (wrappers[highlightIndex]) {
         wrappers[highlightIndex].classList.add('active-ayat');
         wrappers[highlightIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    currentAudio = new Audio(audioQueue[i]);
    currentAudio.addEventListener('loadedmetadata', () => currentAudio.play());
    currentAudio.onended = () => { i++; playNext(); };
  }
  playNext();
}
  
// Global Bookmark
function setLastReadBookmark(verse) {
  if (!currentSurahNumber) { alert("Tidak ada surah yang sedang dibaca."); return; }
  let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
  let now = new Date();
  let day = now.getDate().toString().padStart(2, '0');
  let month = now.toLocaleString('default', { month: 'short' }).toLowerCase();
  let year = now.getFullYear();
  let hours = now.getHours().toString().padStart(2, '0');
  let minutes = now.getMinutes().toString().padStart(2, '0');
  let formattedDate = `${day} ${month} ${year} ${hours}:${minutes}`;
  bookmarks[currentSurahNumber] = { verse: verse, time: formattedDate };
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  alert(`Bookmark tersimpan untuk Surah ${currentSurahNumber} Ayat ${verse}`);
}
  
// Render halaman bookmark
function renderBookmarkPage() {
  let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
  if (Object.keys(bookmarks).length === 0) { alert("Tidak ada bookmark bacaan."); return; }
  let bookmarkPage = document.getElementById('bookmark-page');
  if (!bookmarkPage) {
    bookmarkPage = document.createElement('div');
    bookmarkPage.id = 'bookmark-page';
    bookmarkPage.className = 'favorites-page hide';
    bookmarkPage.innerHTML = `
      <div class="sidebar">
        <h2>Bookmark Bacaan</h2>
        <div class="sidebar-box">
          <div id="bookmark-list" class="favorite-list"></div>
        </div>
        <div class="button-wrapper">
          <button id="back-bookmark" class="back-to-list" title="Kembali ke Daftar Surah">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(bookmarkPage);
    document.getElementById('back-bookmark').addEventListener('click', function() {
      bookmarkPage.classList.add('hide');
      document.getElementById('list-page').classList.remove('hide');
    });
  }
  const bookmarkList = document.getElementById('bookmark-list');
  bookmarkList.innerHTML = '';
  for (let surah in bookmarks) {
    let bookmarkData = bookmarks[surah];
    let surahInfo = window.surahData.find(s => s.nomor.toString() === surah);
    const item = document.createElement('div');
    item.className = 'favorite-item';
    if (surahInfo) {
      item.innerHTML = `
        <div class="bookmark-surah">QS. ${surahInfo.namaLatin} (${surahInfo.nomor}) : ayat ${bookmarkData.verse}</div>
        <div class="bookmark-time">${bookmarkData.time}</div>
      `;
    } else {
      item.innerHTML = `
        <div class="bookmark-surah">Surah ${surah}: ayat ${bookmarkData.verse}</div>
        <div class="bookmark-time">${bookmarkData.time}</div>
      `;
    }
    item.addEventListener('click', function() {
      bookmarkPage.classList.add('hide');
      document.getElementById('list-page').classList.add('hide');
      document.getElementById('detail-page').classList.remove('hide');
      document.getElementById('nav-buttons')?.classList.remove('hide');
      loadSurah(surah, document.querySelector(`.surah-item[data-surah="${surah}"]`)).then(() => {
        let bookmarkedEl = document.querySelector(`.ayat-wrapper[data-verse="${bookmarkData.verse}"]`);
        if (bookmarkedEl) {
          bookmarkedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          bookmarkedEl.classList.add('bookmark-marker');
          setTimeout(() => { bookmarkedEl.classList.remove('bookmark-marker'); }, 2000);
        }
      });
    });
    bookmarkList.appendChild(item);
  }
  bookmarkPage.classList.remove('hide');
  document.getElementById('list-page').classList.add('hide');
  document.getElementById('detail-page').classList.add('hide');
  if (document.getElementById('favorites-page')) {
    document.getElementById('favorites-page').classList.add('hide');
  }
}
  
// Global bookmark event
document.getElementById('global-bookmark').addEventListener('click', function(e) {
  e.stopPropagation();
  renderBookmarkPage();
});
  
// Tombol kembali ke daftar surah
document.getElementById('back-button').addEventListener('click', function () {
  document.getElementById('detail-page').classList.add('hide');
  document.getElementById('nav-buttons')?.classList.add('hide');
  document.getElementById('list-page').classList.remove('hide');
  stopAudio();
});
  
// Tombol Surah Sebelumnya
document.getElementById('prev-surah').addEventListener('click', function () {
  let current = parseInt(currentSurahNumber);
  if (current > 1) {
    const prevItem = document.querySelector(`.surah-item[data-surah="${current - 1}"]`);
    loadSurah(current - 1, prevItem);
  }
});
  
// Tombol Surah Selanjutnya
document.getElementById('next-surah').addEventListener('click', function () {
  let current = parseInt(currentSurahNumber);
  if (current < window.surahData.length) {
    const nextItem = document.querySelector(`.surah-item[data-surah="${current + 1}"]`);
    loadSurah(current + 1, nextItem);
  }
});
  
// Tombol kembali dari halaman favorit
document.getElementById('back-to-list').addEventListener('click', function () {
  document.getElementById('favorites-page').classList.add('hide');
  document.getElementById('list-page').classList.remove('hide');
});
  
// Perbarui status tombol Next/Prev
function updateNavButtons() {
  const prevBtn = document.getElementById('prev-surah');
  const nextBtn = document.getElementById('next-surah');
  const current = parseInt(currentSurahNumber);
  if (current <= 1) {
    prevBtn.classList.add('disabled');
  } else {
    prevBtn.classList.remove('disabled');
  }
  if (current >= window.surahData.length) {
    nextBtn.classList.add('disabled');
  } else {
    nextBtn.classList.remove('disabled');
  }
}
  
// Panggil getSurah saat halaman dimuat
window.onload = getSurah;
