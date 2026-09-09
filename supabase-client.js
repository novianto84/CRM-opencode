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
    async getCustomerContacts(customerId) {
      if (!this.ready) return { data: null, error: new Error('Supabase belum dikonfigurasi') };
      return window.supabaseClient.from('customer_contacts').select('*').eq('customer_id', customerId).eq('is_active', true).order('is_primary', { ascending: false });
    },
    async createCustomerContact(payload) {
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
