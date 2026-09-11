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
7. Jalankan query `supabase/migrations/003_contacts_relations.sql` untuk memisahkan data contact dari relasi customer. Migration ini wajib dijalankan sebelum menambah PIC baru.
8. Jalankan query `supabase/migrations/004_customer_profile.sql` untuk mengaktifkan NPWP dan storage logo customer.
9. Jalankan query `supabase/migrations/005_cleanup_orphan_contacts.sql` untuk menghapus duplikat contact dan mencegah relasi ganda.
10. Jalankan query `supabase/migrations/006_drop_legacy_contact_link.sql` untuk membuang kolom backfill sementara agar relasi contact tidak ambigu.
11. Jalankan query `supabase/migrations/007_employee_sensitive_fields.sql` untuk field sensitif karyawan (foto, HP/email kedua, NPWP, bank) dan view direktori publik.
12. Jalankan query `supabase/migrations/008_contact_photo_secondary_fields.sql` untuk foto contact, HP 2, dan email 2 (nomor WhatsApp lama dipindahkan ke HP 2).
13. Jalankan query `supabase/migrations/009_spare_part_pricing.sql` untuk pricelist, dimensi/berat, harga beli terakhir, dan histori harga vendor.
14. Jalankan query `supabase/migrations/010_item_masters.sql` untuk tipe barang, kategori, merk, satuan bertingkat, foto produk, dan komposisi paket.
15. Jalankan query `supabase/migrations/011_vendors_opname.sql` untuk master pemasok dan dokumen stok opname.
16. Jalankan query `supabase/migrations/012_pricing_tax_substitutes.sql` untuk harga grosir bertingkat, PPN per barang, dan substitusi.
17. Jalankan query `supabase/migrations/013_view_pricing_columns.sql` untuk kolom harga dan pajak di view inventory.
18. Jalankan query `supabase/migrations/014_purchasing.sql` untuk purchase order dan penerimaan barang.
19. Jalankan query `supabase/migrations/015_sales.sql` untuk pesanan penjualan, pengiriman, faktur, dan pembayaran.
20. Jalankan query `supabase/migrations/016_serial_numbers.sql` untuk pelacakan nomor seri/batch dan tanggal kadaluarsa.
21. Jalankan query `supabase/migrations/017_item_requests.sql` untuk permintaan barang.
22. Jalankan query `supabase/migrations/018_manufacturing_pricing.sql` untuk produksi dan penyesuaian harga global.
23. Jalankan query `supabase/migrations/019_vendor_contacts.sql` untuk daftar PIC vendor dari direktori contact.
24. Jalankan query `supabase/migrations/020_party_links.sql` untuk relasi terpadu customer-pemasok (satu pihak bisa keduanya).

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
- `spare_parts`: master suku cadang, tipe barang, pricelist, dimensi, foto, dan harga beli terakhir.
- `spare_part_vendor_prices`: histori harga penawaran vendor per spare part.
- `item_categories`, `item_brands`, `units`: master kategori, merk, dan satuan.
- `item_units`: konversi satuan bertingkat dan harga per satuan.
- `spare_part_bundle_items`: komposisi barang tipe grup/paket.
- `purchase_orders`, `purchase_order_items`: PO ke pemasok dengan total otomatis.
- `goods_receipts`, `goods_receipt_items`: penerimaan barang yang menambah stok.
- `sales_orders`, `sales_order_items`: pesanan penjualan (bisa dari penawaran).
- `delivery_orders`, `delivery_items`: surat jalan yang mengurangi stok.
- `sales_invoices`, `invoice_payments`: faktur dan pelunasannya.
- `item_requests`, `item_request_items`: permintaan barang internal.
- `manufacture_orders`, `manufacture_materials`: pekerjaan pesanan dan HPP produksi.
- `price_adjustments`: audit penyesuaian harga jual global.
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
