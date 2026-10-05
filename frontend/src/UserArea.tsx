import { useEffect, useState } from 'react';
import { userAuth, myEnquiries, Enquiry, STATUSES, label } from './api';

export default function UserArea() {
  const [token, setToken] = useState(sessionStorage.getItem('user_token') || '');
  const [name, setName] = useState(sessionStorage.getItem('user_name') || '');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [err, setErr] = useState('');
  const logout = () => { sessionStorage.removeItem('user_token'); sessionStorage.removeItem('user_name'); setToken(''); setRows([]); };

  useEffect(() => {
    if (!token) return;
    myEnquiries(token).then(setRows).catch(e => e.message === 'Unauthorized' ? logout() : setErr('Could not load your enquiries.'));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && f.name.trim().length < 2) return setErr('Name is required (min 2 characters)');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email address');
    if (f.password.length < 8) return setErr('Password must be at least 8 characters');
    try {
      const r = await userAuth(mode, f);
      sessionStorage.setItem('user_token', r.token); sessionStorage.setItem('user_name', r.name);
      setToken(r.token); setName(r.name); setErr('');
    } catch (er: any) { setErr(er.message || 'Something went wrong. Please try again.'); }
  };

  if (!token) return (
    <form className="card" onSubmit={submit} noValidate>
      <h3>{mode === 'login' ? 'Login to track your enquiries' : 'Create an account'}</h3>
      {mode === 'register' && <input placeholder="Full name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}
      <input placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
      <input type="password" placeholder="Password (min 8 characters)" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
      <button>{mode === 'login' ? 'Login' : 'Register'}</button>{err && <small>{err}</small>}
      <a href="#" onClick={e => { e.preventDefault(); setErr(''); setMode(mode === 'login' ? 'register' : 'login'); }}>
        {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Login'}</a>
    </form>);

  return (<div className="card wide">
    <div className="bar"><h3>Welcome, {name}</h3><button onClick={logout}>Logout</button></div>
    <p>Enquiries you submit while logged in appear here.</p>{err && <small>{err}</small>}
    {!rows.length && <p>No enquiries yet.</p>}
    {rows.map(r => <div className="enq" key={r.id}>
      <b>#{r.id} · {label(r.interest)}</b> <span className="muted">{new Date(r.created_at).toLocaleDateString()}</span>
      <p>{r.message}</p>
      <div className="track">{STATUSES.map((s, i) => <span key={s} className={i <= STATUSES.indexOf(r.status) ? 'on' : ''}>{label(s)}</span>)}</div>
    </div>)}
  </div>);
}
