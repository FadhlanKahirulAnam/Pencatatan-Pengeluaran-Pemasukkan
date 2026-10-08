// ===== 1. Ambil elemen dari HTML =====
const form = document.getElementById("form-transaksi");
const inputDeskripsi = document.getElementById("deskripsi");
const inputJumlah = document.getElementById("jumlah");
const inputKategori = document.getElementById("kategori");
const inputTanggal = document.getElementById("tanggal");
const labelKategori = document.getElementById("label-kategori");
const tombolSimpan = document.getElementById("tombol-simpan");
const pilihanJenis = document.querySelectorAll('input[name="jenis"]');
const daftar = document.getElementById("daftar");
const teksSaldo = document.getElementById("saldo");
const teksTotalMasuk = document.getElementById("total-masuk");
const teksTotalKeluar = document.getElementById("total-keluar");
const teksKosong = document.getElementById("kosong");

// ===== 2. Data (dibaca dari localStorage saat halaman dibuka) =====
// Setiap transaksi punya "jenis": "masuk" (tabungan) atau "keluar" (pengeluaran).
const KUNCI_PENYIMPANAN = "pengeluaran";

// Data lama (dari versi sebelumnya) belum punya "jenis", jadi dianggap pengeluaran.
let transaksi = (JSON.parse(localStorage.getItem(KUNCI_PENYIMPANAN)) || []).map((t) => ({
  ...t,
  jenis: t.jenis || "keluar",
}));

function simpan() {
  localStorage.setItem(KUNCI_PENYIMPANAN, JSON.stringify(transaksi));
}

// ===== 3. Fungsi bantu =====
function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);
}

function formatTanggal(teks) {
  // teks berbentuk "2026-10-04"
  return new Date(teks).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function hariIni() {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
  const hari = String(sekarang.getDate()).padStart(2, "0");
  return `${tahun}-${bulan}-${hari}`;
}

function jenisTerpilih() {
  return document.querySelector('input[name="jenis"]:checked').value;
}

function hitungTotal(jenis) {
  return transaksi
    .filter((t) => t.jenis === jenis)
    .reduce((jumlahSementara, t) => jumlahSementara + t.jumlah, 0);
}

// ===== 4. Atur tampilan form sesuai jenis (tabungan / pengeluaran) =====
function aturForm() {
  const masuk = jenisTerpilih() === "masuk";

  labelKategori.hidden = masuk; // kategori hanya untuk pengeluaran
  tombolSimpan.textContent = masuk ? "Tambah tabungan" : "Tambah pengeluaran";
  inputDeskripsi.placeholder = masuk ? "Contoh: gaji bulan ini" : "Contoh: makan siang";
}

// ===== 5. Tampilkan data ke layar =====
function render() {
  daftar.innerHTML = "";

  // Urutkan: tanggal terbaru di atas; kalau sama, yang dicatat terakhir di atas
  const urut = [...transaksi].sort(
    (a, b) => b.tanggal.localeCompare(a.tanggal) || b.id - a.id
  );

  urut.forEach((t) => {
    const masuk = t.jenis === "masuk";

    const li = document.createElement("li");
    li.className = "item";

    const kiri = document.createElement("div");
    const nama = document.createElement("div");
    nama.className = "item-nama";
    nama.textContent = t.deskripsi; // textContent lebih aman daripada innerHTML

    const info = document.createElement("div");
    info.className = "item-info";
    const label = masuk ? "Tabungan" : t.kategori;
    info.textContent = `${label}, ${formatTanggal(t.tanggal)}`;

    kiri.append(nama, info);

    const jumlah = document.createElement("div");
    jumlah.className = masuk ? "item-jumlah angka-masuk" : "item-jumlah angka-keluar";
    jumlah.textContent = (masuk ? "+" : "−") + formatRupiah(t.jumlah);

    const tombolHapus = document.createElement("button");
    tombolHapus.className = "hapus";
    tombolHapus.textContent = "Hapus";
    tombolHapus.addEventListener("click", () => hapusTransaksi(t.id));

    li.append(kiri, jumlah, tombolHapus);
    daftar.append(li);
  });

  // Hitung ringkasan: saldo = tabungan masuk - pengeluaran
  const totalMasuk = hitungTotal("masuk");
  const totalKeluar = hitungTotal("keluar");
  const saldo = totalMasuk - totalKeluar;

  teksTotalMasuk.textContent = formatRupiah(totalMasuk);
  teksTotalKeluar.textContent = formatRupiah(totalKeluar);
  teksSaldo.textContent = formatRupiah(saldo);
  teksSaldo.classList.toggle("negatif", saldo < 0);

  // Tampilkan pesan kosong jika belum ada data
  teksKosong.hidden = transaksi.length > 0;
}

// ===== 6. Tambah & hapus =====
function tambahTransaksi(event) {
  event.preventDefault(); // cegah halaman reload

  const jenis = jenisTerpilih();
  const jumlah = Number(inputJumlah.value);
  if (jumlah <= 0) return;

  // Peringatan kalau pengeluaran lebih besar dari saldo yang ada
  if (jenis === "keluar") {
    const saldoSekarang = hitungTotal("masuk") - hitungTotal("keluar");
    if (jumlah > saldoSekarang) {
      const lanjut = confirm(
        `Pengeluaran ini melebihi saldo tabungan (${formatRupiah(saldoSekarang)}). Tetap dicatat?`
      );
      if (!lanjut) return;
    }
  }

  transaksi.push({
    id: Date.now(),
    jenis: jenis,
    deskripsi: inputDeskripsi.value.trim(),
    jumlah: jumlah,
    kategori: jenis === "masuk" ? "Tabungan" : inputKategori.value,
    tanggal: inputTanggal.value,
  });

  simpan();
  render();

  form.reset(); // jenis kembali ke "Pengeluaran"
  aturForm();
  inputTanggal.value = hariIni();
  inputDeskripsi.focus();
}

function hapusTransaksi(id) {
  transaksi = transaksi.filter((t) => t.id !== id);
  simpan();
  render();
}

// ===== 7. Jalankan =====
form.addEventListener("submit", tambahTransaksi);
pilihanJenis.forEach((pilihan) => pilihan.addEventListener("change", aturForm));
inputTanggal.value = hariIni();
aturForm();
render();

// ===== 8. Daftarkan service worker (agar bisa dipasang & jalan offline) =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .catch((err) => console.log("Service worker gagal didaftarkan:", err));
  });
}