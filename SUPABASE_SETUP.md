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

Data frontend saat ini belum otomatis tersambung ke Supabase. Tahap berikutnya adalah menambahkan Supabase client, environment variable, login, lalu mengganti data mock dengan query ke tabel-tabel ini.
