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
    async getCustomerContacts(customerId) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customer_contacts').select('*').eq('customer_id', customerId).eq('is_active', true).order('is_primary', { ascending: false });
    },
    async createCustomerContact(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customer_contacts').insert(payload).select().single();
    },
    async createContact(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('contacts').insert(payload).select().single();
    },
    async createCustomerContactRelation(payload) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customer_contacts').insert(payload).select().single();
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
