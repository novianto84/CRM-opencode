const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const showToast = (message, error = false) => {
  const toast = document.createElement('div');
  toast.className = `app-toast${error ? ' app-toast-error' : ''}`;
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 3200);
};

const modal = $('#modalBackdrop');
const openModal = () => modal.classList.add('open');
const closeModal = () => modal.classList.remove('open');
const assetModal = $('#assetModalBackdrop');
const openAssetModal = () => assetModal.classList.add('open');
const closeAssetModal = () => assetModal.classList.remove('open');

$('#addContactButton').addEventListener('click', openModal);
$('#closeModal').addEventListener('click', closeModal);
$('#cancelModal').addEventListener('click', closeModal);
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
$('#closeAssetModal').addEventListener('click', closeAssetModal);
$('#cancelAssetModal').addEventListener('click', closeAssetModal);
assetModal.addEventListener('click', (event) => { if (event.target === assetModal) closeAssetModal(); });
const operationModeField = document.createElement('label');
operationModeField.innerHTML = 'Modus operasi<select required name="operationMode"><option value="Standby">Standby</option><option value="Schedule">Schedule</option><option value="Running 24H">Running 24H</option></select>';
$('#assetForm .asset-form-grid').append(operationModeField);
const assetCustomerField = document.createElement('label');
assetCustomerField.innerHTML = 'Pemilik / customer<select required name="customer"><option value="PT Sinar Abadi">PT Sinar Abadi</option><option value="PT Maju Konstruksi">PT Maju Konstruksi</option><option value="Budi Santoso">Budi Santoso</option><option value="Lina Marlina">Lina Marlina</option></select>';
$('#assetForm .asset-form-grid').append(assetCustomerField);
const assetCapacityField = document.createElement('label');
assetCapacityField.innerHTML = 'Kapasitas genset<input required name="capacity" placeholder="Contoh: 125 kVA" />';
const installationDateField = document.createElement('label');
installationDateField.innerHTML = 'Tanggal instalasi<input type="date" name="installationDate" />';
const warrantyStartField = document.createElement('label');
warrantyStartField.innerHTML = 'Garansi mulai<input type="date" name="warrantyStart" />';
const warrantyEndField = document.createElement('label');
warrantyEndField.innerHTML = 'Garansi berakhir<input type="date" name="warrantyEnd" />';
$('#assetForm .asset-form-grid').append(assetCapacityField, installationDateField, warrantyStartField, warrantyEndField);
const formatUpdateStamp = () => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());

const code39 = {'0':'101001101101','1':'110100101011','2':'101100101011','3':'110110010101','4':'101001101011','5':'110100110101','6':'101100110101','7':'101001011011','8':'110100101101','9':'101100101101','A':'110101001011','B':'101101001011','C':'110110100101','D':'101011001011','E':'110101100101','F':'101101100101','G':'101010011011','H':'110101001101','I':'101101001101','J':'101011001101','K':'110101010011','L':'101101010011','M':'110110101001','N':'101011010011','O':'110101101001','P':'101101101001','Q':'101010110011','R':'110101011001','S':'101101011001','T':'101011011001','U':'110010101011','V':'100110101011','W':'110011010101','X':'100101101011','Y':'110010110101','Z':'100110110101','-':'100101011011'};
const makeBarcode = (value) => {
  const encoded = `*${value.toUpperCase()}*`;
  let x = 8;
  const bars = [];
  [...encoded].forEach((char) => {
    [...code39[char]].forEach((bit, index) => {
      if (bit === '1') bars.push(`<rect x="${x}" y="6" width="${index % 2 ? 2 : 3}" height="54"/>`);
      x += index % 2 ? 3 : 4;
    });
    x += 5;
  });
  return `<svg class="barcode-svg" viewBox="0 0 ${x + 8} 80" role="img" aria-label="Barcode ${value}"><g fill="currentColor">${bars.join('')}</g><text x="50%" y="75" text-anchor="middle">${value}</text></svg>`;
};
const detailModal = document.createElement('div');
detailModal.className = 'modal-backdrop';
detailModal.id = 'assetDetailModal';
detailModal.innerHTML = '<div class="modal asset-detail-modal"><div class="modal-header"><div><p class="eyebrow">DETAIL ASET</p><h2 id="detailTitle">Aset genset</h2><p class="detail-subtitle" id="detailSubtitle"></p></div><button class="icon-button" id="closeDetailModal"><svg><use href="#i-close"/></svg></button></div><div class="barcode-card"><div id="barcodeVisual"></div><span>Scan untuk membuka histori unit</span></div><div class="detail-meta" id="detailMeta"></div><div class="history-heading"><h3>Histori perawatan & suku cadang</h3><span class="status status-green">Terverifikasi</span></div><div class="maintenance-list"><div><span class="history-date">18 Agu 2026</span><p><b>Servis berkala 1.000 jam</b><small>Penggantian oli mesin, filter oli, dan pemeriksaan sistem pendingin</small></p><strong>Rp 4.850.000</strong></div><div><span class="history-date">02 Feb 2026</span><p><b>Penggantian suku cadang</b><small>Battery 12V 150Ah · Part BAT-12V-150</small></p><strong>Rp 3.200.000</strong></div><div><span class="history-date">11 Nov 2025</span><p><b>Preventive maintenance</b><small>Filter solar dan filter udara · Part FLT-DL-125</small></p><strong>Rp 1.750.000</strong></div></div><div class="log-heading"><h3>Histori log record</h3><span class="last-update-badge" id="lastUpdateBadge"></span></div><div class="log-list" id="assetLogList"></div><div class="detail-actions"><button class="secondary-button" id="copyCustomerLink">Salin link customer</button><button class="primary-button" id="closeDetailButton">Tutup</button></div></div>';
document.body.append(detailModal);
const closeDetail = () => detailModal.classList.remove('open');
$('#closeDetailModal').addEventListener('click', closeDetail);
$('#closeDetailButton').addEventListener('click', closeDetail);
detailModal.addEventListener('click', (event) => { if (event.target === detailModal) closeDetail(); });
let activeAssetId = '';
const openAssetDetail = (row) => {
  activeAssetId = row.dataset.assetId;
  const cells = row.querySelectorAll('td');
  $('#detailTitle').textContent = row.querySelector('.asset-name b').textContent;
  $('#detailSubtitle').textContent = `${activeAssetId} · ${cells[3].textContent}`;
  $('#barcodeVisual').innerHTML = makeBarcode(activeAssetId);
  $('#detailMeta').innerHTML = `<div><span>Customer</span><b>${row.dataset.customer || 'PT Sinar Abadi'}</b></div><div><span>Kapasitas</span><b>${row.dataset.capacity || 'Belum dicatat'}</b></div><div><span>Lokasi</span><b>${cells[4].textContent}</b></div><div><span>Garansi</span><b>${row.dataset.warrantyEnd || 'Belum dicatat'}</b></div><div><span>Last update</span><b>${row.dataset.lastUpdated}</b></div>`;
  $('#lastUpdateBadge').textContent = `Update terakhir ${row.dataset.lastUpdated}`;
  $('#assetLogList').innerHTML = `<div><span class="log-dot"></span><div><b>Data aset diperbarui</b><small>${row.dataset.lastUpdated} · oleh Administrator</small></div></div><div><span class="log-dot log-dot-muted"></span><div><b>Record aset dibuat</b><small>12 Jan 2025 · oleh Administrator</small></div></div>`;
  detailModal.classList.add('open');
};
$('#copyCustomerLink').addEventListener('click', async () => {
  const link = `${window.location.origin}${window.location.pathname}?asset=${encodeURIComponent(activeAssetId)}`;
  try { await navigator.clipboard.writeText(link); } catch { /* Clipboard may be unavailable on file previews. */ }
  $('#copyCustomerLink').textContent = 'Link tersalin';
  window.setTimeout(() => { $('#copyCustomerLink').textContent = 'Salin link customer'; }, 1800);
});

$('#contactForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const name = form.get('name');
  const email = form.get('email');
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const row = document.createElement('tr');
  row.innerHTML = `<td><div class="person"><div class="avatar avatar-purple">${initials}</div><div><b>${name}</b><small>${email}</small></div></div></td><td><span class="status status-blue">${form.get('status')}</span></td><td>Belum ada unit</td><td>Hari ini</td><td><b>Rp 0</b></td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td>`;
  $('#contactRows').prepend(row);
  event.target.reset();
  closeModal();
});

$('#globalSearch').addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  $$('#contactRows tr').forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(query); });
});

$('#notificationButton').addEventListener('click', () => $('#notificationPopover').classList.toggle('open'));
document.addEventListener('click', (event) => {
  if (!event.target.closest('.notification-button') && !event.target.closest('.notification-popover')) $('#notificationPopover').classList.remove('open');
});

$$('.nav-item').forEach((item) => item.addEventListener('click', () => {
  $$('.nav-item').forEach((nav) => nav.classList.remove('active'));
  item.classList.add('active');
  const module = item.dataset.module;
  if (module) {
    $('#breadcrumbTitle').textContent = module;
    document.title = `RuangCRM — ${module}`;
    const isCompany = module === 'Perusahaan';
    const isAsset = module === 'Asset';
    const isEmployee = module === 'Karyawan';
    const isCustomer = module === 'Customer';
    const isMaintenance = module === 'Maintenance';
    const isWorkOrder = module === 'SPK';
    const isInventory = module === 'Inventory';
    $('#overviewView').hidden = isCompany || isAsset || isEmployee || isCustomer || isMaintenance || isWorkOrder || isInventory;
    $('#companyView').hidden = !isCompany;
    $('#assetView').hidden = !isAsset;
    $('#employeeView').hidden = !isEmployee;
    $('#customerView').hidden = !isCustomer;
    $('#maintenanceView').hidden = !isMaintenance;
    $('#workOrderView').hidden = !isWorkOrder;
    $('#inventoryView').hidden = !isInventory;
  }
  $('#sidebar').classList.remove('open');
}));

const periodData = {
  monthly: [['Jan',43],['Feb',57],['Mar',50],['Apr',67],['Mei',60],['Jun',78],['Jul',91]],
  weekly: [['M1',38],['M2',51],['M3',44],['M4',69],['M5',58],['M6',73],['M7',84]],
  yearly: [['2020',34],['2021',48],['2022',56],['2023',64],['2024',72],['2025',79],['2026',91]]
};
$('#periodSelect').addEventListener('change', (event) => {
  $('#salesBars').innerHTML = periodData[event.target.value].map(([label, height], index) => `<span style="height:${height}%" class="${index === 6 ? 'current' : ''}"><b>${label}</b></span>`).join('');
});

$('#menuButton').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

$('#companyForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  $('#summaryCompanyName').textContent = form.get('companyName');
  $('#summaryPhone').textContent = form.get('phone');
  $('#summaryEmail').textContent = form.get('email');
  $('#summaryAddress').textContent = form.get('address').split(',')[1]?.trim() || form.get('address');
  $('#companySaveState').textContent = 'Perubahan tersimpan barusan';
  window.setTimeout(() => { $('#companySaveState').textContent = 'Semua perubahan tersimpan'; }, 2500);
});

const announcePic = () => {
  $('#companySaveState').textContent = 'Modul PIC siap dihubungkan';
  window.setTimeout(() => { $('#companySaveState').textContent = 'Semua perubahan tersimpan'; }, 2500);
};
$('#addPicButton').addEventListener('click', announcePic);
$('#emptyAddPicButton').addEventListener('click', announcePic);

const filterAssets = () => {
  const query = $('#assetSearch').value.toLowerCase();
  const status = $('#assetStatusFilter').value;
  let visible = 0;
  $$('#assetRows tr').forEach((row) => {
    const matchesQuery = row.textContent.toLowerCase().includes(query);
    const matchesStatus = status === 'all' || row.dataset.status === status;
    row.hidden = !(matchesQuery && matchesStatus);
    if (!row.hidden) visible += 1;
  });
  $('#assetCount').textContent = `${visible} dari 24`;
};
$$('#assetRows tr').forEach((row, index) => {
  row.dataset.lastUpdated = ['09 Sep 2026, 10.42', '08 Sep 2026, 16.18', '04 Sep 2026, 09.05', '28 Agu 2026, 14.30'][index] || formatUpdateStamp();
  row.dataset.customer = ['PT Sinar Abadi', 'PT Maju Konstruksi', 'Budi Santoso', 'Lina Marlina'][index] || 'PT Sinar Abadi';
  row.dataset.capacity = ['250 kVA', '125 kVA', '500 kVA', '80 kVA'][index] || 'Belum dicatat';
  row.dataset.installationDate = ['12 Jan 2024', '18 Okt 2024', '04 Nov 2023', '21 Mar 2022'][index] || 'Belum dicatat';
  row.dataset.warrantyStart = ['12 Jan 2024', '18 Okt 2024', '04 Nov 2023', '21 Mar 2022'][index] || 'Belum dicatat';
  row.dataset.warrantyEnd = ['12 Jan 2027', '18 Okt 2027', '04 Nov 2026', '21 Mar 2025'][index] || 'Belum dicatat';
  const identity = row.querySelector('.asset-name small');
  if (!identity || identity.querySelector('.asset-id')) return;
  const assetId = `AST-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`;
  row.dataset.assetId = assetId;
  identity.innerHTML = `<span class="asset-id">${assetId}</span> · ${identity.textContent}`;
});
['Standby', 'Schedule', 'Running 24H', 'Standby'].forEach((mode, index) => {
  const config = $$('#assetRows tr')[index]?.querySelector('.config-cell');
  if (!config) return;
  const modeLabel = document.createElement('small');
  modeLabel.className = 'mode-label';
  modeLabel.textContent = mode;
  config.append(document.createElement('br'), modeLabel);
});
$$('#assetRows .more-button').forEach((button) => button.addEventListener('click', () => openAssetDetail(button.closest('tr'))));
const sharedAssetId = new URLSearchParams(window.location.search).get('asset');
if (sharedAssetId) {
  const sharedRow = [...$$('#assetRows tr')].find((row) => row.dataset.assetId === sharedAssetId);
  if (sharedRow) openAssetDetail(sharedRow);
}
$('#assetSearch').addEventListener('input', filterAssets);
$('#assetStatusFilter').addEventListener('change', filterAssets);
$('#addAssetButton').addEventListener('click', openAssetModal);

$('#assetForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  let savedAsset = null;
  if (window.crmDb?.ready) {
    const customerResult = await window.crmDb.findCustomerByName(form.get('customer'));
    if (customerResult.error || !customerResult.data) { window.alert('Customer pemilik belum tersedia di database. Tambahkan customer terlebih dahulu.'); return; }
    const assetResult = await window.crmDb.createAsset({
      customer_id: customerResult.data.id,
      name: `Genset ${form.get('capacity')}`,
      generator_serial: form.get('generatorSerial'),
      generator_type: form.get('generatorType').toLowerCase().replaceAll(' ', '_'),
      operation_system: form.get('operationSystem').toLowerCase().replaceAll(' ', '_'),
      operation_mode: form.get('operationMode').toLowerCase().replaceAll(' ', '_'),
      engine_serial: form.get('engineSerial'),
      engine_type: form.get('engineType'),
      alternator_serial: form.get('alternatorSerial'),
      alternator_type: form.get('alternatorType'),
      capacity_kva: Number.parseFloat(form.get('capacity')) || null,
      installation_date: form.get('installationDate') || null,
      warranty_start_date: form.get('warrantyStart') || null,
      warranty_end_date: form.get('warrantyEnd') || null
    });
    if (assetResult.error) { window.alert(`Aset belum tersimpan: ${assetResult.error.message}`); return; }
    savedAsset = assetResult.data;
  }
  const serial = form.get('generatorSerial');
  const assetId = savedAsset?.asset_code || `AST-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const row = document.createElement('tr');
  row.dataset.status = 'operational';
  row.dataset.assetId = assetId;
  row.dataset.engineSerial = form.get('engineSerial');
  row.dataset.engineType = form.get('engineType');
  row.dataset.alternatorSerial = form.get('alternatorSerial');
  row.dataset.alternatorType = form.get('alternatorType');
  row.dataset.operationMode = form.get('operationMode');
  row.dataset.customer = form.get('customer');
  row.dataset.capacity = form.get('capacity');
  row.dataset.installationDate = form.get('installationDate') || 'Belum dicatat';
  row.dataset.warrantyStart = form.get('warrantyStart') || 'Belum dicatat';
  row.dataset.warrantyEnd = form.get('warrantyEnd') || 'Belum dicatat';
  row.dataset.lastUpdated = formatUpdateStamp();
  row.innerHTML = `<td><div class="asset-name"><span class="asset-thumb">G</span><div><b>Genset ${form.get('generatorType')}</b><small><span class="asset-id">${assetId}</span> · ${serial}</small></div></div></td><td>Genset Diesel</td><td><span class="config-cell">${form.get('generatorType')}<br><small>${form.get('operationSystem')}</small><br><small class="mode-label">${form.get('operationMode')}</small></span><span class="sr-only">${form.get('engineSerial')} ${form.get('engineType')} ${form.get('alternatorSerial')} ${form.get('alternatorType')}</span></td><td>${serial}</td><td>${form.get('location')}</td><td><span class="status status-green">Beroperasi</span></td><td><b>0 jam</b></td><td>Belum dijadwalkan</td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td>`;
  $('#assetRows').prepend(row);
  row.querySelector('.more-button').addEventListener('click', () => openAssetDetail(row));
  $('#assetForm').reset();
  closeAssetModal();
  $('#assetCount').textContent = `${$('#assetRows').querySelectorAll('tr').length} dari 24`;
});

const employeeModal = document.createElement('div');
employeeModal.className = 'modal-backdrop';
employeeModal.id = 'employeeModal';
employeeModal.innerHTML = '<div class="modal employee-modal"><div class="modal-header"><div><p class="eyebrow">MASTER DATA INTERNAL</p><h2>Tambah karyawan</h2></div><button class="icon-button" id="closeEmployeeModal"><svg><use href="#i-close"/></svg></button></div><p class="modal-description">User ini dapat ditetapkan sebagai pelaksana SPK dan tercatat pada setiap perubahan record.</p><form id="employeeForm"><div class="employee-form-grid"><label>Nama lengkap<input required name="name" placeholder="Contoh: Andi Wijaya" /></label><label>Email kerja<input required type="email" name="email" placeholder="andi@ruangmotors.id" /></label><label>Jabatan<input required name="position" placeholder="Contoh: Teknisi Senior" /></label><label>Departemen<select required name="department"><option value="service">Service & Teknisi</option><option value="sales">Sales</option><option value="admin">Administrasi</option></select></label><label>Level akses<select required name="access"><option value="Operator">Operator</option><option value="Editor">Editor</option><option value="Viewer">Viewer</option><option value="Administrator">Administrator</option></select></label><label>No. telepon<input name="phone" placeholder="Contoh: 0812 0000 0000" /></label></div><div class="modal-actions"><button type="button" class="secondary-button" id="cancelEmployeeModal">Batal</button><button class="primary-button" type="submit">Simpan karyawan</button></div></form></div>';
document.body.append(employeeModal);
const closeEmployeeModal = () => employeeModal.classList.remove('open');
$('#addEmployeeButton').addEventListener('click', () => employeeModal.classList.add('open'));
$('#closeEmployeeModal').addEventListener('click', closeEmployeeModal);
$('#cancelEmployeeModal').addEventListener('click', closeEmployeeModal);
employeeModal.addEventListener('click', (event) => { if (event.target === employeeModal) closeEmployeeModal(); });
$('#employeeSearch').addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  const department = $('#employeeRoleFilter').value;
  let visible = 0;
  $$('#employeeRows tr').forEach((row) => {
    const matches = row.textContent.toLowerCase().includes(query) && (department === 'all' || row.dataset.department === department);
    row.hidden = !matches;
    if (matches) visible += 1;
  });
  $('#employeeCount').textContent = `${visible} dari 18`;
});
$('#employeeRoleFilter').addEventListener('change', () => $('#employeeSearch').dispatchEvent(new Event('input')));
$('#employeeForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  let savedEmployee = null;
  if (window.crmDb?.ready) {
    const result = await window.crmDb.createEmployee({ full_name: form.get('name'), email: form.get('email'), phone: form.get('phone') || null, position: form.get('position'), department: form.get('department') === 'service' ? 'Service & Teknisi' : form.get('department') === 'sales' ? 'Sales' : 'Administrasi', access_level: form.get('access').toLowerCase() });
    if (result.error) { window.alert(`Karyawan belum tersimpan: ${result.error.message}`); return; }
    savedEmployee = result.data;
  }
  const name = form.get('name');
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const accessClass = { Administrator: 'access-admin', Editor: 'access-editor', Operator: 'access-operator', Viewer: 'access-viewer' }[form.get('access')];
  const row = document.createElement('tr');
  row.dataset.department = form.get('department');
  if (savedEmployee) row.dataset.employeeId = savedEmployee.id;
  row.innerHTML = `<td><div class="person"><div class="avatar avatar-purple">${initials}</div><div><b>${name}</b><small>${form.get('email')}</small></div></div></td><td>${form.get('position')}</td><td>${form.get('department') === 'service' ? 'Service & Teknisi' : form.get('department') === 'sales' ? 'Sales' : 'Administrasi'}</td><td><span class="access ${accessClass}">${form.get('access')}</span></td><td><span class="status status-green">Aktif</span></td><td>Baru saja</td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td>`;
  $('#employeeRows').prepend(row);
  event.target.reset();
  closeEmployeeModal();
});

const customerModal = document.createElement('div');
customerModal.className = 'modal-backdrop';
customerModal.id = 'customerModal';
customerModal.innerHTML = '<div class="modal customer-modal"><div class="modal-header"><div><p class="eyebrow">MASTER DATA CUSTOMER</p><h2>Tambah customer</h2></div><button class="icon-button" id="closeCustomerModal"><svg><use href="#i-close"/></svg></button></div><p class="modal-description">Customer menyimpan data akun. PIC dapat ditambahkan dan dihubungkan secara terpisah.</p><form id="customerForm"><div class="customer-form-grid"><label>Nama customer<input required name="name" placeholder="Nama perusahaan atau perorangan" /></label><label>PIC utama<input name="contact" placeholder="Nama PIC utama (opsional)" /></label><label>No. telepon<input name="phone" placeholder="0812 0000 0000" /></label><label>Email<input type="email" name="email" placeholder="customer@email.com" /></label><label>NPWP<input name="npwp" placeholder="Nomor NPWP" /></label><label>Logo perusahaan<input type="file" name="logo" accept="image/png,image/jpeg,image/webp" /></label><label>Alamat<input name="address" placeholder="Kota / alamat singkat" /></label></div><div class="modal-actions"><button type="button" class="secondary-button" id="cancelCustomerModal">Batal</button><button class="primary-button" type="submit">Simpan customer</button></div></form></div>';
document.body.append(customerModal);
const customerStatusField = document.createElement('label');
customerStatusField.innerHTML = 'Status customer<select required name="status"><option value="Prospect">Prospect</option><option value="Active" selected>Active</option><option value="Inactive">Inactive</option><option value="Suspended">Suspended</option><option value="Archived">Archived</option></select>';
$('#customerForm .customer-form-grid').append(customerStatusField);
const closeCustomerModal = () => customerModal.classList.remove('open');
let editingCustomerId = null;
$('#addCustomerButton').addEventListener('click', () => { editingCustomerId = null; $('#customerForm').reset(); customerModal.querySelector('h2').textContent = 'Tambah customer'; customerModal.classList.add('open'); });
$('#closeCustomerModal').addEventListener('click', closeCustomerModal);
$('#cancelCustomerModal').addEventListener('click', closeCustomerModal);
customerModal.addEventListener('click', (event) => { if (event.target === customerModal) closeCustomerModal(); });
const filterCustomers = () => {
  const query = $('#customerSearch').value.toLowerCase();
  const type = $('#customerTypeFilter').value;
  let visible = 0;
  $$('#customerRows tr').forEach((row) => {
    const match = row.textContent.toLowerCase().includes(query) && (type === 'all' || row.dataset.type === type);
    row.hidden = !match;
    if (match) visible += 1;
  });
  $('#customerCount').textContent = `${visible} dari 32`;
};
$('#customerSearch').addEventListener('input', filterCustomers);
$('#customerTypeFilter').addEventListener('change', filterCustomers);
$('#customerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  let savedCustomer = null;
  if (window.crmDb?.ready) {
    const payload = {
      customer_type: null,
      name: form.get('name'),
      status: form.get('status').toLowerCase(),
      phone: form.get('phone'),
      email: form.get('email') || null,
      address: form.get('address') || null,
      npwp: form.get('npwp') || null
    };
    const result = editingCustomerId ? await window.crmDb.updateCustomer(editingCustomerId, payload) : await window.crmDb.createCustomer(payload);
    if (result.error) { window.alert(`Customer belum tersimpan: ${result.error.message}`); return; }
    savedCustomer = result.data;
    const logoFile = form.get('logo');
    if (logoFile?.size && savedCustomer?.id) {
      const logo = await window.crmDb.uploadCustomerLogo(savedCustomer.id, logoFile);
      if (logo.error) showToast(`Customer tersimpan, tetapi logo gagal: ${logo.error.message}`, true);
      else {
        const logoUpdate = await window.crmDb.updateCustomer(savedCustomer.id, { logo_url: logo.data.publicUrl });
        if (!logoUpdate.error) savedCustomer = logoUpdate.data;
      }
    }
    if (!editingCustomerId && form.get('contact')) {
      const contact = await window.crmDb.createContact({ full_name: form.get('contact'), phone: form.get('phone') || null, email: form.get('email') || null });
      if (contact.error) { window.alert(`Customer tersimpan, tetapi PIC belum tersimpan: ${contact.error.message}`); }
      else {
        const relation = await window.crmDb.createCustomerContactRelation({ customer_id: savedCustomer.id, contact_id: contact.data.id, full_name: contact.data.full_name, phone: contact.data.phone, email: contact.data.email, is_primary: true });
        if (relation.error) window.alert(`Customer tersimpan, tetapi relasi PIC belum tersimpan: ${relation.error.message}`);
      }
    }
  }
  const name = form.get('name');
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const customerId = savedCustomer?.customer_code || `CST-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const row = document.createElement('tr');
  row.dataset.type = 'all';
  row.dataset.customerId = savedCustomer?.id || customerId;
  row.dataset.logo = savedCustomer?.logo_url || '';
  row.innerHTML = `<td><div class="person"><div class="avatar avatar-purple">${initials}</div><div><b>${name}</b><small>${customerId} · ${form.get('address') || 'Belum ada alamat'}</small></div></div></td><td><span class="customer-type">Customer</span></td><td>${form.get('contact') || 'Belum ada PIC'}<br><small>${form.get('phone') || '-'}</small></td><td><b>0 unit</b></td><td>Belum dijadwalkan<br><small>Belum ada aset</small></td><td><span class="status ${form.get('status') === 'Active' ? 'status-green' : 'status-yellow'}">${form.get('status')}</span></td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td>`;
  if (editingCustomerId) {
    const currentRow = [...$$('#customerRows tr')].find((candidate) => candidate.dataset.customerId === editingCustomerId);
    if (currentRow) { currentRow.outerHTML = row.outerHTML; const updatedRow = [...$$('#customerRows tr')].find((candidate) => candidate.dataset.customerId === editingCustomerId); updatedRow?.querySelector('.more-button').addEventListener('click', () => openCustomerDetail(updatedRow)); }
  } else {
    $('#customerRows').prepend(row);
    row.querySelector('.more-button').addEventListener('click', () => openCustomerDetail(row));
  }
  event.target.reset();
  closeCustomerModal();
  showToast(editingCustomerId ? 'Customer berhasil diperbarui.' : 'Customer berhasil disimpan.');
});

const customerDetailModal = document.createElement('div');
customerDetailModal.className = 'modal-backdrop';
customerDetailModal.id = 'customerDetailModal';
customerDetailModal.innerHTML = '<div class="modal customer-detail-modal"><div class="modal-header"><div><p class="eyebrow">CUSTOMER DETAIL</p><h2 id="customerDetailName">PT Sinar Abadi</h2><p class="detail-subtitle" id="customerDetailId"></p></div><button class="icon-button" id="closeCustomerDetail"><svg><use href="#i-close"/></svg></button></div><div class="customer-profile-strip"><div class="avatar avatar-blue" id="customerDetailAvatar">SA</div><div><span class="customer-type type-company" id="customerDetailType">Perusahaan</span><p id="customerDetailContact"></p></div><span class="status status-green">Customer aktif</span></div><div class="customer-detail-stats"><div><small>Aset terdaftar</small><b id="customerAssetTotal">12 unit</b></div><div><small>Maintenance aktif</small><b id="customerMaintenanceTotal">3 jadwal</b></div><div><small>Total histori</small><b>18 record</b></div><div><small>Customer sejak</small><b>Jan 2025</b></div></div><div class="customer-detail-grid"><section><div class="detail-section-heading"><h3>Aset customer</h3><button class="text-button">Lihat semua <svg><use href="#i-arrow"/></svg></button></div><div class="customer-asset-list"><div><span class="asset-thumb">G</span><div><b>Genset RG 250 kVA</b><small>RG250-2023-014 · Plant Karawang</small></div><span class="status status-yellow">Servis</span></div><div><span class="asset-thumb thumb-purple">G</span><div><b>Genset RG 125 kVA</b><small>RG125-2024-001 · Plant Bekasi</small></div><span class="status status-green">Aktif</span></div><div><span class="asset-thumb thumb-orange">G</span><div><b>Genset RG 80 kVA</b><small>RG080-2021-021 · Workshop</small></div><span class="status status-green">Aktif</span></div></div></section><section><div class="detail-section-heading"><h3>PIC utama</h3><button class="text-button">Kelola PIC <svg><use href="#i-arrow"/></svg></button></div><div class="detail-pic"><div class="avatar avatar-green">AW</div><div><b>Andi Wijaya</b><small>Operations Manager</small><small>0812 9988 7766</small></div></div><div class="customer-address"><small>Alamat customer</small><b>Jl. Industri Raya No. 20, Jakarta</b></div></section></div><div class="customer-history"><div class="detail-section-heading"><h3>Reminder & histori terbaru</h3><span class="last-update-badge">Update 09 Sep 2026, 10.42</span></div><div class="customer-history-list"><div><span class="history-date due-today">12 SEP</span><p><b>Servis berkala · Genset RG 250 kVA</b><small>Reminder perawatan 5.000 jam</small></p><span class="status status-yellow">Terjadwal</span></div><div><span class="history-date">18 AGU</span><p><b>Preventive maintenance selesai</b><small>Oli mesin dan filter solar diganti · SPK-2026-081</small></p><span class="status status-green">Selesai</span></div></div></div><div class="detail-actions"><button class="secondary-button" id="customerDetailEdit">Edit customer</button><button class="primary-button" id="closeCustomerDetailButton">Tutup</button></div></div>';
document.body.append(customerDetailModal);
const customerContactList = customerDetailModal.querySelector('.detail-pic');
customerContactList.id = 'customerContactList';
customerContactList.className = 'customer-contact-list';
customerContactList.innerHTML = '<div class="detail-pic"><div class="avatar avatar-green">AW</div><div><b>Andi Wijaya</b><small>Operations Manager</small><small>0812 9988 7766</small></div><span class="status status-green">Utama</span></div>';
const closeCustomerDetail = () => customerDetailModal.classList.remove('open');
$('#closeCustomerDetail').addEventListener('click', closeCustomerDetail);
$('#closeCustomerDetailButton').addEventListener('click', closeCustomerDetail);
customerDetailModal.addEventListener('click', (event) => { if (event.target === customerDetailModal) closeCustomerDetail(); });
const openCustomerDetail = async (row) => {
  activeCustomerRow = row;
  const cells = row.querySelectorAll('td');
  const name = row.querySelector('.person b').textContent;
  const initials = row.querySelector('.avatar').textContent;
  $('#customerDetailName').textContent = name;
  $('#customerDetailId').textContent = row.querySelector('.person small').textContent;
  $('#customerDetailAvatar').textContent = initials;
  $('#customerDetailAvatar').style.backgroundImage = row.dataset.logo ? `url("${row.dataset.logo}")` : '';
  $('#customerDetailAvatar').style.backgroundSize = row.dataset.logo ? 'cover' : '';
  $('#customerDetailAvatar').style.color = row.dataset.logo ? 'transparent' : '';
  $('#customerDetailContact').innerHTML = `${cells[2].textContent.replace('\n', ' · ')}`;
  $('#customerDetailType').textContent = cells[1].textContent;
  $('#customerDetailType').className = `customer-type ${row.dataset.type === 'person' ? 'type-person' : 'type-company'}`;
  $('#customerAssetTotal').textContent = cells[3].textContent;
  $('#customerMaintenanceTotal').textContent = name === 'Lina Marlina' ? '1 jadwal' : '3 jadwal';
  if (window.crmDb?.ready && row.dataset.customerId) {
    const [contacts, locations] = await Promise.all([window.crmDb.getCustomerContacts(row.dataset.customerId), window.crmDb.getCustomerLocations(row.dataset.customerId)]);
    if (contacts.data?.length) {
      $('#customerContactList').innerHTML = contacts.data.map((contact) => {
        const initials = contact.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
        const person = contact.contacts || contact;
        return `<div class="detail-pic"><div class="avatar avatar-green">${initials}</div><div><b>${person.full_name}</b><small>${contact.role || person.position || 'PIC Customer'}</small><small>${person.phone || person.email || '-'}</small></div>${contact.is_primary ? '<span class="status status-green">Utama</span>' : ''}</div>`;
      }).join('');
    } else $('#customerContactList').innerHTML = '<div class="detail-pic"><div><b>Belum ada PIC</b><small>Tambahkan contact customer</small></div></div>';
    if (locations.data?.length) {
      $('#customerLocationSummary').innerHTML = `<small>Lokasi customer (${locations.data.length})</small><b>${locations.data[0].name} · ${locations.data[0].address}</b>`;
    }
  }
  customerDetailModal.classList.add('open');
};
$$('#customerRows tr').forEach((row, index) => { row.dataset.customerId = row.dataset.customerId || `demo-${index + 1}`; });
$$('#customerRows .more-button').forEach((button) => button.addEventListener('click', () => openCustomerDetail(button.closest('tr'))));
$('#customerDetailEdit').addEventListener('click', async () => {
  if (!activeCustomerRow?.dataset.customerId || activeCustomerRow.dataset.customerId.startsWith('demo-')) { window.alert('Customer demo belum dapat diedit.'); return; }
  const [customerResult, contactsResult] = await Promise.all([window.crmDb.getCustomer(activeCustomerRow.dataset.customerId), window.crmDb.getCustomerContacts(activeCustomerRow.dataset.customerId)]);
  if (customerResult.error) { window.alert(`Detail customer belum dapat dimuat: ${customerResult.error.message}`); return; }
  const customer = customerResult.data;
  const contact = contactsResult.data?.[0];
  editingCustomerId = customer.id;
  $('#customerForm input[name="name"]').value = customer.name || '';
  $('#customerForm input[name="contact"]').value = contact?.full_name || '';
  $('#customerForm input[name="phone"]').value = customer.phone || contact?.phone || '';
  $('#customerForm input[name="email"]').value = customer.email || contact?.email || '';
  $('#customerForm input[name="npwp"]').value = customer.npwp || '';
  $('#customerForm input[name="address"]').value = customer.address || '';
  $('#customerForm select[name="status"]').value = customer.status ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1) : 'Active';
  customerModal.querySelector('h2').textContent = 'Edit customer';
  closeCustomerDetail(); customerModal.classList.add('open');
});
const detailActionButtons = customerDetailModal.querySelectorAll('.detail-section-heading .text-button');
detailActionButtons[1].id = 'managePicButton';
customerDetailModal.querySelector('.customer-address').id = 'customerLocationSummary';
customerDetailModal.querySelector('.customer-address').insertAdjacentHTML('beforeend', '<button class="text-button relation-add-button" id="addLocationButton">Tambah lokasi</button>');

const relationModal = document.createElement('div');
relationModal.className = 'modal-backdrop';
relationModal.innerHTML = '<div class="modal relation-modal"><div class="modal-header"><div><p class="eyebrow" id="relationEyebrow">CUSTOMER RELATION</p><h2 id="relationTitle">Tambah PIC</h2></div><button class="icon-button" id="closeRelationModal"><svg><use href="#i-close"/></svg></button></div><form id="relationForm"><label id="relationNameLabel">Nama PIC<input required name="name" placeholder="Nama lengkap" /></label><label id="relationPositionLabel">Jabatan<input name="position" placeholder="Jabatan atau keterangan" /></label><label id="relationRoleLabel">Peran PIC<input name="role" placeholder="Contoh: Procurement, Finance, Teknisi" /></label><label>No. telepon<input name="phone" placeholder="0812 0000 0000" /></label><label>Email<input type="email" name="email" placeholder="email@customer.com" /></label><label id="relationWhatsappLabel">WhatsApp<input name="whatsapp" placeholder="Nomor WhatsApp" /></label><label id="relationIdentityLabel">Nomor identitas<input name="identityNumber" placeholder="KTP / identitas lain" /></label><label id="relationBirthDateLabel">Tanggal lahir<input type="date" name="birthDate" /></label><label id="relationContactAddressLabel">Alamat contact<input name="contactAddress" placeholder="Alamat tinggal contact" /></label><label id="relationNotesLabel">Catatan<textarea name="contactNotes" rows="2" placeholder="Catatan tambahan"></textarea></label><label id="relationAddressLabel" hidden>Alamat lokasi<input name="address" placeholder="Alamat lengkap lokasi" /></label><div class="modal-actions"><button type="button" class="secondary-button" id="cancelRelationModal">Batal</button><button class="primary-button" type="submit">Simpan</button></div></form></div>';
document.body.append(relationModal);
let relationMode = 'pic';
let relationCustomerId = null;
const closeRelationModal = () => relationModal.classList.remove('open');
const openRelationModal = (mode) => {
  relationMode = mode;
  relationCustomerId = activeCustomerRow?.dataset.customerId;
  $('#relationTitle').textContent = mode === 'pic' ? 'Tambah PIC' : 'Tambah lokasi';
  $('#relationEyebrow').textContent = mode === 'pic' ? 'CUSTOMER PIC' : 'CUSTOMER LOCATION';
  $('#relationPositionLabel').hidden = mode !== 'pic';
  $('#relationRoleLabel').hidden = mode !== 'pic';
  ['relationWhatsappLabel', 'relationIdentityLabel', 'relationBirthDateLabel', 'relationContactAddressLabel', 'relationNotesLabel'].forEach((id) => { $(`#${id}`).hidden = mode !== 'pic'; });
  $('#relationAddressLabel').hidden = mode === 'pic';
  $('#relationNameLabel').firstChild.textContent = mode === 'pic' ? 'Nama PIC' : 'Nama lokasi';
  relationModal.classList.add('open');
};
let activeCustomerRow = null;
$('#managePicButton').addEventListener('click', () => openRelationModal('pic'));
$('#addLocationButton').addEventListener('click', () => openRelationModal('location'));
$('#closeRelationModal').addEventListener('click', closeRelationModal);
$('#cancelRelationModal').addEventListener('click', closeRelationModal);
relationModal.addEventListener('click', (event) => { if (event.target === relationModal) closeRelationModal(); });
const originalOpenCustomerDetail = openCustomerDetail;
// Track the selected customer for PIC and location actions.
$$('#customerRows .more-button').forEach((button) => button.addEventListener('click', () => { activeCustomerRow = button.closest('tr'); }));
$('#relationForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!relationCustomerId || relationCustomerId.startsWith('demo-')) { window.alert('Data demo belum memiliki ID database. Pilih customer yang sudah tersimpan di Supabase.'); return; }
  const form = new FormData(event.target);
  let result;
  if (relationMode === 'pic') {
    const contact = await window.crmDb.createContact({ full_name: form.get('name'), position: form.get('position') || null, phone: form.get('phone') || null, email: form.get('email') || null, whatsapp: form.get('whatsapp') || null, identity_number: form.get('identityNumber') || null, birth_date: form.get('birthDate') || null, address: form.get('contactAddress') || null, notes: form.get('contactNotes') || null });
    result = contact.error ? contact : await window.crmDb.createCustomerContactRelation({ customer_id: relationCustomerId, contact_id: contact.data.id, full_name: form.get('name'), position: form.get('position') || null, phone: form.get('phone') || null, email: form.get('email') || null, role: form.get('role') || null });
  } else result = await window.crmDb.createCustomerLocation({ customer_id: relationCustomerId, name: form.get('name'), address: form.get('address'), contact_phone: form.get('phone') || null });
  if (result.error) {
    const migrationMissing = result.error.message.includes('contacts') || result.error.message.includes('contact_id');
    window.alert(migrationMissing ? 'Database contact belum siap. Jalankan migration 003_contacts_relations.sql di Supabase, lalu ulangi simpan PIC.' : `Data belum tersimpan: ${result.error.message}`);
    return;
  }
  event.target.reset();
  closeRelationModal();
  if (activeCustomerRow) await originalOpenCustomerDetail(activeCustomerRow);
});

const authGate = document.createElement('div');
authGate.className = 'auth-gate';
authGate.innerHTML = '<div class="auth-card"><div class="brand auth-brand"><span class="brand-mark">r</span><span>ruang<span class="brand-accent">crm</span></span></div><p class="eyebrow">WORKSPACE SECURE</p><h1>Masuk ke RuangCRM</h1><p class="auth-copy">Gunakan akun internal untuk mengakses data customer, aset, dan histori maintenance.</p><form id="authForm"><label>Email kerja<input required type="email" name="email" placeholder="nama@perusahaan.com" /></label><label>Password<input required type="password" name="password" minlength="6" placeholder="Minimal 6 karakter" /></label><button class="primary-button auth-submit" type="submit">Masuk</button><button class="secondary-button auth-signup" type="button" id="authSignup">Buat akun baru</button><p class="auth-message" id="authMessage"></p></form></div>';
document.body.append(authGate);
const setAuthMessage = (message, error = false) => { $('#authMessage').textContent = message; $('#authMessage').className = `auth-message${error ? ' error' : ''}`; };
const hideAuthGate = () => authGate.classList.add('hidden');
const showAuthGate = () => authGate.classList.remove('hidden');
const setupAuth = async () => {
  if (!window.crmDb?.ready) { hideAuthGate(); return; }
  const { data } = await window.supabaseClient.auth.getSession();
  if (data.session) { hideAuthGate(); await loadDatabaseData(); return; }
  showAuthGate();
  window.supabaseClient.auth.onAuthStateChange(async (_event, session) => { if (session) { hideAuthGate(); await loadDatabaseData(); } else showAuthGate(); });
};
$('#authForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const button = event.target.querySelector('.auth-submit');
  button.disabled = true;
  setAuthMessage('Memproses login...');
  const { error } = await window.supabaseClient.auth.signInWithPassword({ email: form.get('email'), password: form.get('password') });
  button.disabled = false;
  if (error) setAuthMessage(error.message, true);
});
$('#authSignup').addEventListener('click', async () => {
  const form = new FormData($('#authForm'));
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  const button = $('#authSignup');
  if (!email || !password) { setAuthMessage('Isi email dan password terlebih dahulu.', true); return; }
  if (password.length < 6) { setAuthMessage('Password minimal 6 karakter.', true); return; }
  button.disabled = true;
  setAuthMessage('Membuat akun...');
  const emailRedirectTo = `${window.location.origin}${window.location.pathname}`;
  const { data, error } = await window.supabaseClient.auth.signUp({ email, password, options: { emailRedirectTo } });
  button.disabled = false;
  if (error) {
    const message = error.message.toLowerCase().includes('already registered') ? 'Email ini sudah terdaftar. Gunakan tombol Masuk.' : error.message;
    setAuthMessage(message, true);
    return;
  }
  if (data.session) { hideAuthGate(); await loadDatabaseData(); return; }
  setAuthMessage('Akun berhasil dibuat. Buka email konfirmasi dari Supabase, lalu masuk kembali. Periksa folder Spam bila belum terlihat.');
});
const renderDbCustomerRows = (customers) => customers.map((customer) => {
  const initials = customer.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const typeLabel = customer.customer_type === 'company' ? 'Perusahaan' : customer.customer_type === 'person' ? 'Perorangan' : 'Customer';
  const statusLabel = customer.status.charAt(0).toUpperCase() + customer.status.slice(1);
  const statusClass = customer.status === 'active' ? 'status-green' : 'status-yellow';
  return `<tr data-type="${customer.customer_type || 'all'}" data-customer-id="${customer.id}" data-logo="${customer.logo_url || ''}"><td><div class="person"><div class="avatar avatar-blue"${customer.logo_url ? ` style="background-image:url('${customer.logo_url}');background-size:cover;color:transparent"` : ''}>${initials}</div><div><b>${customer.name}</b><small>${customer.customer_code}</small></div></div></td><td><span class="customer-type ${customer.customer_type === 'company' ? 'type-company' : customer.customer_type === 'person' ? 'type-person' : ''}">${typeLabel}</span></td><td>Belum diisi<br><small>Tambahkan PIC</small></td><td><b>${customer.asset_count || 0} unit</b></td><td>${customer.next_maintenance_date || 'Belum dijadwalkan'}</td><td><span class="status ${statusClass}">${statusLabel}</span></td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td></tr>`;
}).join('');
const renderDbAssetRows = (assets) => assets.map((asset) => `<tr data-status="${asset.status}" data-asset-id="${asset.asset_code}" data-asset-db-id="${asset.id}" data-customer="${asset.customers?.name || ''}" data-capacity="${asset.capacity_kva || 'Belum dicatat'} kVA" data-last-updated="${new Date(asset.updated_at).toLocaleString('id-ID')}"><td><div class="asset-name"><span class="asset-thumb">G</span><div><b>${asset.name}</b><small><span class="asset-id">${asset.asset_code}</span> · ${asset.generator_serial}</small></div></div></td><td>Genset Diesel</td><td><span class="config-cell">${asset.generator_type}<br><small>${asset.operation_system}</small><br><small class="mode-label">${asset.operation_mode}</small></span></td><td>${asset.generator_serial}</td><td>${asset.customer_locations?.name || asset.customers?.name || 'Belum diisi'}</td><td><span class="status ${asset.status === 'active' ? 'status-green' : 'status-gray'}">${asset.status === 'active' ? 'Aktif' : 'Tidak aktif'}</span></td><td>Belum dicatat</td><td>Belum dijadwalkan</td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td></tr>`).join('');
const renderDbMaintenanceRows = (schedules) => schedules.map((schedule) => {
  const dueDate = schedule.next_due_date ? new Date(`${schedule.next_due_date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Belum dijadwalkan';
  const type = schedule.maintenance_type.charAt(0).toUpperCase() + schedule.maintenance_type.slice(1);
  return `<tr data-maintenance-status="planned"><td><div class="schedule-name"><span class="schedule-icon schedule-blue">◷</span><div><b>${schedule.title}</b><small>${schedule.id.slice(0, 8).toUpperCase()}</small></div></div></td><td>${schedule.assets?.name || '-'}<br><small>${schedule.assets?.generator_serial || schedule.assets?.asset_code || '-'}</small></td><td>${schedule.assets?.customers?.name || '-'}</td><td>${type}</td><td>${dueDate}</td><td>Belum ditugaskan</td><td><span class="status status-blue">Terjadwal</span></td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td></tr>`;
}).join('');
const renderDbWorkOrderRows = (orders) => orders.map((order) => `<tr data-workorder-status="${order.status}" data-workorder-id="${order.id}" data-asset-db-id="${order.assets?.id || ''}"><td><span class="workorder-code">${order.work_order_code}</span></td><td><b>${order.customers?.name || '-'}</b><small>${order.assets?.name || 'Belum ada aset'}</small></td><td>${order.title}</td><td>${order.employees?.full_name || 'Belum ditugaskan'}</td><td>${order.scheduled_at ? new Date(order.scheduled_at).toLocaleDateString('id-ID') : 'Belum dijadwalkan'}</td><td><span class="status status-blue">${order.status.replaceAll('_', ' ')}</span></td><td>${new Date(order.updated_at).toLocaleDateString('id-ID')}</td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td></tr>`).join('');
const renderDbPartRows = (parts) => parts.map((part) => `<tr data-spare-part-id="${part.spare_part_id}" data-stock="${part.stock_on_hand <= part.minimum_stock ? 'low' : 'safe'}"><td><span class="part-code">${part.part_code}</span></td><td><b>${part.name}</b><small>${part.unit}</small></td><td>Spare part</td><td>Terdaftar di database</td><td><strong class="${part.stock_on_hand <= part.minimum_stock ? 'warning-text' : ''}">${part.stock_on_hand} ${part.unit}</strong></td><td>${part.minimum_stock} ${part.unit}</td><td>Belum diatur</td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td></tr>`).join('');
const renderDbEmployeeRows = (employees) => employees.map((employee) => {
  const initials = employee.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const department = employee.department.toLowerCase().includes('service') ? 'service' : employee.department.toLowerCase().includes('sales') ? 'sales' : 'admin';
  const accessClass = { administrator: 'access-admin', editor: 'access-editor', operator: 'access-operator', viewer: 'access-viewer' }[employee.access_level] || 'access-viewer';
  return `<tr data-department="${department}" data-employee-id="${employee.id}"><td><div class="person"><div class="avatar avatar-blue">${initials}</div><div><b>${employee.full_name}</b><small>${employee.email}</small></div></div></td><td>${employee.position}</td><td>${employee.department}</td><td><span class="access ${accessClass}">${employee.access_level}</span></td><td><span class="status ${employee.is_active ? 'status-green' : 'status-gray'}">${employee.is_active ? 'Aktif' : 'Tidak aktif'}</span></td><td>${employee.last_login_at ? new Date(employee.last_login_at).toLocaleString('id-ID') : 'Belum pernah login'}</td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td></tr>`;
}).join('');
let quotationCache = [];
const formatRupiah = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
const showDatabaseWarning = (errors) => {
  if (!errors.length || $('#databaseWarning')) return;
  const warning = document.createElement('div');
  warning.id = 'databaseWarning';
  warning.className = 'database-warning';
  warning.textContent = 'Sebagian data database belum dapat dimuat. Data yang tersimpan tidak dihapus.';
  document.body.append(warning);
};
const renderQuotations = (quotations) => quotations.slice(0, 5).map((quote) => `<div><span class="quotation-code">${quote.quotation_code}</span><div><b>${quote.customers?.name || 'Customer'}</b><small>${quote.quotation_items?.map((item) => `${item.description} x ${item.quantity}`).join(' · ') || 'Belum ada item'}</small></div><strong>${formatRupiah(quote.total)}</strong><span class="status status-${quote.status === 'approved' ? 'green' : quote.status === 'sent' ? 'yellow' : 'gray'}">${quote.status}</span><button class="more-button print-quotation" data-quotation-id="${quote.id}" title="Cetak"><svg><use href="#i-more"/></svg></button></div>`).join('');
const printQuotation = (quote) => {
  const items = quote.quotation_items || [];
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  printWindow.document.write(`<title>${quote.quotation_code}</title><style>body{font:14px Arial;color:#182235;max-width:800px;margin:40px auto}h1{margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:28px}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}td:last-child,th:last-child{text-align:right}.total{text-align:right;font-size:18px;font-weight:bold;margin-top:20px}</style><h1>Penawaran ${quote.quotation_code}</h1><p>Customer: <b>${quote.customers?.name || '-'}</b><br>Berlaku sampai: ${quote.valid_until || '-'}</p><table><thead><tr><th>Deskripsi</th><th>Jumlah</th><th>Harga</th><th>Total</th></tr></thead><tbody>${items.map((item) => `<tr><td>${item.description}</td><td>${item.quantity} ${item.unit}</td><td>${formatRupiah(item.unit_price)}</td><td>${formatRupiah(item.line_total)}</td></tr>`).join('')}</tbody></table><p class="total">Total: ${formatRupiah(quote.total)}</p>`);
  printWindow.document.close(); printWindow.focus(); printWindow.print();
};
async function loadDatabaseData() {
  const [customerResult, assetResult, scheduleResult, workOrderResult, partsResult, employeeResult, quotationResult] = await Promise.all([window.crmDb.getCustomers(), window.crmDb.getAssets(), window.crmDb.getMaintenanceSchedules(), window.crmDb.getWorkOrders(), window.crmDb.getSpareParts(), window.crmDb.getEmployees(), window.crmDb.getQuotations()]);
  if (!customerResult.error && customerResult.data?.length) {
    $('#customerRows').innerHTML = renderDbCustomerRows(customerResult.data);
    $$('#customerRows .more-button').forEach((button) => button.addEventListener('click', () => openCustomerDetail(button.closest('tr'))));
  }
  if (!assetResult.error && assetResult.data?.length) {
    $('#assetRows').innerHTML = renderDbAssetRows(assetResult.data);
    $$('#assetRows .more-button').forEach((button) => button.addEventListener('click', () => openAssetDetail(button.closest('tr'))));
  }
  if (!scheduleResult.error && scheduleResult.data?.length) {
    $('#maintenanceRows').innerHTML = renderDbMaintenanceRows(scheduleResult.data);
    $('#maintenanceCount').textContent = `${scheduleResult.data.length} dari ${scheduleResult.data.length}`;
  }
  if (!workOrderResult.error && workOrderResult.data?.length) {
    $('#workOrderRows').innerHTML = renderDbWorkOrderRows(workOrderResult.data);
    $('#workOrderCount').textContent = `${workOrderResult.data.length} dari ${workOrderResult.data.length}`;
    $$('#workOrderRows .more-button').forEach((button) => button.addEventListener('click', () => openWorkOrderReport(button.closest('tr'))));
  }
  if (!partsResult.error && partsResult.data?.length) {
    $('#partRows').innerHTML = renderDbPartRows(partsResult.data);
    $('#partCount').textContent = `${partsResult.data.length} dari ${partsResult.data.length}`;
  }
  if (!employeeResult.error && employeeResult.data?.length) {
    $('#employeeRows').innerHTML = renderDbEmployeeRows(employeeResult.data);
    $('#employeeCount').textContent = `${employeeResult.data.length} dari ${employeeResult.data.length}`;
  }
  if (!quotationResult.error && quotationResult.data?.length) {
    quotationCache = quotationResult.data;
    $('#quotationList').innerHTML = renderQuotations(quotationCache);
  }
  const databaseErrors = [customerResult, assetResult, scheduleResult, workOrderResult, partsResult, employeeResult, quotationResult].filter((result) => result.error);
  showDatabaseWarning(databaseErrors);
  if (!customerResult.error && customerResult.data) {
    const activeCustomers = customerResult.data.filter((customer) => customer.status === 'active').length;
    const customerMetric = document.querySelector('.metric-grid .metric-card:nth-child(2) h2');
    if (customerMetric) customerMetric.textContent = activeCustomers.toLocaleString('id-ID');
  }
  if (!assetResult.error && assetResult.data) {
    const activeAssets = assetResult.data.filter((asset) => asset.status === 'active').length;
    const assetMetric = document.querySelector('.metric-grid .metric-card:nth-child(3) h2');
    if (assetMetric) assetMetric.innerHTML = `${activeAssets} <small class="unit-total">/ ${assetResult.data.length} unit</small>`;
  }
}
setupAuth();

const maintenanceModal = document.createElement('div');
maintenanceModal.className = 'modal-backdrop';
maintenanceModal.innerHTML = '<div class="modal maintenance-modal"><div class="modal-header"><div><p class="eyebrow">MAINTENANCE PLAN</p><h2>Jadwalkan maintenance</h2></div><button class="icon-button" id="closeMaintenanceModal"><svg><use href="#i-close"/></svg></button></div><form id="maintenanceForm"><label>Aset genset<select required name="asset" id="maintenanceAssetSelect"></select></label><label>Judul pekerjaan<input required name="title" placeholder="Contoh: Servis berkala 1.000 jam" /></label><div class="maintenance-form-grid"><label>Jenis maintenance<select required name="type"><option value="preventive">Preventive</option><option value="corrective">Corrective</option><option value="inspection">Inspection</option></select></label><label>Jatuh tempo<input required type="date" name="dueDate" /></label><label>Jam operasi<input type="number" name="dueHours" min="0" placeholder="Contoh: 1000" /></label><label>Reminder sebelum (hari)<input required type="number" name="reminderDays" min="0" value="14" /></label></div><div class="modal-actions"><button type="button" class="secondary-button" id="cancelMaintenanceModal">Batal</button><button class="primary-button" type="submit">Simpan jadwal</button></div></form></div>';
document.body.append(maintenanceModal);
const closeMaintenanceModal = () => maintenanceModal.classList.remove('open');
const refreshMaintenanceAssetOptions = () => {
  const options = $$('#assetRows tr').map((row) => `<option value="${row.dataset.assetId}" data-db-id="${row.dataset.assetDbId || ''}">${row.querySelector('.asset-name b')?.textContent || 'Aset'} · ${row.dataset.customer || 'Customer'}</option>`);
  $('#maintenanceAssetSelect').innerHTML = options.length ? options.join('') : '<option value="">Belum ada aset</option>';
};
$('#addMaintenanceButton').addEventListener('click', () => { refreshMaintenanceAssetOptions(); maintenanceModal.classList.add('open'); });
$('#closeMaintenanceModal').addEventListener('click', closeMaintenanceModal);
$('#cancelMaintenanceModal').addEventListener('click', closeMaintenanceModal);
maintenanceModal.addEventListener('click', (event) => { if (event.target === maintenanceModal) closeMaintenanceModal(); });
$('#maintenanceStatusFilter').addEventListener('change', (event) => {
  const value = event.target.value;
  let visible = 0;
  $$('#maintenanceRows tr').forEach((row) => { const match = value === 'all' || row.dataset.maintenanceStatus === value; row.hidden = !match; if (match) visible += 1; });
  $('#maintenanceCount').textContent = `${visible} dari 18`;
});
$('#maintenanceForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const select = $('#maintenanceAssetSelect');
  const selected = select.options[select.selectedIndex];
  const assetDbId = selected?.dataset.dbId;
  if (window.crmDb?.ready && !assetDbId) { window.alert('Aset demo belum memiliki ID database. Tambahkan aset melalui database terlebih dahulu.'); return; }
  if (window.crmDb?.ready) {
    const result = await window.crmDb.createMaintenanceSchedule({ asset_id: assetDbId, maintenance_type: form.get('type'), title: form.get('title'), next_due_date: form.get('dueDate'), next_due_hours: form.get('dueHours') ? Number(form.get('dueHours')) : null, reminder_days_before: Number(form.get('reminderDays')), is_active: true });
    if (result.error) { window.alert(`Jadwal belum tersimpan: ${result.error.message}`); return; }
  }
  const row = document.createElement('tr');
  row.dataset.maintenanceStatus = 'planned';
  row.innerHTML = `<td><div class="schedule-name"><span class="schedule-icon schedule-blue">◷</span><div><b>${form.get('title')}</b><small>MS-NEW-${Date.now().toString().slice(-4)}</small></div></div></td><td>${selected.textContent.split(' · ')[0]}<br><small>${select.value}</small></td><td>${selected.textContent.split(' · ')[1] || 'Customer'}</td><td>${form.get('type')}</td><td>${new Date(`${form.get('dueDate')}T00:00:00`).toLocaleDateString('id-ID')}</td><td>Belum ditugaskan</td><td><span class="status status-blue">Terjadwal</span></td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td>`;
  $('#maintenanceRows').prepend(row);
  $('#maintenanceCount').textContent = `${$('#maintenanceRows tr').length} dari 18`;
  event.target.reset();
  closeMaintenanceModal();
});

const workOrderModal = document.createElement('div');
workOrderModal.className = 'modal-backdrop';
workOrderModal.innerHTML = '<div class="modal workorder-modal"><div class="modal-header"><div><p class="eyebrow">SERVICE ORDER</p><h2>Buat SPK baru</h2></div><button class="icon-button" id="closeWorkOrderModal"><svg><use href="#i-close"/></svg></button></div><form id="workOrderForm"><label>Customer<select required name="customer" id="workOrderCustomerSelect"></select></label><label>Aset genset<select name="asset" id="workOrderAssetSelect"></select></label><label>Judul pekerjaan<input required name="title" placeholder="Contoh: Servis berkala genset" /></label><label>Deskripsi pekerjaan<textarea name="description" rows="3" placeholder="Keluhan, scope pekerjaan, atau catatan teknisi"></textarea></label><div class="workorder-form-grid"><label>Jadwal pekerjaan<input required type="datetime-local" name="scheduledAt" /></label><label>Prioritas<select name="priority"><option>Normal</option><option>Urgent</option><option>Critical</option></select></label></div><div class="modal-actions"><button type="button" class="secondary-button" id="cancelWorkOrderModal">Batal</button><button class="primary-button" type="submit">Simpan SPK</button></div></form></div>';
document.body.append(workOrderModal);
const technicianField = document.createElement('label');
technicianField.innerHTML = 'Teknisi penanggung jawab<select name="technician" id="workOrderTechnicianSelect"><option value="">Belum ditugaskan</option></select>';
$('#workOrderForm label:first-child').after(technicianField);
const closeWorkOrderModal = () => workOrderModal.classList.remove('open');
const refreshWorkOrderOptions = () => {
  $('#workOrderCustomerSelect').innerHTML = $$('#customerRows tr').map((row) => `<option value="${row.dataset.customerId}">${row.querySelector('.person b')?.textContent || 'Customer'}</option>`).join('');
  $('#workOrderAssetSelect').innerHTML = '<option value="">Tanpa aset spesifik</option>' + $$('#assetRows tr').map((row) => `<option value="${row.dataset.assetDbId || ''}" data-code="${row.dataset.assetId}">${row.querySelector('.asset-name b')?.textContent || 'Aset'}</option>`).join('');
  $('#workOrderTechnicianSelect').innerHTML = '<option value="">Belum ditugaskan</option>' + $$('#employeeRows tr').map((row) => `<option value="${row.dataset.employeeId || ''}">${row.querySelector('.person b')?.textContent || 'Teknisi'}</option>`).filter((option) => !option.includes('value=""')).join('');
};
$('#addWorkOrderButton').addEventListener('click', () => { refreshWorkOrderOptions(); workOrderModal.classList.add('open'); });
$('#closeWorkOrderModal').addEventListener('click', closeWorkOrderModal);
$('#cancelWorkOrderModal').addEventListener('click', closeWorkOrderModal);
workOrderModal.addEventListener('click', (event) => { if (event.target === workOrderModal) closeWorkOrderModal(); });
const filterWorkOrders = () => {
  const query = $('#workOrderSearch').value.toLowerCase();
  const status = $('#workOrderStatusFilter').value;
  let visible = 0;
  $$('#workOrderRows tr').forEach((row) => { const match = row.textContent.toLowerCase().includes(query) && (status === 'all' || row.dataset.workorderStatus === status); row.hidden = !match; if (match) visible += 1; });
  $('#workOrderCount').textContent = `${visible} dari 14`;
};
$('#workOrderSearch').addEventListener('input', filterWorkOrders);
$('#workOrderStatusFilter').addEventListener('change', filterWorkOrders);
$('#workOrderForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const customerId = form.get('customer');
  const assetId = form.get('asset') || null;
  if (window.crmDb?.ready && (!customerId || customerId.startsWith('demo-'))) { window.alert('Customer belum memiliki ID database. Simpan customer terlebih dahulu.'); return; }
  if (window.crmDb?.ready && assetId && !assetId.match(/^[0-9a-f-]{36}$/i)) { window.alert('Aset yang dipilih belum memiliki ID database.'); return; }
  if (window.crmDb?.ready) {
    const result = await window.crmDb.createWorkOrder({ customer_id: customerId, asset_id: assetId || null, assigned_to: form.get('technician') || null, title: form.get('title'), description: form.get('description') || null, status: 'open', scheduled_at: form.get('scheduledAt') ? new Date(form.get('scheduledAt')).toISOString() : null });
    if (result.error) { window.alert(`SPK belum tersimpan: ${result.error.message}`); return; }
  }
  const customerName = $('#workOrderCustomerSelect').options[$('#workOrderCustomerSelect').selectedIndex]?.textContent || 'Customer';
  const assetName = $('#workOrderAssetSelect').options[$('#workOrderAssetSelect').selectedIndex]?.textContent || 'Tanpa aset spesifik';
  const row = document.createElement('tr');
  row.dataset.workorderStatus = 'open';
  row.innerHTML = `<td><span class="workorder-code">SPK-NEW-${Date.now().toString().slice(-4)}</span></td><td><b>${customerName}</b><small>${assetName}</small></td><td>${form.get('title')}</td><td>Belum ditugaskan</td><td>${new Date(form.get('scheduledAt')).toLocaleDateString('id-ID')}</td><td><span class="status status-blue">Open</span></td><td>Baru saja</td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td>`;
  $('#workOrderRows').prepend(row);
  row.dataset.workorderId = `demo-${Date.now()}`;
  row.querySelector('.more-button').addEventListener('click', () => openWorkOrderReport(row));
  $('#workOrderCount').textContent = `${$('#workOrderRows tr').length} dari 14`;
  event.target.reset();
  closeWorkOrderModal();
});

const reportModal = document.createElement('div');
reportModal.className = 'modal-backdrop';
reportModal.innerHTML = '<div class="modal report-modal"><div class="modal-header"><div><p class="eyebrow">TECHNICIAN REPORT</p><h2 id="reportTitle">Laporan pekerjaan</h2><p class="detail-subtitle" id="reportSubtitle"></p></div><button class="icon-button" id="closeReportModal"><svg><use href="#i-close"/></svg></button></div><form id="reportForm"><p class="report-label">Checklist pekerjaan</p><div class="checklist-grid"><label><input type="checkbox" name="checklist" value="visual" /> Pemeriksaan visual</label><label><input type="checkbox" name="checklist" value="oil" /> Oli mesin</label><label><input type="checkbox" name="checklist" value="filter" /> Filter dan fuel system</label><label><input type="checkbox" name="checklist" value="cooling" /> Sistem pendingin</label><label><input type="checkbox" name="checklist" value="battery" /> Battery dan panel</label><label><input type="checkbox" name="checklist" value="testing" /> Uji beban / testing</label></div><label>Ringkasan pekerjaan<textarea required name="summary" rows="3" placeholder="Jelaskan pekerjaan yang dilakukan"></textarea></label><label>Temuan teknisi<textarea name="findings" rows="2" placeholder="Temuan atau rekomendasi"></textarea></label><div class="report-form-grid"><label>Jam operasi saat servis<input required type="number" name="operatingHours" min="0" placeholder="Contoh: 5000" /></label><label>Status laporan<select name="status"><option value="completed">Selesai</option><option value="in_progress">Masih dikerjakan</option></select></label></div><label class="approval-check"><input type="checkbox" name="customerApproved" /> Customer menyetujui hasil pekerjaan</label><div class="modal-actions"><button type="button" class="secondary-button" id="cancelReportModal">Batal</button><button class="primary-button" type="submit">Simpan laporan</button></div></form></div>';
document.body.append(reportModal);
const reportPartField = document.createElement('div');
reportPartField.className = 'report-part-field';
  reportPartField.innerHTML = '<label>Spare part yang digunakan<select name="sparePart" id="reportSparePart"><option value="">Tidak ada spare part</option></select></label><label>Jumlah<input type="number" name="sparePartQuantity" min="1" value="1" /></label><label>Gudang<select name="warehouse" id="reportWarehouse"><option value="">Pilih gudang</option></select></label>';
$('#reportForm .report-form-grid').after(reportPartField);
const closeReportModal = () => reportModal.classList.remove('open');
let activeWorkOrderRow = null;
const openWorkOrderReport = async (row) => {
  activeWorkOrderRow = row;
  const partOptions = $$('#partRows tr').map((partRow) => `<option value="${partRow.dataset.sparePartId || ''}">${partRow.querySelector('.part-code')?.textContent || 'Spare part'}</option>`).filter((option) => !option.includes('value=""')).join('');
  $('#reportSparePart').innerHTML = '<option value="">Tidak ada spare part</option>' + partOptions;
  if (window.crmDb?.ready) {
    const warehouses = await window.crmDb.getWarehouses();
    $('#reportWarehouse').innerHTML = warehouses.data?.map((warehouse) => `<option value="${warehouse.id}">${warehouse.name}</option>`).join('') || '<option value="">Migration gudang belum dijalankan</option>';
  }
  $('#reportTitle').textContent = `Laporan ${row.querySelector('.workorder-code')?.textContent || 'SPK'}`;
  $('#reportSubtitle').textContent = row.cells[1]?.textContent.replace('\n', ' · ') || '';
  reportModal.classList.add('open');
};
$('#closeReportModal').addEventListener('click', closeReportModal);
$('#cancelReportModal').addEventListener('click', closeReportModal);
reportModal.addEventListener('click', (event) => { if (event.target === reportModal) closeReportModal(); });
$$('#workOrderRows tr').forEach((row, index) => { row.dataset.workorderId = row.dataset.workorderId || `demo-${index + 1}`; });
$('#workOrderRows').addEventListener('click', (event) => { const button = event.target.closest('.more-button'); const row = button?.closest('tr'); if (row) openWorkOrderReport(row); });
$('#reportForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const workOrderId = activeWorkOrderRow?.dataset.workorderId;
  const assetId = activeWorkOrderRow?.dataset.assetDbId;
  const checklist = form.getAll('checklist');
  if (window.crmDb?.ready && form.get('sparePart') && !form.get('warehouse')) { window.alert('Pilih gudang untuk mencatat pengeluaran spare part.'); return; }
  if (window.crmDb?.ready && (workOrderId?.startsWith('demo-') || !assetId)) { window.alert('SPK demo belum memiliki relasi database. Buat SPK dari customer dan aset yang tersimpan di database.'); return; }
  if (window.crmDb?.ready) {
    const report = await window.crmDb.createMaintenanceRecord({ work_order_id: workOrderId, asset_id: assetId, maintenance_type: 'preventive', status: form.get('status'), performed_at: new Date().toISOString(), operating_hours: Number(form.get('operatingHours')), findings: form.get('findings') || null, work_summary: `${form.get('summary')}\nChecklist: ${checklist.join(', ') || 'Tidak ada'}` });
    if (report.error) { window.alert(`Laporan belum tersimpan: ${report.error.message}`); return; }
    if (form.get('sparePart')) {
      const partResult = await window.crmDb.createMaintenancePart({ maintenance_record_id: report.data.id, spare_part_id: form.get('sparePart'), warehouse_id: form.get('warehouse') || null, quantity: Number(form.get('sparePartQuantity')) || 1, unit_cost: 0 });
      if (partResult.error) { window.alert(`Laporan tersimpan, tetapi spare part belum tercatat: ${partResult.error.message}`); return; }
    }
    const updated = await window.crmDb.updateWorkOrder(workOrderId, { status: form.get('status') === 'completed' ? 'completed' : 'in_progress', completed_at: form.get('status') === 'completed' ? new Date().toISOString() : null, customer_approved_at: form.get('customerApproved') ? new Date().toISOString() : null });
    if (updated.error) { window.alert(`Laporan tersimpan, tetapi status SPK belum diperbarui: ${updated.error.message}`); return; }
  }
  activeWorkOrderRow.dataset.workorderStatus = form.get('status');
  activeWorkOrderRow.querySelector('.status').textContent = form.get('status') === 'completed' ? 'Completed' : 'In progress';
  activeWorkOrderRow.querySelector('.status').className = `status ${form.get('status') === 'completed' ? 'status-green' : 'status-purple'}`;
  activeWorkOrderRow.cells[6].textContent = 'Baru saja';
  event.target.reset();
  closeReportModal();
});

const partModal = document.createElement('div');
partModal.className = 'modal-backdrop';
partModal.innerHTML = '<div class="modal inventory-modal"><div class="modal-header"><div><p class="eyebrow">MASTER SPARE PART</p><h2>Tambah spare part</h2></div><button class="icon-button" id="closePartModal"><svg><use href="#i-close"/></svg></button></div><form id="partForm"><div class="part-form-grid"><label>Part number<input required name="partCode" placeholder="Contoh: FLT-OLI-125" /></label><label>Nama part<input required name="name" placeholder="Nama spare part" /></label><label>Brand<input name="brand" placeholder="Contoh: Fleetguard" /></label><label>Kategori<input name="category" placeholder="Filter / Electrical" /></label><label>Unit<select name="unit"><option>pcs</option><option>liter</option><option>set</option><option>unit</option></select></label><label>Minimum stok<input required type="number" min="0" name="minimumStock" value="0" /></label><label class="part-full">Spesifikasi<input name="specification" placeholder="Detail ukuran atau spesifikasi teknis" /></label><label class="part-full">Compatible model<input name="compatibleModels" placeholder="Contoh: RG 125 / 150 kVA" /></label></div><div class="modal-actions"><button type="button" class="secondary-button" id="cancelPartModal">Batal</button><button class="primary-button" type="submit">Simpan spare part</button></div></form></div>';
document.body.append(partModal);
const closePartModal = () => partModal.classList.remove('open');
$('#addPartButton').addEventListener('click', () => partModal.classList.add('open'));
$('#closePartModal').addEventListener('click', closePartModal);
$('#cancelPartModal').addEventListener('click', closePartModal);
partModal.addEventListener('click', (event) => { if (event.target === partModal) closePartModal(); });
const filterParts = () => {
  const query = $('#partSearch').value.toLowerCase();
  const stock = $('#partStockFilter').value;
  let visible = 0;
  $$('#partRows tr').forEach((row) => { const match = row.textContent.toLowerCase().includes(query) && (stock === 'all' || row.dataset.stock === stock); row.hidden = !match; if (match) visible += 1; });
  $('#partCount').textContent = `${visible} dari 248`;
};
$('#partSearch').addEventListener('input', filterParts);
$('#partStockFilter').addEventListener('change', filterParts);
$('#partForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  if (window.crmDb?.ready) {
    const result = await window.crmDb.createSparePart({ part_code: form.get('partCode'), name: form.get('name'), brand: form.get('brand') || null, category: form.get('category') || null, unit: form.get('unit'), minimum_stock: Number(form.get('minimumStock')), specification: form.get('specification') || null, compatible_models: form.get('compatibleModels') || null });
    if (result.error) { window.alert(`Spare part belum tersimpan: ${result.error.message}`); return; }
  }
  const row = document.createElement('tr');
  row.dataset.stock = 'safe';
  row.innerHTML = `<td><span class="part-code">${form.get('partCode')}</span></td><td><b>${form.get('name')}</b><small>${form.get('unit')}</small></td><td>${form.get('category') || '-'}</td><td>${form.get('compatibleModels') || '-'}</td><td><strong>0 ${form.get('unit')}</strong></td><td>${form.get('minimumStock')} ${form.get('unit')}</td><td>Belum diatur</td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td>`;
  $('#partRows').prepend(row);
  $('#partCount').textContent = `${$('#partRows tr').length} dari 248`;
  event.target.reset();
  closePartModal();
});

const quotationModal = document.createElement('div');
quotationModal.className = 'modal-backdrop';
quotationModal.innerHTML = '<div class="modal inventory-modal"><div class="modal-header"><div><p class="eyebrow">QUOTATION</p><h2>Buat penawaran</h2></div><button class="icon-button" id="closeQuotationModal"><svg><use href="#i-close"/></svg></button></div><form id="quotationForm"><label>Customer<select required name="customer" id="quotationCustomerSelect"></select></label><label>Deskripsi penawaran<input required name="description" placeholder="Spare part dan jasa maintenance" /></label><div class="quotation-form-grid"><label>Jumlah<input required type="number" min="1" name="quantity" value="1" /></label><label>Harga satuan<input required type="number" min="0" name="unitPrice" placeholder="Rp" /></label><label>Berlaku sampai<input type="date" name="validUntil" /></label></div><div class="modal-actions"><button type="button" class="secondary-button" id="cancelQuotationModal">Batal</button><button class="primary-button" type="submit">Simpan penawaran</button></div></form></div>';
document.body.append(quotationModal);
$('#quotationList').addEventListener('click', (event) => { const button = event.target.closest('.print-quotation'); if (button) printQuotation(quotationCache.find((quote) => quote.id === button.dataset.quotationId)); });
const closeQuotationModal = () => quotationModal.classList.remove('open');
$('#createQuotationButton').addEventListener('click', () => { $('#quotationCustomerSelect').innerHTML = $$('#customerRows tr').map((row) => `<option value="${row.dataset.customerId}">${row.querySelector('.person b')?.textContent || 'Customer'}</option>`).join(''); quotationModal.classList.add('open'); });
$('#closeQuotationModal').addEventListener('click', closeQuotationModal);
$('#cancelQuotationModal').addEventListener('click', closeQuotationModal);
quotationModal.addEventListener('click', (event) => { if (event.target === quotationModal) closeQuotationModal(); });
$('#quotationForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  if (window.crmDb?.ready && String(form.get('customer')).startsWith('demo-')) { window.alert('Customer demo belum memiliki ID database.'); return; }
  if (window.crmDb?.ready) {
    const quote = await window.crmDb.createQuotation({ customer_id: form.get('customer'), status: 'draft', valid_until: form.get('validUntil') || null });
    if (quote.error) { window.alert(`Penawaran belum tersimpan: ${quote.error.message}`); return; }
    const item = await window.crmDb.createQuotationItem({ quotation_id: quote.data.id, description: form.get('description'), quantity: Number(form.get('quantity')), unit_price: Number(form.get('unitPrice')) });
    if (item.error) { window.alert(`Penawaran dibuat, tetapi item belum tersimpan: ${item.error.message}`); return; }
  }
  event.target.reset();
    closeQuotationModal();
    if (window.crmDb?.ready) {
      const refreshed = await window.crmDb.getQuotations();
      if (!refreshed.error) { quotationCache = refreshed.data || []; $('#quotationList').innerHTML = renderQuotations(quotationCache); }
    }
});

const stockModal = document.createElement('div');
stockModal.className = 'modal-backdrop';
stockModal.innerHTML = '<div class="modal inventory-modal"><div class="modal-header"><div><p class="eyebrow">INVENTORY MOVEMENT</p><h2>Catat stok masuk</h2></div><button class="icon-button" id="closeStockModal"><svg><use href="#i-close"/></svg></button></div><form id="stockForm"><label>Spare part<select required name="part" id="stockPartSelect"></select></label><label>Gudang<select required name="warehouse" id="stockWarehouseSelect"></select></label><div class="stock-form-grid"><label>Jenis transaksi<select name="movementType"><option value="inbound">Stok masuk</option><option value="adjustment">Adjustment</option></select></label><label>Jumlah<input required type="number" min="0.01" step="0.01" name="quantity" placeholder="Contoh: 20" /></label><label>Harga satuan<input type="number" min="0" name="unitCost" placeholder="Rp" /></label><label>Catatan<input name="notes" placeholder="Supplier / alasan adjustment" /></label></div><div class="modal-actions"><button type="button" class="secondary-button" id="cancelStockModal">Batal</button><button class="primary-button" type="submit">Simpan pergerakan</button></div></form></div>';
document.body.append(stockModal);
const closeStockModal = () => stockModal.classList.remove('open');
const refreshStockOptions = async () => {
  $('#stockPartSelect').innerHTML = $$('#partRows tr').map((row) => `<option value="${row.dataset.sparePartId || ''}">${row.querySelector('.part-code')?.textContent || 'Spare part'}</option>`).filter((option) => !option.includes('value=""')).join('');
  if (window.crmDb?.ready) {
    const result = await window.crmDb.getWarehouses();
    $('#stockWarehouseSelect').innerHTML = result.data?.map((warehouse) => `<option value="${warehouse.id}">${warehouse.name}</option>`).join('') || '<option value="">Migration gudang belum dijalankan</option>';
  } else $('#stockWarehouseSelect').innerHTML = '<option value="">Demo warehouse</option>';
};
$('#addStockButton').addEventListener('click', async () => { await refreshStockOptions(); stockModal.classList.add('open'); });
$('#closeStockModal').addEventListener('click', closeStockModal);
$('#cancelStockModal').addEventListener('click', closeStockModal);
stockModal.addEventListener('click', (event) => { if (event.target === stockModal) closeStockModal(); });
$('#stockForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  if (window.crmDb?.ready && (!form.get('part') || !form.get('warehouse'))) { window.alert('Migration inventory atau master spare part belum siap.'); return; }
  if (window.crmDb?.ready) {
    const result = await window.crmDb.createInventoryMovement({ spare_part_id: form.get('part'), warehouse_id: form.get('warehouse'), movement_type: form.get('movementType'), quantity: Number(form.get('quantity')), unit_cost: Number(form.get('unitCost')) || 0, notes: form.get('notes') || null });
    if (result.error) { window.alert(`Pergerakan stok belum tersimpan: ${result.error.message}`); return; }
  }
  event.target.reset();
  closeStockModal();
});
