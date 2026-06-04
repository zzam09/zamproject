const API = import.meta.env.VITE_API_URL;

async function api(path: string, opts?: RequestInit) {
  const adminKey = sessionStorage.getItem("admin_key") || "";
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type":"application/json", ...(adminKey?{"x-admin-key":adminKey}:{}), ...opts?.headers },
  });
  const data = await res.json().catch(() => ({ success:false, error:"Network error" }));
  if(!res.ok && !data.success) throw new Error(data.error || "Request failed");
  return data;
}

export const AdminAPI = {
  login: (key: string) => { sessionStorage.setItem("admin_key", key); return api("/admin/health"); },
  getConfig: () => api("/admin/config"),
  setConfig: (key: string, value: string) => api("/admin/config", { method:"POST", body: JSON.stringify({key,value}) }),
  regenerate: (key: string) => api(`/admin/config/regenerate/${key}`, { method:"POST" }),
};
