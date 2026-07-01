export class ERPNextClient {
  private url: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(url: string, apiKey: string, apiSecret: string) {
    this.url = url.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  private get headers() {
    return {
      "Authorization": `token ${this.apiKey}:${this.apiSecret}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
  }

  async fetchDoctype(doctype: string, fields: string[] = ["*"], filters: any[][] = [], limit: number = 100) {
    const query = new URLSearchParams({
      fields: JSON.stringify(fields),
      filters: JSON.stringify(filters),
      limit_page_length: limit.toString()
    });

    const res = await fetch(`${this.url}/api/resource/${doctype}?${query.toString()}`, {
      method: "GET",
      headers: this.headers
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${doctype}: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data;
  }

  async createCommunication(leadOrContact: string, name: string, subject: string, content: string, status: string = "Sent") {
    const payload = {
      communication_type: "Communication",
      communication_medium: "Email",
      subject: subject,
      content: content,
      sent_or_received: "Sent",
      status: status,
      reference_doctype: leadOrContact,
      reference_name: name
    };

    const res = await fetch(`${this.url}/api/resource/Communication`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Failed to create Communication: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data;
  }

  async updateStatus(doctype: string, name: string, statusField: string, statusValue: string) {
    const payload = {
      [statusField]: statusValue
    };

    const res = await fetch(`${this.url}/api/resource/${doctype}/${name}`, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Failed to update ${doctype} status: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data;
  }
}
