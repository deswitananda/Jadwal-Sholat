// surah.js - Untuk halaman detail surah dan ayat

let favoriteAyats = JSON.parse(localStorage.getItem('favoriteAyats')) || [];
let listenedSurahs = JSON.parse(localStorage.getItem('listenedSurahs')) || [];
let currentAudio = null;
let currentPlayButton = null;
let audioQueue = [];
let isPlayingAll = false;
let isRepeat = false;
let currentSurahNumber = null;
window.surahData = [];

// Helper: Convert nomor ke angka Arab
function convertToArabicNumber(num) {
  const ar = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return num.toString().split('').map(d => ar[+d]).join('');
}

// Baca parameter query dari URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Toggle favorite ayat
function toggleFavoriteAyat(id, btn) {
  const idx = favoriteAyats.indexOf(id);
  if (idx === -1) {
    favoriteAyats.push(id);
    if (currentSurahNumber && !listenedSurahs.includes(currentSurahNumber)) {
      listenedSurahs.push(currentSurahNumber);
      localStorage.setItem('listenedSurahs', JSON.stringify(listenedSurahs));
    }
  } else {
    favoriteAyats.splice(idx, 1);
  }
  localStorage.setItem('favoriteAyats', JSON.stringify(favoriteAyats));
  updateFavoriteAyatIcon(btn, idx === -1);
}

function updateFavoriteAyatIcon(btn, isFav) {
  const icon = btn.querySelector('i');
  if (isFav) {
    icon.classList.remove('fa-regular');
    icon.classList.add('fa-solid', 'fa-bookmark');
  } else {
    icon.classList.remove('fa-solid', 'fa-bookmark');
    icon.classList.add('fa-regular', 'fa-bookmark');
  }
}

// Stop audio
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

// Toggle play all mode
function togglePlayAll(btn) {
  if (isPlayingAll) {
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      btn.innerHTML = `<i class="fa-solid fa-play"></i>`;
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
  const wrappers = document.querySelectorAll('.ayat-wrapper');
  function playNext() {
    if (i >= audioQueue.length || !isPlayingAll) {
      stopAudio();
      btn.innerHTML = `<i class="fa-solid fa-play"></i>`;
      wrappers.forEach(el => el.classList.remove('active-ayat'));
      return;
    }
    wrappers.forEach(el => el.classList.remove('active-ayat'));
    if (wrappers[i]) {
      wrappers[i].classList.add('active-ayat');
      wrappers[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    currentAudio = new Audio(audioQueue[i]);
    currentAudio.addEventListener('loadedmetadata', () => currentAudio.play());
    currentAudio.onended = () => {
      if (isRepeat) {
        currentAudio.currentTime = 0;
        currentAudio.play();
      } else {
        i++;
        playNext();
      }
    };
  }
  playNext();
}

// Load surah detail dan ayat
async function loadSurah(surahNumber) {
  try {
    stopAudio();
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
    // Sisipkan tombol Play All dan dropdown dalam satu baris
    document.getElementById('play-all-container').innerHTML = `
      <div class="play-all-wrapper" style="display:flex; align-items:center; gap:10px;">
        <button id="play-all" onclick="togglePlayAll(this)">
          <i class="fa-solid fa-circle-play"></i>
        </button>
        <div class="control-group" style="display:flex; align-items:center; gap:5px;">
          <label for="verse-select">Ayat:</label>
          <select id="verse-select" class="form-input">
            <option value="">-- Pilih --</option>
          </select>
        </div>
      </div>
    `;
    // Pindahkan dropdown ke header (opsional)
    const shElem = document.querySelector('.surah-header'),
          ctrlGrp = document.querySelector('.play-all-wrapper .control-group');
    if (shElem && ctrlGrp) {
      ctrlGrp.remove();
      shElem.style.position = 'relative';
      shElem.appendChild(ctrlGrp);
    }
    const ayatContainer = document.getElementById('ayat-container');
    ayatContainer.innerHTML = '';
    if (surahNumber !== 9 && surahNumber !== 1)
      ayatContainer.innerHTML += `<p class="ayat bismillah">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p><hr>`;
    audioQueue = [];
    if (surahNumber !== 9 && surahNumber !== 1)
      audioQueue.push("https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps/001001.mp3");
    data.data.ayat.forEach(ayat => audioQueue.push(ayat.audio['01']));
    // Isi dropdown ayat
    const verseSelect = document.getElementById('verse-select');
    if (verseSelect) {
      verseSelect.innerHTML = '<option value="">-- Pilih --</option>';
      data.data.ayat.forEach(ayat => {
        const opt = document.createElement('option');
        opt.value = ayat.nomorAyat;
        opt.textContent = ayat.nomorAyat;
        verseSelect.appendChild(opt);
      });
      verseSelect.addEventListener('change', function () {
        const vn = this.value;
        if (vn) {
          const vEl = document.querySelector(`.ayat-wrapper[data-verse="${vn}"]`);
          if (vEl) {
            vEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            alert('Ayat dengan nomor tersebut tidak ditemukan.');
          }
        }
      });
    }
    // Render setiap ayat
    data.data.ayat.forEach(ayat => {
      const wrapper = document.createElement('div');
      wrapper.className = 'ayat-wrapper';
      wrapper.setAttribute('data-verse', ayat.nomorAyat);
      const arabicHtml = ayat.teksArab.split(' ').map(w => `<span class="arabic-word">${w}</span>`).join(' '),
            numDecor = `<span class="nomor-ayat-decor">${convertToArabicNumber(ayat.nomorAyat)}</span>`;
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
      const playBtn = document.createElement('button');
      playBtn.className = 'play-ayat';
      playBtn.setAttribute('data-audio', ayat.audio['01']);
      playBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
      btnContainer.appendChild(playBtn);
      const favBtn = document.createElement('button');
      favBtn.className = 'favorite-ayat-btn';
      const isFav = favoriteAyats.includes(ayat.nomorAyat.toString());
      favBtn.innerHTML = `<i class="${isFav ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'}"></i>`;
      favBtn.setAttribute('data-ayat', ayat.nomorAyat);
      favBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleFavoriteAyat(this.getAttribute('data-ayat'), this);
      });
      btnContainer.appendChild(favBtn);
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-ayat';
      copyBtn.innerHTML = `<i class="fa-solid fa-copy"></i>`;
      btnContainer.appendChild(copyBtn);
      const shareBtn = document.createElement('button');
      shareBtn.className = 'share-ayat';
      shareBtn.innerHTML = `<i class="fa-solid fa-share"></i>`;
      shareBtn.style.marginLeft = "auto";
      btnContainer.appendChild(shareBtn);
      wrapper.appendChild(btnContainer);
      ayatContainer.appendChild(wrapper);
      ayatContainer.appendChild(document.createElement('hr'));
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(wrapper.querySelector('.ayat').innerText)
          .then(() => alert('Ayat berhasil disalin!'))
          .catch(() => alert('Gagal menyalin ayat.'));
      });
      shareBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const txt = wrapper.querySelector('.ayat').innerText,
              shareMenu = document.createElement('div');
        shareMenu.className = 'share-options';
        shareMenu.innerHTML = `<button class="share-option share-facebook"><i class="fa-brands fa-facebook-f"></i></button>
                               <button class="share-option share-twitter"><i class="fa-brands fa-twitter"></i></button>
                               <button class="share-option share-whatsapp"><i class="fa-brands fa-whatsapp"></i></button>
                               <button class="share-option share-close"><i class="fa-solid fa-x"></i></button>`;
        document.body.appendChild(shareMenu);
        shareMenu.querySelector('.share-facebook').addEventListener('click', () => {
          window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href) + '&quote=' + encodeURIComponent(txt), '_blank');
          shareMenu.remove();
        });
        shareMenu.querySelector('.share-twitter').addEventListener('click', () => {
          window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(txt), '_blank');
          shareMenu.remove();
        });
        shareMenu.querySelector('.share-whatsapp').addEventListener('click', () => {
          window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(txt), '_blank');
          shareMenu.remove();
        });
        shareMenu.querySelector('.share-close').addEventListener('click', () => shareMenu.remove());
        document.addEventListener('click', function rem(ev) {
          if (!shareMenu.contains(ev.target)) {
            shareMenu.remove();
            document.removeEventListener('click', rem);
          }
        });
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
          if (isRepeat) {
            currentAudio.currentTime = 0;
            currentAudio.play();
          } else {
            currentPlayButton.innerHTML = `<i class="fa-solid fa-play"></i>`;
          }
        };
      });
    });
  } catch (e) {
    console.error('Gagal mengambil data ayat:', e);
  }
}

window.onload = () => {
  const surahParam = new URLSearchParams(window.location.search).get('surah');
  if (surahParam) {
    loadSurah(surahParam);
  } else {
    document.getElementById('ayat-container').innerHTML = '<div class="loading">Surah tidak ditemukan.</div>';
  }
};
