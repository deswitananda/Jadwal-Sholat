// Fungsi helper untuk memastikan format waktu HH:mm
function formatTime(timeStr) {
  const parts = timeStr.split(":");
  return parts.map(p => p.padStart(2, "0")).join(":");
}
let adzanPlayedFor = null;
const countdownPrayerOrder = ["subuh", "dhuha", "dzuhur", "ashar", "maghrib", "isya"];
let countdownInterval = null;
const currentYear = new Date().getFullYear();
const hariContainer = document.getElementById("hariContainer");
const bulanContainer = document.getElementById("bulanContainer");
const btnHari = document.getElementById("btnHari");
const btnBulan = document.getElementById("btnBulan");
const hariScheduleCard = document.getElementById("hariScheduleCard");
const selectedInfo = document.getElementById("selectedInfo");
// Event Tombol Segmented
btnHari.addEventListener("click", function() {
  btnHari.classList.add("active");
  btnBulan.classList.remove("active");
  hariContainer.style.display = "block";
  bulanContainer.style.display = "none";
});
btnBulan.addEventListener("click", function() {
  btnBulan.classList.add("active");
  btnHari.classList.remove("active");
  hariContainer.style.display = "none";
  bulanContainer.style.display = "block";
  const currentMonthStr = (new Date().getMonth() + 1).toString().padStart(2, '0');
  fetchPrayerTimesForMonth(currentMonthStr);
});
// Fungsi Membuat Card Jadwal Hari
function buildDailyCardHtml(schedule) {
  const dayNames = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const d = new Date();
  const dayName = dayNames[d.getDay()];
  const dateStr = d.getDate().toString().padStart(2, '0');
  const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
  const yearStr = d.getFullYear();
  const dateFullStr = `${dayName}, ${dateStr}/${monthStr}/${yearStr}`;
  return `
    <div class="card mx-auto" style="max-width: 500px;">
      <div class="card-header text-center bg-white">
        <h4 class="mb-1">Jadwal Sholat Hari Ini</h4>
        <small class="text-muted">${dateFullStr}</small>
      </div>
      <ul class="list-group list-group-flush">
        <li class="list-group-item d-flex justify-content-between">
          <span>Imsak</span><span>${formatTime(schedule.imsak)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between">
          <span>Subuh</span><span>${formatTime(schedule.subuh)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between">
          <span>Terbit</span><span>${formatTime(schedule.terbit)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between">
          <span>Dhuha</span><span>${formatTime(schedule.dhuha)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between">
          <span>Dzuhur</span><span>${formatTime(schedule.dzuhur)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between">
          <span>Ashar</span><span>${formatTime(schedule.ashar)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between">
          <span>Maghrib</span><span>${formatTime(schedule.maghrib)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between">
          <span>Isya</span><span>${formatTime(schedule.isya)}</span>
        </li>
      </ul>
    </div>
  `;
}
async function fetchPrayerTimesForMonth(month) {
  const cityId = $("#citySelect").val();
  if (cityId) {
    $("#loadingIndicator").show();
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${currentYear}/${month}?t=${timestamp}`);
      const data = await response.json();
      if (data.status) {
        displaySchedule(data.data.jadwal);
      }
    } finally {
      $("#loadingIndicator").hide();
    }
  }
}
// Inisialisasi Select2
$(document).ready(function() {
  $("#citySelect").select2({ placeholder: "Pilih Kota/Kab.", allowClear: true });
});
function selectCityByName(cityName) {
  let found = false;
  $("#citySelect option").each(function() {
    if ($(this).text().toLowerCase().includes(cityName.toLowerCase())) {
      $(this).prop("selected", true).trigger("change");
      found = true;
      return false;
    }
  });
  if (!found) {
    console.warn("Kota tidak ditemukan dalam daftar. Menggunakan pilihan default.");
  }
  handleSelectionChange();
}
async function loadCities() {
  const cacheKey = "cachedCities";
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    const data = JSON.parse(cachedData);
    populateCitySelect(data);
    return;
  }
  try {
    const response = await fetch("https://api.myquran.com/v2/sholat/kota/semua");
    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify(data.data));
    populateCitySelect(data.data);
  } catch (error) {
    console.error("Gagal mengambil data kota:", error);
  }
}
function populateCitySelect(data) {
  data.forEach(city => {
    $("#citySelect").append(`<option value="${city.id}">${city.lokasi}</option>`);
  });
}
async function handleSelectionChange() {
  const selectedMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const cityName = $("#citySelect option:selected").text();
  selectedInfo.textContent =
    `Jadwal Sholat dan Imsakiyah ${cityName} - Bulan ${getMonthName(selectedMonth)} ${currentYear}`;
  if (selectedMonth && $("#citySelect").val()) {
    await fetchPrayerTimesForMonth(selectedMonth);
  }
}
function getMonthName(month) {
  const monthNames = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
  ];
  return monthNames[parseInt(month, 10) - 1] || month;
}
function displaySchedule(schedule) {
  const container = document.getElementById("scheduleContainer");
  container.innerHTML = "";
  const todayDate = new Date();
  const today = todayDate.getDate().toString().padStart(2, '0');
  let todaySchedule = null;
  let todayHighlightPrayer = -1;
  schedule.forEach(day => {
    const match = day.tanggal.match(/\d+/);
    const dayNumber = match ? parseInt(match[0]) : NaN;
    const isToday = (dayNumber.toString().padStart(2, '0') === today);
    let highlightPrayer = -1;
    if (isToday) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const subuhTime = parseInt(formatTime(day["subuh"]).split(":")[0], 10) * 60 + parseInt(formatTime(day["subuh"]).split(":")[1], 10);
      if (currentMinutes < subuhTime) {
        highlightPrayer = -2;
      } else {
        for (let i = 0; i < countdownPrayerOrder.length - 1; i++) {
          let parts1 = formatTime(day[countdownPrayerOrder[i]]).split(":");
          let parts2 = formatTime(day[countdownPrayerOrder[i + 1]]).split(":");
          let startMinutes = parseInt(parts1[0], 10) * 60 + parseInt(parts1[1], 10);
          let endMinutes = parseInt(parts2[0], 10) * 60 + parseInt(parts2[1], 10);
          if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            highlightPrayer = i;
            break;
          }
        }
        let partsIsya = formatTime(day["isya"]).split(":");
        let isyaTime = parseInt(partsIsya[0], 10) * 60 + parseInt(partsIsya[1], 10);
        if (currentMinutes >= isyaTime) {
          highlightPrayer = countdownPrayerOrder.length - 1;
        }
      }
      todaySchedule = day;
      todayHighlightPrayer = highlightPrayer;
    }
    let rowHtml = `<tr class="${isToday ? 'highlight-today' : ''}">`;
    const keys = ["tanggal", "imsak", "subuh", "terbit", "dhuha", "dzuhur", "ashar", "maghrib", "isya"];
    keys.forEach((key) => {
      let extraClass = "";
      if (isToday && key !== "tanggal" && key !== "imsak" && key !== "terbit") {
        if (todayHighlightPrayer >= 0 && key === countdownPrayerOrder[todayHighlightPrayer]) {
          extraClass = "current-prayer";
        }
      }
      // Untuk kolom waktu, gunakan formatTime agar konsisten
      rowHtml += `<td class="${extraClass}">${key === "tanggal" ? day[key] : formatTime(day[key])}</td>`;
    });
    rowHtml += "</tr>";
    container.innerHTML += rowHtml;
  });
  if (todaySchedule) {
    hariScheduleCard.innerHTML = buildDailyCardHtml(todaySchedule);
    updateCountdownNotification(todaySchedule, todayHighlightPrayer);
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      updateCountdownNotification(todaySchedule, todayHighlightPrayer);
    }, 1000);
  } else {
    hariScheduleCard.innerHTML = `<p class="text-center mt-3">Tidak ada jadwal sholat untuk hari ini.</p>`;
  }
  scrollToToday();
}
function updateCountdownNotification(todaySchedule, highlightPrayer) {
  const notification = document.getElementById("prayerNotificationText");
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  // Pastikan waktu imsak terformat
  const imsakTimeStr = formatTime(todaySchedule.imsak);
  const imsakParts = imsakTimeStr.split(":");
  const imsakMinutes = parseInt(imsakParts[0], 10) * 60 + parseInt(imsakParts[1], 10);
  if (nowMinutes < imsakMinutes) {
    const imsakDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(imsakParts[0], 10), parseInt(imsakParts[1], 10), 0);
    let diffMs = imsakDate - now;
    if (diffMs < 0) diffMs = 0;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    notification.innerHTML = `${diffHours} jam, ${diffMinutes} menit, ${diffSeconds} detik lagi menuju Imsak.`;
    if (diffHours === 0 && diffMinutes === 0 && diffSeconds === 0) {
      document.getElementById("imsakAudio").play();
    }
    return;
  }
  
  let notificationText = "";
  let nextPrayerIndex;
  if (highlightPrayer === -2) {
    nextPrayerIndex = 0;
  } else if (highlightPrayer >= 0 && highlightPrayer < countdownPrayerOrder.length - 1) {
    nextPrayerIndex = highlightPrayer + 1;
  } else if (highlightPrayer === countdownPrayerOrder.length - 1) {
    nextPrayerIndex = null;
  }
  
  if (nextPrayerIndex !== null) {
    const countdown = updateCountdown(todaySchedule, nextPrayerIndex);
    notificationText = `${countdown.diffHours} jam, ${countdown.diffMinutes} menit, ${countdown.diffSeconds} detik lagi memasuki sholat ${countdownPrayerOrder[nextPrayerIndex].toUpperCase()}.`;
    if (countdown.diffHours === 0 && countdown.diffMinutes === 0 && countdown.diffSeconds === 0) {
      if (adzanPlayedFor !== nextPrayerIndex) {
        if (nextPrayerIndex === 0) {
          document.getElementById("adhanSubuhAudio").play();
        } else {
          document.getElementById("adhanAudio").play();
        }
        adzanPlayedFor = nextPrayerIndex;
      }
    }
  } else {
    notificationText = "Sholat hari ini telah selesai.";
    adzanPlayedFor = null;
  }
  notification.innerHTML = notificationText;
}
function updateCountdown(todaySchedule, nextPrayerIndex) {
  const now = new Date();
  let timeStr = formatTime(todaySchedule[countdownPrayerOrder[nextPrayerIndex]]);
  const [hour, minute] = timeStr.split(":").map(Number);
  const nextPrayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
  let diffMs = nextPrayerDate - now;
  if (diffMs < 0) diffMs = 0;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  return { diffHours, diffMinutes, diffSeconds };
}
function scrollToToday() {
  const highlightRow = document.querySelector(".highlight-today");
  if (highlightRow) {
    highlightRow.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}
// Agar audio dapat diputar (Browser memerlukan interaksi pengguna)
document.addEventListener("click", function enableAudio() {
  const adzanAudio = document.getElementById("adhanAudio");
  adzanAudio.play().then(() => {
    adzanAudio.pause();
    document.removeEventListener("click", enableAudio);
  }).catch((err) => {
    console.error("Audio play failed:", err);
  });
});
document.addEventListener("DOMContentLoaded", function () {
  function applyDarkMode() {
    let now = new Date();
    let hours = now.getHours();
    let isDarkMode = hours >= 18 || hours < 5;
    document.body.classList.toggle("dark-mode", isDarkMode);
  }
  applyDarkMode();
  setInterval(applyDarkMode, 1000);
});
$(document).ready(async function () {
  $("#citySelect").select2({ placeholder: "Pilih Kota/Kab.", allowClear: true });
  await loadCities();
  // Set default langsung ke kota Medan (ID "0228")
  $("#citySelect").val("0228").trigger("change");
  btnHari.classList.add("active");
  hariContainer.style.display = "block";
  bulanContainer.style.display = "none";
  const currentMonthStr = (new Date().getMonth() + 1).toString().padStart(2, '0');
  fetchPrayerTimesForMonth(currentMonthStr);
});