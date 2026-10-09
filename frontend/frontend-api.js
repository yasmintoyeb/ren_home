/**
 * NearU Frontend API Helper
 * ដាក់ file នេះក្នុង folder frontend របស់អ្នក រួចភ្ជាប់:
 * <script src="frontend-api.js"></script>
 *
 * ប្តូរ API_BASE ប្រសិនបើ server រត់កន្លែងផ្សេង
 */
const NearUAPI = (() => {
  const API_BASE = 'http://localhost:3000/api';

  function token() {
    return localStorage.getItem('nearu_token');
  }

  function headers(auth = false) {
    const h = { 'Content-Type': 'application/json' };
    if (auth && token()) h['Authorization'] = 'Bearer ' + token();
    return h;
  }

  async function request(path, options = {}) {
    const res = await fetch(API_BASE + path, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  return {
    // Auth
    async signup({ name, email, password, role, phone }) {
      const data = await request('/auth/signup', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name, email, password, role, phone })
      });
      localStorage.setItem('nearu_token', data.token);
      localStorage.setItem('nearu_user', JSON.stringify(data.user));
      return data;
    },

    async login({ email, password }) {
      const data = await request('/auth/login', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('nearu_token', data.token);
      localStorage.setItem('nearu_user', JSON.stringify(data.user));
      return data;
    },

    logout() {
      localStorage.removeItem('nearu_token');
      localStorage.removeItem('nearu_user');
    },

    currentUser() {
      try {
        return JSON.parse(localStorage.getItem('nearu_user') || 'null');
      } catch {
        return null;
      }
    },

    async me() {
      return request('/auth/me', { headers: headers(true) });
    },

    // Properties
    async getProperties(params = {}) {
      const q = new URLSearchParams(params).toString();
      return request('/properties' + (q ? '?' + q : ''));
    },

    async getFeatured() {
      return request('/properties/featured');
    },

    async getProperty(id) {
      return request('/properties/' + id);
    },

    async createProperty(body) {
      return request('/properties', {
        method: 'POST',
        headers: headers(true),
        body: JSON.stringify(body)
      });
    },

    async updateProperty(id, body) {
      return request('/properties/' + id, {
        method: 'PUT',
        headers: headers(true),
        body: JSON.stringify(body)
      });
    },

    async deleteProperty(id) {
      return request('/properties/' + id, {
        method: 'DELETE',
        headers: headers(true)
      });
    },

    // Inquiries
    async sendInquiry(body) {
      return request('/inquiries', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body)
      });
    },

    async getInquiries() {
      return request('/inquiries', { headers: headers(true) });
    }
  };
})();
