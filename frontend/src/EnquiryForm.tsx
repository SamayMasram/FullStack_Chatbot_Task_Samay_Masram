import { useState } from 'react';
import { createEnquiry, INTERESTS, USER_TYPES, label } from './api';
const empty = { name: '', email: '', phone: '', user_type: 'student', interest: 'other', message: '' };

export default function EnquiryForm() {
  const [f, setF] = useState(empty);
  const [err, setErr] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    const x: Record<string, string> = {};
    if (f.name.trim().length < 2) x.name = 'Name is required (min 2 characters)';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) x.email = 'Enter a valid email address';
    if (f.phone && !/^[0-9+\-\s]{7,15}$/.test(f.phone)) x.phone = 'Enter a valid phone number';
    if (f.message.trim().length < 5) x.message = 'Message is required (min 5 characters)';
    setErr(x); if (Object.keys(x).length) return;
    try { await createEnquiry({ ...f, source: 'form' }); setMsg('✅ Thanks! We will contact you soon.'); setF(empty); }
    catch (er: any) { setMsg('❌ ' + (er.message || 'Something went wrong. Please try again.')); }
  };
  return (
    <form className="card" onSubmit={submit} noValidate>
      <input placeholder="Full name" value={f.name} onChange={set('name')} />{err.name && <small>{err.name}</small>}
      <input placeholder="Email" value={f.email} onChange={set('email')} />{err.email && <small>{err.email}</small>}
      <input placeholder="Phone" value={f.phone} onChange={set('phone')} />{err.phone && <small>{err.phone}</small>}
      <select value={f.user_type} onChange={set('user_type')}>{USER_TYPES.map(i => <option key={i} value={i}>{label(i)}</option>)}</select>
      <select value={f.interest} onChange={set('interest')}>{INTERESTS.map(i => <option key={i} value={i}>{label(i)}</option>)}</select>
      <textarea placeholder="Your message" rows={4} value={f.message} onChange={set('message')} />{err.message && <small>{err.message}</small>}
      <button type="submit">Submit</button>{msg && <p>{msg}</p>}
    </form>);
}
