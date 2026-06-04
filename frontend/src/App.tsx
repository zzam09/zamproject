import { useEffect, useState } from "react";
import { AdminAPI } from "./api";
import "./index.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [config, setConfig] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_key");
    if(saved){ setAdminKey(saved); handleLogin(saved); }
  }, []);

  const handleLogin = async (key: string) => {
    try{ setLoading(true); await AdminAPI.login(key); setLoggedIn(true); loadConfig(); }
    catch{ setMsg("Invalid key"); sessionStorage.removeItem("admin_key"); }
    finally{ setLoading(false); }
  };

  const loadConfig = async () => {
    setLoading(true);
    try{ const res = await AdminAPI.getConfig(); setConfig(res.data); } catch(e:any){ setMsg(e.message); }
    setLoading(false);
  };

  const toggleGateway = async () => {
    const next = config.gateway_enabled === "true" ? "false" : "true";
    await AdminAPI.setConfig("gateway_enabled", next);
    setMsg(`Gateway ${next==="true"?"ON":"OFF"}`); loadConfig();
  };

  const regenerate = async (key: string) => {
    await AdminAPI.regenerate(key); setMsg(`Regenerated ${key}`); loadConfig();
  };

  if(!loggedIn) return (
    <div className="login-screen">
      <div className="card">
        <h1>🔐 ZamProject</h1>
        <p>Enter admin key</p>
        <input type="password" placeholder="Admin key" value={adminKey}
          onChange={e=>setAdminKey(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleLogin(adminKey)} />
        <button className="primary" onClick={()=>handleLogin(adminKey)} disabled={loading}>{loading?"...":"Enter"}</button>
        {msg&&<div className="msg error">{msg}</div>}
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <header><h1>⚙️ Control</h1><button className="logout" onClick={()=>{sessionStorage.clear();location.reload();}}>Logout</button></header>
      {msg&&<div className="msg">{msg}</div>}
      <div className="grid">
        <div className="card">
          <div className="card-header"><h2>🌐 Gateway</h2><span className={`badge ${config.gateway_enabled==="true"?"on":"off"}`}>{config.gateway_enabled==="true"?"ON":"OFF"}</span></div>
          <p>AI agent remote access</p>
          <button className={config.gateway_enabled==="true"?"danger":"primary"} onClick={toggleGateway}>{config.gateway_enabled==="true"?"Disable":"Enable"}</button>
        </div>
        <div className="card">
          <h2>🔑 Temp Key</h2>
          <code className="key-box">{config.temp_gateway_key}</code>
          <button className="primary" onClick={()=>regenerate("temp_gateway_key")}>Regenerate</button>
        </div>
        <div className="card">
          <h2>🛡️ Admin Key</h2>
          <code className="key-box">{config.admin_key}</code>
          <button className="primary" onClick={()=>regenerate("admin_key")}>Regenerate</button>
        </div>
      </div>
      <div className="card" style={{marginTop:12}}><h3>Config</h3><pre className="json">{JSON.stringify(config,null,2)}</pre></div>
    </div>
  );
}
export default App;
