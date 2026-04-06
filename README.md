# Pacman-AIGame

# Pac-Man AI Game - Project

Proyek ini adalah game Pac-Man yang dikembangkan menggunakan **Cocos Creator** untuk memenuhi tugas Ujian Tengah Semester (UTS) mata kuliah AI pada Games. 

Game ini tidak hanya bisa dimainkan secara manual, tetapi juga memiliki fitur **Auto-Pilot AI** di mana Pac-Man dapat mengambil keputusan sendiri menggunakan algoritma *Steering Behaviors* (Seek, Flee, dan Wander).

---

---

## Cara Mengakses & Membuka Project (Selain git clone)
Karena project ini tidak menyertakan folder sampah/cache (`library` dan `temp`), ikuti langkah ini dengan teliti:

1. Di halaman GitHub ini, klik tombol hijau **`<> Code`** lalu pilih **Download ZIP**.
2. Ekstrak file ZIP tersebut di komputermu.
3. Buka **Cocos Dashboard**, masuk ke tab *Projects*, lalu klik tombol **Add** (atau *Import*).
4. Pilih folder hasil ekstrak tadi.
5. Klik project tersebut untuk membukanya di Cocos Creator.

**PERHATIAN SAAT LOADING AWAL:**
Saat pertama kali dibuka, loadingnya akan memakan waktu agak lama. Ini **NORMAL**. Cocos sedang men- *generate* ulang folder `library` dan `temp` yang disesuaikan dengan komputer. Tunggu sampai selesai.

---

## Menemukan Layar Utama (Scene)
Setelah loading selesai, layar tengah (Scene) mungkin akan terlihat kosong melompong.
1. Pergi ke panel **Assets** (biasanya di kiri bawah).
2. Cari file yang berakhiran **`.scene`** (scene.scene`).
3. **Double-click** file tersebut.
4. Seluruh map, UI, Pac-Man, dan Hantu akan langsung muncul di layar

---

## Fitur yang Sudah Dikerjakan (Progres Saat Ini)
- [x] **Basic Movement & Bounding Box:** Pac-Man dan Hantu bergerak di dalam area bingkai, memantul atau berhenti saat kena tembok.
- [x] **Food Spawner:** Makanan (Dot, Apple, Strawberry) muncul otomatis dengan probabilitas berbeda dan memiliki durasi kadaluarsa (hilang perlahan).
- [x] **Ghost AI (Seek & Patrol):** Hantu bergerak acak, tapi akan membelok tajam mengejar Pac-Man jika masuk ke dalam radius deteksi.
- [x] **Pac-Man Auto-Pilot:** Sistem Bot AI dengan prioritas: (1) Menghindar dari hantu terdekat, (2) Mencari makanan terdekat, (3) Bergerak bebas (Wander).
- [x] **Sistem Nyawa:** Pac-Man memiliki 3 nyawa. Jika kena hantu, nyawa berkurang (UI Hati menjadi abu-abu), posisi reset ke tengah, dan kebal sementara (kedap-kedip).

---
