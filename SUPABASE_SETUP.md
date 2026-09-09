# Supabase Setup

Schema database CRM tersedia di `supabase/schema.sql`.

## Membuat Database

1. Buat project baru di [Supabase](https://supabase.com).
2. Buka **SQL Editor**.
3. Salin seluruh isi `supabase/schema.sql`.
4. Jalankan query.
5. Pastikan tabel dan view `customer_summary` sudah muncul di **Table Editor**.

## Struktur Utama

- `customers`: customer perusahaan atau perorangan.
- `customer_locations`: banyak lokasi milik customer.
- `customer_contacts`: banyak PIC milik customer.
- `assets`: aset genset milik satu customer.
- `asset_ownership_history`: histori perpindahan kepemilikan aset.
- `maintenance_schedules`: jadwal dan reminder maintenance.
- `maintenance_records`: histori pekerjaan perawatan.
- `work_orders`: SPK.
- `spare_parts`: master suku cadang.
- `maintenance_parts`: suku cadang yang dipakai pada pekerjaan.
- `employees`: user internal dan level akses.
- `audit_logs`: histori perubahan record.

## Catatan Keamanan

Schema mengaktifkan Row Level Security dan memberi akses awal kepada user yang sudah login. Policy ini sengaja sederhana untuk tahap pengembangan. Sebelum production, policy perlu diperketat berdasarkan `access_level` pada tabel `employees`.

## Koneksi Frontend

Adapter frontend sudah tersedia di `supabase-client.js`. Untuk mengaktifkan koneksi:

1. Salin `supabase-config.example.js` menjadi `supabase-config.js`.
2. Isi `url` dan `anonKey` dari **Project Settings > API**.
3. Jangan gunakan `service_role` key di browser.
4. Tambahkan kembali script konfigurasi di `index.html` sebelum `supabase-client.js`:

```html
<script src="supabase-config.js"></script>
```

Sebelum dipakai production, login Supabase dan policy RLS berbasis role harus diaktifkan. Tanpa konfigurasi, aplikasi tetap berjalan dalam mode demo dan tidak mengubah database.
