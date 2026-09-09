const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

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
  $('#detailMeta').innerHTML = `<div><span>Customer</span><b>${row.dataset.customer || 'PT Sinar Abadi'}</b></div><div><span>Lokasi</span><b>${cells[4].textContent}</b></div><div><span>Status</span><b>${cells[5].textContent}</b></div><div><span>Last update</span><b>${row.dataset.lastUpdated}</b></div>`;
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
    $('#overviewView').hidden = isCompany || isAsset || isEmployee || isCustomer;
    $('#companyView').hidden = !isCompany;
    $('#assetView').hidden = !isAsset;
    $('#employeeView').hidden = !isEmployee;
    $('#customerView').hidden = !isCustomer;
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

$('#assetForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const serial = form.get('generatorSerial');
  const assetId = `AST-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const row = document.createElement('tr');
  row.dataset.status = 'operational';
  row.dataset.assetId = assetId;
  row.dataset.engineSerial = form.get('engineSerial');
  row.dataset.engineType = form.get('engineType');
  row.dataset.alternatorSerial = form.get('alternatorSerial');
  row.dataset.alternatorType = form.get('alternatorType');
  row.dataset.operationMode = form.get('operationMode');
  row.dataset.customer = form.get('customer');
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
$('#employeeForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const name = form.get('name');
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const accessClass = { Administrator: 'access-admin', Editor: 'access-editor', Operator: 'access-operator', Viewer: 'access-viewer' }[form.get('access')];
  const row = document.createElement('tr');
  row.dataset.department = form.get('department');
  row.innerHTML = `<td><div class="person"><div class="avatar avatar-purple">${initials}</div><div><b>${name}</b><small>${form.get('email')}</small></div></div></td><td>${form.get('position')}</td><td>${form.get('department') === 'service' ? 'Service & Teknisi' : form.get('department') === 'sales' ? 'Sales' : 'Administrasi'}</td><td><span class="access ${accessClass}">${form.get('access')}</span></td><td><span class="status status-green">Aktif</span></td><td>Baru saja</td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td>`;
  $('#employeeRows').prepend(row);
  event.target.reset();
  closeEmployeeModal();
});

const customerModal = document.createElement('div');
customerModal.className = 'modal-backdrop';
customerModal.id = 'customerModal';
customerModal.innerHTML = '<div class="modal customer-modal"><div class="modal-header"><div><p class="eyebrow">MASTER DATA CUSTOMER</p><h2>Tambah customer</h2></div><button class="icon-button" id="closeCustomerModal"><svg><use href="#i-close"/></svg></button></div><p class="modal-description">Customer dapat berupa perusahaan atau perorangan. Aset dan histori perawatan akan terhubung ke record ini.</p><form id="customerForm"><div class="customer-form-grid"><label>Tipe customer<select required name="type"><option value="company">Perusahaan</option><option value="person">Perorangan</option></select></label><label>Nama customer<input required name="name" placeholder="Nama perusahaan atau perorangan" /></label><label>PIC / nama kontak<input required name="contact" placeholder="Nama PIC utama" /></label><label>No. telepon<input required name="phone" placeholder="0812 0000 0000" /></label><label>Email<input type="email" name="email" placeholder="customer@email.com" /></label><label>Alamat<input name="address" placeholder="Kota / alamat singkat" /></label></div><div class="modal-actions"><button type="button" class="secondary-button" id="cancelCustomerModal">Batal</button><button class="primary-button" type="submit">Simpan customer</button></div></form></div>';
document.body.append(customerModal);
const closeCustomerModal = () => customerModal.classList.remove('open');
$('#addCustomerButton').addEventListener('click', () => customerModal.classList.add('open'));
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
$('#customerForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const name = form.get('name');
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const isCompany = form.get('type') === 'company';
  const row = document.createElement('tr');
  row.dataset.type = form.get('type');
  row.innerHTML = `<td><div class="person"><div class="avatar avatar-purple">${initials}</div><div><b>${name}</b><small>CST-2026-NEW · ${form.get('address') || 'Belum ada alamat'}</small></div></div></td><td><span class="customer-type ${isCompany ? 'type-company' : 'type-person'}">${isCompany ? 'Perusahaan' : 'Perorangan'}</span></td><td>${form.get('contact')}<br><small>${form.get('phone')}</small></td><td><b>0 unit</b></td><td>Belum dijadwalkan<br><small>Belum ada aset</small></td><td><span class="status status-blue">Baru</span></td><td><button class="more-button"><svg><use href="#i-more"/></svg></button></td>`;
  $('#customerRows').prepend(row);
  row.querySelector('.more-button').addEventListener('click', () => openCustomerDetail(row));
  event.target.reset();
  closeCustomerModal();
});

const customerDetailModal = document.createElement('div');
customerDetailModal.className = 'modal-backdrop';
customerDetailModal.id = 'customerDetailModal';
customerDetailModal.innerHTML = '<div class="modal customer-detail-modal"><div class="modal-header"><div><p class="eyebrow">CUSTOMER DETAIL</p><h2 id="customerDetailName">PT Sinar Abadi</h2><p class="detail-subtitle" id="customerDetailId"></p></div><button class="icon-button" id="closeCustomerDetail"><svg><use href="#i-close"/></svg></button></div><div class="customer-profile-strip"><div class="avatar avatar-blue" id="customerDetailAvatar">SA</div><div><span class="customer-type type-company" id="customerDetailType">Perusahaan</span><p id="customerDetailContact"></p></div><span class="status status-green">Customer aktif</span></div><div class="customer-detail-stats"><div><small>Aset terdaftar</small><b id="customerAssetTotal">12 unit</b></div><div><small>Maintenance aktif</small><b id="customerMaintenanceTotal">3 jadwal</b></div><div><small>Total histori</small><b>18 record</b></div><div><small>Customer sejak</small><b>Jan 2025</b></div></div><div class="customer-detail-grid"><section><div class="detail-section-heading"><h3>Aset customer</h3><button class="text-button">Lihat semua <svg><use href="#i-arrow"/></svg></button></div><div class="customer-asset-list"><div><span class="asset-thumb">G</span><div><b>Genset RG 250 kVA</b><small>RG250-2023-014 · Plant Karawang</small></div><span class="status status-yellow">Servis</span></div><div><span class="asset-thumb thumb-purple">G</span><div><b>Genset RG 125 kVA</b><small>RG125-2024-001 · Plant Bekasi</small></div><span class="status status-green">Aktif</span></div><div><span class="asset-thumb thumb-orange">G</span><div><b>Genset RG 80 kVA</b><small>RG080-2021-021 · Workshop</small></div><span class="status status-green">Aktif</span></div></div></section><section><div class="detail-section-heading"><h3>PIC utama</h3><button class="text-button">Kelola PIC <svg><use href="#i-arrow"/></svg></button></div><div class="detail-pic"><div class="avatar avatar-green">AW</div><div><b>Andi Wijaya</b><small>Operations Manager</small><small>0812 9988 7766</small></div></div><div class="customer-address"><small>Alamat customer</small><b>Jl. Industri Raya No. 20, Jakarta</b></div></section></div><div class="customer-history"><div class="detail-section-heading"><h3>Reminder & histori terbaru</h3><span class="last-update-badge">Update 09 Sep 2026, 10.42</span></div><div class="customer-history-list"><div><span class="history-date due-today">12 SEP</span><p><b>Servis berkala · Genset RG 250 kVA</b><small>Reminder perawatan 5.000 jam</small></p><span class="status status-yellow">Terjadwal</span></div><div><span class="history-date">18 AGU</span><p><b>Preventive maintenance selesai</b><small>Oli mesin dan filter solar diganti · SPK-2026-081</small></p><span class="status status-green">Selesai</span></div></div></div><div class="detail-actions"><button class="secondary-button" id="customerDetailEdit">Edit customer</button><button class="primary-button" id="closeCustomerDetailButton">Tutup</button></div></div>';
document.body.append(customerDetailModal);
const closeCustomerDetail = () => customerDetailModal.classList.remove('open');
$('#closeCustomerDetail').addEventListener('click', closeCustomerDetail);
$('#closeCustomerDetailButton').addEventListener('click', closeCustomerDetail);
customerDetailModal.addEventListener('click', (event) => { if (event.target === customerDetailModal) closeCustomerDetail(); });
const openCustomerDetail = (row) => {
  const cells = row.querySelectorAll('td');
  const name = row.querySelector('.person b').textContent;
  const initials = row.querySelector('.avatar').textContent;
  $('#customerDetailName').textContent = name;
  $('#customerDetailId').textContent = row.querySelector('.person small').textContent;
  $('#customerDetailAvatar').textContent = initials;
  $('#customerDetailContact').innerHTML = `${cells[2].textContent.replace('\n', ' · ')}`;
  $('#customerDetailType').textContent = cells[1].textContent;
  $('#customerDetailType').className = `customer-type ${row.dataset.type === 'person' ? 'type-person' : 'type-company'}`;
  $('#customerAssetTotal').textContent = cells[3].textContent;
  $('#customerMaintenanceTotal').textContent = name === 'Lina Marlina' ? '1 jadwal' : '3 jadwal';
  customerDetailModal.classList.add('open');
};
$$('#customerRows .more-button').forEach((button) => button.addEventListener('click', () => openCustomerDetail(button.closest('tr'))));
$('#customerDetailEdit').addEventListener('click', () => { closeCustomerDetail(); customerModal.classList.add('open'); });
