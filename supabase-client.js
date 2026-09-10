(() => {
  const config = window.SUPABASE_CONFIG;
  const hasSdk = window.supabase && typeof window.supabase.createClient === 'function';
  const configured = config && config.url && config.anonKey && !config.url.includes('your-project-id');

  window.crmDb = {
    ready: Boolean(hasSdk && configured),
    async getCustomers() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customer_summary').select('*').order('updated_at', { ascending: false });
    },
    async createCustomer(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customers').insert(payload).select().single();
    },
    async findCustomerByName(name) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customers').select('id, name').eq('name', name).maybeSingle();
    },
    async getCustomer(id) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customers').select('*').eq('id', id).single();
    },
    async updateCustomer(id, payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customers').update(payload).eq('id', id).select().single();
    },
    async uploadCustomerLogo(customerId, file) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      const path = `${customerId}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '-')}`;
      const upload = await window.supabaseClient.storage.from('company-logos').upload(path, file, { upsert: true, contentType: file.type });
      if (upload.error) return { data: null, error: upload.error };
      const { data } = window.supabaseClient.storage.from('company-logos').getPublicUrl(path);
      return { data: { publicUrl: data.publicUrl }, error: null };
    },
    async getCustomerContacts(customerId) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customer_contacts').select('*, contacts!customer_contacts_contact_id_fkey(*)').eq('customer_id', customerId).eq('is_active', true).order('is_primary', { ascending: false });
    },
    async createCustomerContact(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customer_contacts').insert(payload).select().single();
    },
    async getContacts() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('contacts').select('id, full_name, position, phone, phone2, email, email2, photo_url').eq('is_active', true).order('full_name').limit(200);
    },
    async getContact(id) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('contacts').select('*').eq('id', id).single();
    },
    async updateContact(id, payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('contacts').update(payload).eq('id', id).select().single();
    },
    async uploadContactPhoto(contactId, file) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      const path = `${contactId}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '-')}`;
      const upload = await window.supabaseClient.storage.from('contact-photos').upload(path, file, { upsert: true, contentType: file.type });
      if (upload.error) return { data: null, error: upload.error };
      const { data } = window.supabaseClient.storage.from('contact-photos').getPublicUrl(path);
      return { data: { publicUrl: data.publicUrl }, error: null };
    },
    async getContactCustomers(contactId) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customer_contacts').select('id, role, is_primary, customers(name)').eq('contact_id', contactId).eq('is_active', true).order('created_at', { ascending: false });
    },
    async getContactDirectory() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customer_contacts').select('id, role, position, is_primary, created_at, contacts!customer_contacts_contact_id_fkey(id, full_name, position, phone, phone2, email, email2, photo_url), customers(name)').eq('is_active', true).order('created_at', { ascending: false }).limit(500);
    },
    async createContact(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('contacts').insert(payload).select().single();
    },
    async createCustomerContactRelation(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customer_contacts').insert(payload).select().single();
    },
    async updateCustomerContact(id, payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customer_contacts').update(payload).eq('id', id).select().single();
    },
    async getEmployee(id) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('employees').select('*').eq('id', id).single();
    },
    async updateEmployee(id, payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('employees').update(payload).eq('id', id).select().single();
    },
    async getEmployeesPublic() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('employee_public').select('*').order('full_name');
    },
    async uploadEmployeePhoto(employeeId, file) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      const path = `${employeeId}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '-')}`;
      const upload = await window.supabaseClient.storage.from('employee-photos').upload(path, file, { upsert: true, contentType: file.type });
      if (upload.error) return { data: null, error: upload.error };
      const { data } = window.supabaseClient.storage.from('employee-photos').getPublicUrl(path);
      return { data: { publicUrl: data.publicUrl }, error: null };
    },
    async getMyEmployee() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      const { data: userData, error: userError } = await window.supabaseClient.auth.getUser();
      if (userError || !userData?.user) return { data: null, error: userError || new Error('Belum login') };
      const byId = await window.supabaseClient.from('employees').select('id, full_name, access_level, is_active').eq('auth_user_id', userData.user.id).eq('is_active', true).maybeSingle();
      if (byId.data || byId.error) return byId;
      const byEmail = await window.supabaseClient.from('employees').select('id, full_name, access_level, is_active').eq('email', userData.user.email).eq('is_active', true).maybeSingle();
      if (!byEmail.error && byEmail.data) {
        await window.supabaseClient.from('employees').update({ auth_user_id: userData.user.id }).eq('id', byEmail.data.id);
      }
      return byEmail;
    },
    async getCustomerLocations(customerId) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customer_locations').select('*').eq('customer_id', customerId).eq('is_active', true).order('is_primary', { ascending: false });
    },
    async createCustomerLocation(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customer_locations').insert(payload).select().single();
    },
    async getAssets() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('assets').select('*, customers(name), customer_locations(name)').order('updated_at', { ascending: false });
    },
    async createAsset(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('assets').insert(payload).select().single();
    },
    async getMaintenanceSchedules() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('maintenance_schedules').select('*, assets(asset_code, name, generator_serial, customers(name))').order('next_due_date', { ascending: true });
    },
    async createMaintenanceSchedule(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('maintenance_schedules').insert(payload).select().single();
    },
    async getMaintenanceRecords() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('maintenance_records').select('*, assets(name, asset_code, customers(name))').order('performed_at', { ascending: false });
    },
    async getWorkOrders() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('work_orders').select('*, customers(name), assets(id, name, asset_code), employees!work_orders_assigned_to_fkey(full_name)').order('updated_at', { ascending: false });
    },
    async createWorkOrder(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('work_orders').insert(payload).select().single();
    },
    async updateWorkOrder(id, payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('work_orders').update(payload).eq('id', id).select().single();
    },
    async createMaintenanceRecord(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('maintenance_records').insert(payload).select().single();
    },
    async createMaintenancePart(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('maintenance_parts').insert(payload).select().single();
    },
    async getSpareParts() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('spare_part_inventory').select('*').order('part_code');
    },
    async createSparePart(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('spare_parts').insert(payload).select().single();
    },
    async getSparePart(id) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('spare_parts').select('*').eq('id', id).single();
    },
    async deleteItemUnit(id) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_units').delete().eq('id', id);
    },
    async updateSparePart(id, payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('spare_parts').update(payload).eq('id', id).select().single();
    },
    async getVendorPrices(sparePartId) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('spare_part_vendor_prices').select('*').eq('spare_part_id', sparePartId).order('created_at', { ascending: false }).limit(50);
    },
    async createVendorPrice(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('spare_part_vendor_prices').insert(payload).select().single();
    },
    async getCategories() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_categories').select('*').eq('is_active', true).order('name');
    },
    async createCategory(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_categories').upsert(payload, { onConflict: 'name' }).select().single();
    },
    async deleteCategory(id) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_categories').delete().eq('id', id);
    },
    async getBrands() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_brands').select('*').eq('is_active', true).order('name');
    },
    async createBrand(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_brands').upsert(payload, { onConflict: 'name' }).select().single();
    },
    async deleteBrand(id) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_brands').delete().eq('id', id);
    },
    async getUnits() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('units').select('*').eq('is_active', true).order('code');
    },
    async createUnit(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('units').upsert(payload, { onConflict: 'code' }).select().single();
    },
    async deleteUnit(id) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('units').delete().eq('id', id);
    },
    async getItemUnits(sparePartId) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_units').select('*').eq('spare_part_id', sparePartId).order('conversion_to_base');
    },
    async createItemUnit(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_units').upsert(payload, { onConflict: 'spare_part_id,unit' }).select().single();
    },
    async getPartMovements(sparePartId) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('inventory_movements').select('*, warehouses(name)').eq('spare_part_id', sparePartId).order('created_at', { ascending: true }).limit(500);
    },
    async getAllMovements() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('inventory_movements').select('spare_part_id, warehouse_id, movement_type, quantity').limit(5000);
    },
    async getVendors() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('vendors').select('*').eq('is_active', true).order('name');
    },
    async createVendor(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('vendors').upsert(payload, { onConflict: 'name' }).select().single();
    },
    async deleteVendor(id) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('vendors').delete().eq('id', id);
    },
    async createOpnameOrder(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('stock_opname_orders').insert(payload).select().single();
    },
    async createOpnameItems(rows) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('stock_opname_items').insert(rows).select();
    },
    async updateWarehouse(id, payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('warehouses').update(payload).eq('id', id).select().single();
    },
    async createWarehouse(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('warehouses').insert(payload).select().single();
    },
    async getPriceTiers(sparePartId) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_price_tiers').select('*').eq('spare_part_id', sparePartId).order('min_qty', { ascending: false });
    },
    async createPriceTier(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_price_tiers').upsert(payload, { onConflict: 'spare_part_id,min_qty' }).select().single();
    },
    async deleteTier(id) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_price_tiers').delete().eq('id', id);
    },
    async getSubstitutes(sparePartId) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_substitutes').select('id, notes, substitute:spare_parts!item_substitutes_substitute_id_fkey(spare_part_id, part_code, name, list_price)').eq('spare_part_id', sparePartId);
    },
    async createSubstitute(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_substitutes').insert(payload).select().single();
    },
    async deleteSubstitute(id) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('item_substitutes').delete().eq('id', id);
    },
    async updateQuotation(id, payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('quotations').update(payload).eq('id', id).select().single();
    },
    async getPurchaseOrders() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('purchase_orders').select('*, purchase_order_items(*)').order('created_at', { ascending: false }).limit(100);
    },
    async createPurchaseOrder(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('purchase_orders').insert(payload).select().single();
    },
    async updatePurchaseOrder(id, payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('purchase_orders').update(payload).eq('id', id).select().single();
    },
    async createPurchaseOrderItems(rows) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('purchase_order_items').insert(rows).select();
    },
    async updatePurchaseOrderItem(id, payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('purchase_order_items').update(payload).eq('id', id).select().single();
    },
    async createGoodsReceipt(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('goods_receipts').insert(payload).select().single();
    },
    async createGoodsReceiptItems(rows) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('goods_receipt_items').insert(rows).select();
    },
    async uploadItemPhoto(sparePartId, file) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      const path = `${sparePartId}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '-')}`;
      const upload = await window.supabaseClient.storage.from('item-photos').upload(path, file, { upsert: true, contentType: file.type });
      if (upload.error) return { data: null, error: upload.error };
      const { data } = window.supabaseClient.storage.from('item-photos').getPublicUrl(path);
      return { data: { publicUrl: data.publicUrl }, error: null };
    },
    async createInventoryMovement(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('inventory_movements').insert(payload).select().single();
    },
    async getWarehouses() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('warehouses').select('*').eq('is_active', true).order('name');
    },
    async createQuotation(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('quotations').insert(payload).select().single();
    },
    async createQuotationItem(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('quotation_items').insert(payload).select().single();
    },
    async getQuotations() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('quotations').select('*, customers(name), quotation_items(*)').order('created_at', { ascending: false });
    },
    async getEmployees() {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('employees').select('*').order('full_name');
    },
    async createEmployee(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('employees').insert(payload).select().single();
    }
  };

  if (window.crmDb.ready) {
    window.supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    window.crmDb.ready = true;
    document.documentElement.dataset.database = 'connected';
  } else {
    document.documentElement.dataset.database = 'demo';
  }
})();
