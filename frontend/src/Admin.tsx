import { useEffect, useState } from 'react';
import { login, listEnquiries, updateEnquiry, deleteEnquiry, Enquiry, STATUSES, USER_TYPES, label } from './api';

export default function Admin() {
  const [token, setToken] = useState(sessionStorage.getItem('token') || '');
  const [cred, setCred] = useState({ email: '', password: '' });
  const [rows, setRows] = useState<Enquiry[]>([]); const [total, setTotal] = useState(0);
  const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [ut, setUt] = useState(''); const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Enquiry | null>(null); const [err, setErr] = useState('');
  const limit = 10;
  const logout = () => { sessionStorage.removeItem('token'); setToken(''); };

  const load = async () => {
    if (!token) return;
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) p.set('q', q); if (status) p.set('status', status); if (ut) p.set('user_type', ut);
    try { const r = await listEnquiries(p.toString(), token); setRows(r.data); setTotal(r.total); setErr(''); }
    catch (e: any) { if (e.message === 'Unauthorized') logout(); else setErr('Could not load enquiries. Please try again.'); }
  };
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [token, q, status, ut, page]);

  const act = async (fn: () => Promise<unknown>) => { try { await fn(); await load(); } catch { setErr('Action failed. Please try again.'); } };
  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const r = await login(cred.email, cred.password); sessionStorage.setItem('token', r.token); setToken(r.token); setErr(''); }
    catch (e: any) { setErr(e.message); }
  };

  if (!token) return (<form className="card" onSubmit={doLogin}><h3>Admin Login</h3>
    <input placeholder="Email" value={cred.email} onChange={e => setCred({ ...cred, email: e.target.value })} />
    <input type="password" placeholder="Password" value={cred.password} onChange={e => setCred({ ...cred, password: e.target.value })} />
    <button>Login</button>{err && <small>{err}</small>}</form>);

  const StatusSel = ({ r }: { r: Enquiry }) => <select value={r.status} onChange={e => act(async () => { await updateEnquiry(r.id, { status: e.target.value }, token); if (sel?.id === r.id) setSel({ ...r, status: e.target.value }); })}>{STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select>;
  const del = (id: number) => { if (confirm('Delete this enquiry?')) act(async () => { await deleteEnquiry(id, token); setSel(null); }); };

  return (<div className="card wide">
    <div className="bar"><h3>Enquiries ({total})</h3><button onClick={logout}>Logout</button></div>
    <div className="filters">
      <input placeholder="Search name, email, message" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
      <select value={ut} onChange={e => { setUt(e.target.value); setPage(1); }}><option value="">All types</option>{USER_TYPES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select>
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All status</option>{STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select>
    </div>
    {err && <small>{err}</small>}
    <div className="scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Type</th><th>Interest</th><th>Status</th><th></th></tr></thead>
      <tbody>{rows.map(r => <tr key={r.id}><td>{r.name}</td><td>{r.email}</td><td>{label(r.user_type)}</td><td>{label(r.interest)}</td><td><StatusSel r={r} /></td>
        <td><button onClick={() => setSel(r)}>View</button> <button onClick={() => del(r.id)}>🗑</button></td></tr>)}
        {!rows.length && <tr><td colSpan={6}>No enquiries found</td></tr>}</tbody></table></div>
    <div className="pager"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><span>Page {page} / {Math.max(1, Math.ceil(total / limit))}</span><button disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Next</button></div>
    {sel && <div className="modal" onClick={() => setSel(null)}><div className="card" onClick={e => e.stopPropagation()}>
      <h3>Enquiry #{sel.id}</h3>
      <p><b>Name:</b> {sel.name}</p><p><b>Email:</b> {sel.email}</p><p><b>Phone:</b> {sel.phone || '-'}</p>
      <p><b>Type:</b> {label(sel.user_type)}</p><p><b>Interest:</b> {label(sel.interest)}</p><p><b>Source:</b> {sel.source}</p>
      <p><b>Received:</b> {new Date(sel.created_at).toLocaleString()}</p><p><b>Message:</b> {sel.message}</p>
      <div><b>Status:</b> <StatusSel r={sel} /></div><button onClick={() => setSel(null)}>Close</button></div></div>}
  </div>);
}
