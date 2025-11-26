// Direct REST API client for Supabase to avoid X-Application-Name header issues

function getConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return { supabaseUrl, supabaseServiceKey };
}

// Simple REST client that mimics Supabase client interface
class SupabaseRestClient {
  private url: string;
  private key: string;

  constructor(url: string, key: string) {
    this.url = url;
    this.key = key;
  }

  private getHeaders() {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  from(table: string) {
    return new TableQuery(this.url, this.key, table, this.getHeaders());
  }

  async rpc(functionName: string, params: Record<string, any>) {
    const response = await fetch(`${this.url}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.text();
      return { data: null, error: { message: error } };
    }

    const data = await response.json();
    return { data, error: null };
  }
}

class TableQuery {
  private url: string;
  private key: string;
  private table: string;
  private headers: Record<string, string>;
  private selectColumns: string = '*';
  private filters: string[] = [];
  private limitCount?: number;
  private countOption?: string;
  private headOnly: boolean = false;

  constructor(url: string, key: string, table: string, headers: Record<string, string>) {
    this.url = url;
    this.key = key;
    this.table = table;
    this.headers = headers;
  }

  select(columns: string = '*', options?: { count?: string; head?: boolean }) {
    this.selectColumns = columns;
    if (options?.count) {
      this.countOption = options.count;
      this.headers['Prefer'] = `count=${options.count}`;
    }
    if (options?.head) {
      this.headOnly = true;
    }
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push(`${column}=ilike.${encodeURIComponent(pattern)}`);
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(`${column}=eq.${encodeURIComponent(value)}`);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push(`${column}=neq.${encodeURIComponent(value)}`);
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async execute(): Promise<{ data: any; error: any }> {
    let queryUrl = `${this.url}/rest/v1/${this.table}?select=${encodeURIComponent(this.selectColumns)}`;

    if (this.filters.length > 0) {
      queryUrl += '&' + this.filters.join('&');
    }

    if (this.limitCount) {
      queryUrl += `&limit=${this.limitCount}`;
    }

    const response = await fetch(queryUrl, {
      method: this.headOnly ? 'HEAD' : 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      const error = await response.text();
      return { data: null, error: { message: error } };
    }

    if (this.headOnly) {
      return { data: null, error: null };
    }

    const data = await response.json();
    return { data, error: null };
  }

  // Alias for execute
  then(resolve: (value: { data: any; error: any }) => void) {
    return this.execute().then(resolve);
  }

  async insert(data: Record<string, any> | Record<string, any>[]) {
    const response = await fetch(`${this.url}/rest/v1/${this.table}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      return { data: null, error: { message: error } };
    }

    const result = await response.json();
    return { data: result, error: null };
  }

  async delete() {
    let queryUrl = `${this.url}/rest/v1/${this.table}`;

    if (this.filters.length > 0) {
      queryUrl += '?' + this.filters.join('&');
    }

    const response = await fetch(queryUrl, {
      method: 'DELETE',
      headers: this.headers
    });

    if (!response.ok) {
      const error = await response.text();
      return { data: null, error: { message: error } };
    }

    return { data: null, error: null };
  }
}

let adminClient: SupabaseRestClient | null = null;

export function getSupabaseAdmin(): SupabaseRestClient {
  if (!adminClient) {
    const { supabaseUrl, supabaseServiceKey } = getConfig();
    adminClient = new SupabaseRestClient(supabaseUrl, supabaseServiceKey);
  }
  return adminClient;
}

export function getSupabase(): SupabaseRestClient {
  return getSupabaseAdmin();
}

export interface Document {
  id: string;
  content: string;
  metadata: {
    source: string;
    page: number;
    total_pages: number;
  };
  embedding: number[];
  created_at: string;
}
