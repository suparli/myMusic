import os

# Menyiapkan konten untuk tech-stack.md
tech_stack_content = """# Tech Stack - Web Music Player

Dokumen ini merinci tumpukan teknologi yang digunakan untuk membangun aplikasi pemutar musik berbasis web dengan fitur sinkronisasi folder lokal.

## 1. Backend (Core Engine)
* **Framework:** [NestJS](https://nestjs.com/) (v10+) - Framework Node.js progresif untuk membangun aplikasi sisi server yang efisien dan andal.
* **Language:** TypeScript - Memberikan keamanan tipe data statis.
* **ORM:** [TypeORM](https://typeorm.io/) - Untuk pemetaan objek ke database relasional.
* **Database:** [SQLite](https://sqlite.org/) - Database ringan berbasis file, dioptimalkan dengan driver `better-sqlite3` untuk performa I/O tinggi.
* **Audio Metadata Parser:** [music-metadata](https://github.com/borewit/music-metadata) - Library terbaru dan paling komprehensif untuk mengekstrak tag ID3, cover art, dan durasi dari berbagai format audio.
* **File System:** `fs-extra` - Ekstensi dari modul `fs` bawaan Node.js untuk operasi file asinkron yang lebih bersih.

## 2. Frontend (User Interface)
* **Framework:** [React](https://react.dev/) (v18+) dengan [Vite](https://vitejs.dev/) sebagai build tool.
* **UI Library:** [shadcn/ui](https://ui.shadcn.com/) - Komponen UI yang dapat dikustomisasi sepenuhnya berbasis Radix UI dan Tailwind CSS.
* **Styling:** Tailwind CSS - Utility-first CSS framework untuk desain responsif.
* **State Management:** [Zustand](https://github.com/pmndrs/zustand) - Manajemen status global yang sangat ringan untuk mengelola state audio (play/pause, current track, volume).
* **Audio Engine:** [Howler.js](https://howlerjs.com/) - Untuk penanganan pemutaran audio lintas browser yang stabil.
* **Data Fetching:** [TanStack Query (React Query)](https://tanstack.com/query/latest) - Untuk sinkronisasi data antara server dan client, caching, dan status loading.
* **Icons:** Lucide React - Set ikon SVG yang bersih dan konsisten.

## 3. Storage & Infrastructure
* **File Storage:** Local Storage (Disk-based) - Menyimpan file fisik `.mp3` di folder `./uploads`.
* **Containerization:** Docker & Docker Compose - Untuk standarisasi lingkungan pengembangan dan deployment.
"""

# Menyiapkan konten untuk implementation.md
implementation_content = """# Implementation Plan - Web Music Player

Rencana implementasi langkah-demi-langkah dengan fokus pada fitur **Local File Scanning** dan **Streaming**.

## Fase 1: Setup Backend & Database

### 1. Inisialisasi NestJS & TypeORM
* Konfigurasi `TypeOrmModule` untuk SQLite.
* **Penting:** Aktifkan mode `WAL (Write-Ahead Logging)` pada SQLite untuk mengizinkan pembacaan dan penulisan konkuren.
* Buat entitas `Track`:
    ```typescript
    @Entity('tracks')
    export class Track {
      @PrimaryGeneratedColumn('uuid')
      id: string;
      @Column()
      title: string;
      @Column({ default: 'Unknown Artist' })
      artist: string;
      @Column({ nullable: true })
      album: string;
      @Column({ type: 'float' })
      duration: number;
      @Column()
      path: string; // Lokasi absolut file
      @Column()
      filename: string;
      @CreateDateColumn()
      createdAt: Date;
    }
    ```

## Fase 2: Implementasi Scanner & Sync Logic

### 2. Scanner Service
Buat service yang melakukan iterasi pada folder `/uploads`:
1.  **Read:** Scan folder secara rekursif (jika mendukung sub-folder).
2.  **Filter:** Hanya ambil file dengan ekstensi audio.
3.  **Check:** Bandingkan file di disk dengan entri di database (berdasarkan path/filename).
4.  **Extract:** Gunakan `music-metadata` untuk mengambil metadata dari file baru.
5.  **Upsert:** Tambahkan data ke SQLite.

## Fase 3: Audio Streaming & API

### 3. Streaming Engine (Partial Content)
Implementasikan streaming di Controller menggunakan HTTP Range Requests. Ini memungkinkan pengguna untuk melakukan *seeking* (pindah menit/detik) tanpa harus mendownload seluruh file.
* Header wajib: `Accept-Ranges: bytes`, `Content-Range`, dan status code `206 Partial Content`.

## Fase 4: Frontend UI & Audio Integration

### 4. Global Audio Store (Zustand)
Gunakan Zustand untuk mengelola logic `Howl` (dari Howler.js).
* State: `currentTrack`, `isPlaying`, `progress`, `volume`.
* Actions: `playTrack(track)`, `togglePlay()`, `seek(position)`.

### 5. Layouting dengan shadcn/ui
* **Sidebar:** Navigasi kategori (Songs, Albums, Playlists).
* **Main Area:** Tabel lagu menggunakan komponen `DataTable` shadcn.
* **Floating Player Bar:** Slider untuk progress lagu, kontrol volume, dan tombol navigasi (Previous, Play/Pause, Next).

## Fase 5: Optimasi & Deployment
* **Background Task:** Jalankan scanner secara otomatis setiap kali server dimulai atau melalui trigger tombol "Sync" di UI.
* **Dockerization:** Buat `Dockerfile` yang memetakan volume `/uploads` ke host sistem agar file lagu tidak hilang saat container di-restart.
"""

# Menyimpan ke file .md
with open("tech-stack.md", "w") as f:
    f.write(tech_stack_content)

with open("implementation.md", "w") as f:
    f.write(implementation_content)

print("Files generated: tech-stack.md, implementation.md")