# Supabase Setup

Schema database CRM tersedia di `supabase/schema.sql`.

Inventory spare part dan quotation tambahan tersedia di `supabase/migrations/002_spare_parts_inventory_quotes.sql` dan dijalankan setelah schema utama.
Relasi contact/PIC tersedia di `supabase/migrations/003_contacts_relations.sql` dan dijalankan setelah migration inventory.
Profil customer dan logo tersedia di `supabase/migrations/004_customer_profile.sql` dan dijalankan setelah migration contact.

## Membuat Database

1. Buat project baru di [Supabase](https://supabase.com).
2. Buka **SQL Editor**.
3. Salin seluruh isi `supabase/schema.sql`.
4. Jalankan query.
5. Pastikan tabel dan view `customer_summary` sudah muncul di **Table Editor**.
6. Jalankan query `supabase/migrations/002_spare_parts_inventory_quotes.sql` untuk mengaktifkan stok, histori pergerakan, dan quotation.
7. Jalankan query `supabase/migrations/003_contacts_relations.sql` untuk memisahkan data contact dari relasi customer.
8. Jalankan query `supabase/migrations/004_customer_profile.sql` untuk mengaktifkan NPWP dan storage logo customer.

## Struktur Utama

- `customers`: akun customer tanpa batasan tipe perusahaan atau perorangan.
- `customer_locations`: banyak lokasi milik customer.
- `customer_contacts`: banyak PIC milik customer.
- `contacts`: data detail orang/contact yang dapat terhubung ke banyak customer.
- `assets`: aset genset milik satu customer.
- `asset_ownership_history`: histori perpindahan kepemilikan aset.
- `maintenance_schedules`: jadwal dan reminder maintenance.
- `maintenance_records`: histori pekerjaan perawatan.
- `work_orders`: SPK.
- `spare_parts`: master suku cadang.
- `maintenance_parts`: suku cadang yang dipakai pada pekerjaan.
- `employees`: user internal dan level akses.
- `audit_logs`: histori perubahan record.
- `warehouses`: gudang atau lokasi penyimpanan spare part.
- `inventory_movements`: transaksi stok masuk, keluar, dan adjustment.
- `spare_part_inventory`: view stok aktual berdasarkan pergerakan.
- `quotations`: header penawaran customer.
- `quotation_items`: detail spare part atau jasa di dalam penawaran.

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
