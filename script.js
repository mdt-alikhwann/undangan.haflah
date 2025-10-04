  import {
      initializeApp
  } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
  import {
      getDatabase,
      ref,
      push,
      query,
      orderByChild,
      onValue, 
      set,
      runTransaction
  } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

  const firebaseConfig = {
      apiKey: "AIzaSyBNM0mRlVcg7NaKoLbKpXchkM9FbLT09h8",
      authDomain: "mdt-alihkwan.firebaseapp.com",
      databaseURL: "https://mdt-alihkwan-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "mdt-alihkwan",
      storageBucket: "mdt-alihkwan.firebasestorage.app",
      messagingSenderId: "984999928991",
      appId: "1:984999928991:web:de038c926a8341e794eeaa"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  const rsvpForm = document.getElementById("rsvpForm");
  const rsvpList = document.getElementById("rsvpList");
  const replyForm = document.getElementById("replyForm");
  let currentReplyKey = null; // simpan key yang mau dibalas

  // ==========================================================
// 🔹 Fungsi utilitas umum
// ==========================================================

// Ambil inisial dari nama, max 2 huruf
function getInitials(nama) {
  if (!nama || nama.trim() === "") return "HA"; // default Hamba Allah
  const words = nama.trim().split(" ");
  let initials = words[0].charAt(0).toUpperCase();
  if (words.length > 1) {
    initials += words[1].charAt(0).toUpperCase();
  }
  return initials;
}

// Ambil warna random subtle
function getRandomBg() {
  const colors = [
    "primary-subtle",
    "success-subtle",
    "danger-subtle",
    "warning-subtle",
    "info-subtle",
    "secondary-subtle"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

  // 🔹 Fungsi format relative time (Indonesia)
  function formatRelativeTime(timestamp) {
      const now = new Date();
      const waktu = new Date(timestamp);
      const diffMs = now - waktu;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return "baru saja";
      if (diffMin < 60) return `${diffMin} menit lalu`;
      if (diffHour < 24) return `${diffHour} jam lalu`;
      if (diffDay === 1) return `Kemarin ${waktu.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
      if (diffDay < 7) return `${diffDay} hari lalu`;

      return waktu.toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
      });
  }

  // ==========================================================
  // 🔹 BAGIAN RSVP (ucapan + status hadir) → TIDAK DIUBAH
  // ==========================================================
  rsvpForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nama = document.getElementById("nama").value;
      const status = document.getElementById("status").value;
      const ucapan = document.getElementById("ucapan").value;
      const jenisKelamin = document.querySelector('input[name="jenisKelamin"]:checked')?.value || "lainnya";

      push(ref(db, "rsvp"), {
          nama,
          status,
          ucapan,
          jenisKelamin,
          waktu: Date.now()
      });

      rsvpForm.reset();
      bootstrap.Modal.getInstance(document.getElementById("rsvpModal")).hide();
  });

  const rsvpQuery = query(ref(db, "rsvp"), orderByChild("waktu"));

onValue(rsvpQuery, (snapshot) => {
  rsvpList.innerHTML = "";
  let dataArr = [];
  let totalUcapan = 0;
  let totalReaction = 0;

  snapshot.forEach((child) => {
    const val = child.val();
    dataArr.push({
      key: child.key,
      ...val
    });
    totalUcapan++; // 🔹 hitung ucapan
  });

      // urutkan terbaru → terlama
      dataArr.reverse();

      dataArr.forEach((data) => {
          let badgeClass = "abu";
          let iconClass = "secondary";
          let icon = "";

          switch (data.status) {
              case "hadir":
                  badgeClass = "ijo";
                  iconClass = "success";
                  icon = `<i class="bi bi-check-circle-fill text-${iconClass}"></i>`;
                  break;
              case "tidak hadir":
                  badgeClass = "merah";
                  iconClass = "danger";
                  icon = `<i class="bi bi-x-circle-fill text-${iconClass}"></i>`;
                  break;
              case "masih bingung":
                  badgeClass = "abu";
                  iconClass = "secondary";
                  icon = `<i class="bi bi-question-circle-fill text-${iconClass}"></i>`;
                  break;
              case "insya Allah":
                  badgeClass = "biru";
                  iconClass = "primary";
                  icon = `<i class="bi bi-hand-thumbs-up-fill text-${iconClass}"></i>`;
                  break;
              default:
                  badgeClass = "abu";
                  iconClass = "secondary";
                  icon = `<i class="bi bi-dash-circle text-${iconClass}"></i>`;
          }


          const waktuTampil = formatRelativeTime(data.waktu);

          const card = `
  <div class="col-md-6 fade-up duration-2">
    <div class="card shadow-sm border-1 bg-${badgeClass}-subtle" 
         style="border-radius:10px;" 
         data-key="${data.key}">
      <div class="card-body px-1 py-2">
        <div class="container">
          <div class="row mb-0">
            <div class="col-2 mb-0 mt-1">
              <div class="foto-icon ms-0 d-flex align-items-center justify-content-center rounded-circle 
            bg-${getRandomBg()} text-dark"
     style="width:35px;height:35px;font-weight:bold;">
  ${getInitials(data.nama || data.munfiq)}
</div>
</div>
            <div class="col-10 text-start">
              <span class="card-title mb-0 fw-bold text-capitalize font-sedang">${data.nama}</span>
              <p class="text-${iconClass} text-capitalize font-kecil">${data.status}</p>
            </div>
          </div>
          <!-- Baris Ucapan -->
          <p class="text-start primary font-normal m-0">"${data.ucapan || "-"}"</p>

<div class="reaction-counts"></div>
<div class="reaction mt-2">
  <div class="emoji-list bg-primary-subtle rounded">
    <span class="emoji" data-emoji="❤️">❤️</span>
    <span class="emoji" data-emoji="😂">😂</span>
    <span class="emoji" data-emoji="😮">😮</span>
    <span class="emoji" data-emoji="😢">😢</span>
    <span class="emoji" data-emoji="👍">👍</span>
    <span class="emoji" data-emoji="🤲">🤲</span>
    <span class="emoji" data-emoji="🙏">🙏</span>
  </div>
</div>
  <!-- Counter jumlah reaction -->
  <div class="reaction-counts"></div>
          <div class="d-flex justify-content-between align-items-center abu">
            <button class="font-normal text-decoration-none btn text-primary border-0 p-0" 
                    data-bs-toggle="modal" data-bs-target="#replyModal">
              <i class="bi bi-reply-fill"></i> Balas
            </button>
            <button type="button" class="font-normal btn btn-reaction text-primary border-0 p-0">
                <i class="bi bi-hand-thumbs-up-fill"></i> Suka
            </button>
            <span class="font-kecil">${waktuTampil}</span>
          </div>
          <!-- Reply (hanya muncul kalau ada) -->
          ${data.reply ? `
            <div class="reply abu font-normal text-start mb-2">
              <p id="reply" class="secondary"><span class="fw-bold">@${data.nama}</span> ${data.reply}</p>
              <small class="font-kecil text-end d-block fst-italic" style="color:#9d9d9d;">- Panitia -</small>
            </div>` : ""}
        </div>
      </div>
    </div>
  </div>
`;
rsvpList.innerHTML += card;
      });

        // 🔹 Hitung total reaction dari path "reactions/rsvp"
  onValue(ref(db, "reactions/rsvp"), (snap) => {
    totalReaction = 0;
    if (snap.exists()) {
      const all = snap.val();
      Object.values(all).forEach(item => {
        Object.values(item).forEach(count => {
          totalReaction += count;
        });
      });
    }

    // 🔹 Tampilkan ringkasan
    document.getElementById("rsvpSummary").textContent =
      `Total Ucapan: ${totalUcapan} | Total Reaction: ${totalReaction}`;
  });
attachReactions("#rsvpList", "rsvp");
  });

  document.addEventListener("click", (e) => {
      if (e.target.closest("[data-bs-target='#replyModal']")) {
          const card = e.target.closest(".card");
          currentReplyKey = card.dataset.key;
      }
  });

  replyForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const replyText = document.getElementById("replyText").value.trim();
      if (!replyText || !currentReplyKey) return;

      const replyRef = ref(db, `rsvp/${currentReplyKey}/reply`);
      set(replyRef, replyText)
          .then(() => {
              bootstrap.Modal.getInstance(document.getElementById("replyModal")).hide();
              replyForm.reset();
          })
          .catch((err) => console.error("Error simpan reply:", err));
  });

// ====================== REACTION EMOJI (paste di sini) ======================
/*
  Pastikan di import firebase-database Anda ada runTransaction:
  import { ..., onValue, set, runTransaction } from ".../firebase-database.js";
*/

const EMOJIS = ["🙂","❤️","😂","😮","😢","👍","🤲","🙏"];

// render counts ke UI (menggunakan urutan EMOJIS)
function renderReactionsCounts(cardEl, data) {
  const countsDiv = cardEl.querySelector(".reaction-counts");
  if (!countsDiv) return;
  countsDiv.innerHTML = "";
  EMOJIS.forEach(emoji => {
    const count = (data && data[emoji]) ? data[emoji] : 0;
    if (count > 0) {
      countsDiv.innerHTML += `<span class="me-1">${emoji} ${count}</span>`;
    }
  });
}

// pastikan ada .emoji-list di dalam card; kalau belum buat otomatis
function ensureEmojiList(cardEl) {
  let list = cardEl.querySelector(".emoji-list");
  if (list) return list;

  list = document.createElement("div");
  list.className = "emoji-list";        // CSS sudah ada dari mas sebelumnya
  list.style.display = "none";

  EMOJIS.forEach(e => {
    const span = document.createElement("span");
    span.className = "emoji";
    span.dataset.emoji = e;
    span.textContent = e;
    list.appendChild(span);
  });

  // coba sisipkan setelah tombol .btn-reaction jika ada, else append ke card-body
  const btn = cardEl.querySelector(".btn-reaction");
  if (btn) btn.insertAdjacentElement("afterend", list);
  else cardEl.querySelector(".card-body")?.appendChild(list) ?? cardEl.appendChild(list);

  return list;
}

// inisialisasi reaction untuk 1 card (tipe: "rsvp" atau "konfirmasi")
function initReactionForCard(cardEl, tipe = "rsvp") {
  if (!cardEl || cardEl.dataset.reactionInit) return;
  const key = cardEl.dataset.key;
  if (!key) return; // kalau nggak ada key, skip

  const btn = cardEl.querySelector(".btn-reaction");
  const list = ensureEmojiList(cardEl);
  const countsDiv = cardEl.querySelector(".reaction-counts");

  // realtime listener untuk seluruh emoji di item ini
  const reactionPath = `reactions/${tipe}/${key}`;
  onValue(ref(db, reactionPath), (snap) => {
    renderReactionsCounts(cardEl, snap.exists() ? snap.val() : {});
  });

  // toggle show/hide (pakai class .show untuk animasi css)
  if (btn) {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (list.classList.contains("show")) {
        list.classList.remove("show");
        setTimeout(() => (list.style.display = "none"), 250);
      } else {
        list.style.display = "flex";
        setTimeout(() => list.classList.add("show"), 10);
      }
    });
  }

  // klik emoji → increment atomik pakai runTransaction
  list.querySelectorAll(".emoji").forEach(el => {
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const emoji = el.dataset.emoji;
      const emojiRef = ref(db, `${reactionPath}/${emoji}`);
      // increment atomik
      runTransaction(emojiRef, (current) => {
        return (current || 0) + 1;
      }).catch(err => console.error("reaction transaction error:", err));

      // tutup list
      list.classList.remove("show");
      setTimeout(() => (list.style.display = "none"), 250);
    });
  });

  cardEl.dataset.reactionInit = "1";
}

// fungsi bantu untuk attach semua card di dalam container (tipe: "rsvp" atau "konfirmasi")
function attachReactions(containerSelector = "#rsvpList", tipe = "rsvp") {
  document.querySelectorAll(`${containerSelector} .card[data-key]`).forEach(card => {
    initReactionForCard(card, tipe);
  });
}
// ================== Listener global sekali saja ==================
document.addEventListener("click", (e) => {
  document.querySelectorAll(".emoji-list.show").forEach(list => {
    // kalau klik bukan di dalam emoji-list dan bukan tombol react
    if (!list.contains(e.target) && !e.target.classList.contains("btn-reaction")) {
      list.classList.remove("show");
      setTimeout(() => (list.style.display = "none"), 250);
    }
  });
});

// ====================== END REACTION EMOJI ======================

  // ==========================================================
  // 🔹 BAGIAN KONFIRMASI (Infaq/Shodaqoh) → TAMBAHAN BARU
  // ==========================================================
  const konfirmasiForm = document.getElementById("konfirmasiForm");
  const konfirmasiList = document.getElementById("konfirmasiList");

  // Fungsi format rupiah
  function formatRupiah(angka) {
      return new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0
      }).format(angka || 0);
  }

  // Simpan konfirmasi
  konfirmasiForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const munfiq = document.getElementById("munfiq").value || "Hamba Allah";
      const banktujuan = document.getElementById("banktujuan").value;
      const nominal = parseInt(document.getElementById("nominal").value) || 0;

      push(ref(db, "konfirmasi"), {
          munfiq,
          banktujuan,
          nominal,
          waktu: Date.now()
      });

      konfirmasiForm.reset();
      bootstrap.Modal.getInstance(document.getElementById("konfirmasiModal")).hide();

      
    // ✅ Pesan WhatsApp (santai & akrab, 1 paragraf)
    const pesan = `Assalamu'alaikum, aku *${munfiq}*, baru saja transfer infaq Rp ${nominal} ke bank ${banktujuan}, mohon dicek ya, terima kasih 🙏`;

    // ✅ Redirect ke WhatsApp
    const url = `https://wa.me/6285156850068?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
  });

  // Query konfirmasi
  const konfirmasiQuery = query(ref(db, "konfirmasi"), orderByChild("waktu"));

onValue(konfirmasiQuery, (snapshot) => {
  konfirmasiList.innerHTML = "";
  let dataArr = [];
  let totalNominal = 0; // 🔹 jangan lupa reset dulu setiap kali refresh data

  snapshot.forEach((child) => {
    const val = child.val(); // 🔹 ambil isi child
    dataArr.push({
      key: child.key,
      ...val
    });
                  // 🔹 jumlahkan nominal
        totalNominal += parseInt(val.nominal) || 0;
      });

      dataArr.reverse();

      dataArr.forEach((data) => {
          const waktuTampil = formatRelativeTime(data.waktu);

          const card = `
  <div class="col-md-6 fade-up duration-2">
    <div class="card my-2 shadow-sm border-1 bg-ijo-subtle" data-key="${data.key}" style="border-radius:7px;">
      <div class="card-body p-2">
        <div class="container">
          <div class="row mb-0">
            <div class="col-2 mb-0 mt-1">
              <div class="foto-icon ms-0 d-flex align-items-center justify-content-center rounded-circle 
                          bg-${getRandomBg()} text-dark"
                  style="width:35px;height:35px;font-weight:bold;">
                ${getInitials(data.nama || data.munfiq)}
              </div>
              </div>
            <div class="col-10 text-start">
              <span class="card-title mb-1 fw-bold text-capitalize font-sedang">${data.munfiq}</span>
              <p class="abu text-capitalize font-kecil">${waktuTampil}</p>
            </div>

          </div>
          <p class="text-start abu font-normal m-0">
            Telah mengirimkan Infaq/ Shodaqoh sebesar <span class="fw-bold">${formatRupiah(data.nominal)}</span>
            via ${data.banktujuan}.
          </p>
<div class="reaction-counts"></div>
<div class="reaction mt-2">
  <div class="emoji-list bg-primary-subtle rounded">
    <span class="emoji" data-emoji="❤️">❤️</span>
    <span class="emoji" data-emoji="😂">😂</span>
    <span class="emoji" data-emoji="😮">😮</span>
    <span class="emoji" data-emoji="😢">😢</span>
    <span class="emoji" data-emoji="👍">👍</span>
    <span class="emoji" data-emoji="🤲">🤲</span>
    <span class="emoji" data-emoji="🙏">🙏</span>
  </div>
</div>
            <button type="button" class="font-normal btn btn-reaction text-primary border-0 p-0">
                <i class="bi bi-hand-thumbs-up-fill"></i> Suka
            </button>
        </div>
      </div>
    </div>
  </div>`;
          konfirmasiList.innerHTML += card;
      });
          // 🔹 Update total ke UI
    document.getElementById("totalInfaq").textContent = 
      `${formatRupiah(totalNominal)}`;

          attachReactions("#konfirmasiList", "konfirmasi");
  });

  // TOMBOL BUKA UNDANGAN
  const coverbtn = document.getElementById('openBtn');
  coverbtn.addEventListener('click', function() {
      document.body.style.overflow = 'auto'; // aktifkan scroll
      document.querySelectorAll('section').forEach(sec => {
          sec.style.visibility = 'visible';
          sec.style.opacity = '1';
      });

  });
