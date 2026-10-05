import { useEffect, useState } from 'react';
import { createEnquiry } from './api';

type Msg = { from: 'bot' | 'user'; text: string };
type Step = '' | 'name' | 'email' | 'phone' | 'user_type' | 'interest' | 'message';
const ORDER: Step[] = ['name', 'email', 'phone', 'user_type', 'interest', 'message'];
const ASK: Record<string, string> = { name: 'What is your name?', email: 'Your email address?', phone: 'Your phone number? (type "skip" to skip)', user_type: 'Are you a Student, Customer or Other?', interest: 'Which service or course are you interested in?', message: 'Anything you would like to tell us?' };
const INT: Record<string, string> = { 'Drone Training': 'drone_training', 'Drone Services': 'drone_services', 'Content & Media': 'content_media', Other: 'other' };
// TODO: update answers to match dronetv.in
const FAQ = [
  { q: 'What services does DroneTV provide?', k: ['service'], a: 'We offer aerial videography, survey & mapping and drone media content.' },
  { q: 'What courses are available?', k: ['course', 'training'], a: 'We run drone pilot basics, advanced operations and aerial cinematography programs.' },
  { q: 'How can I contact DroneTV?', k: ['contact', 'reach', 'phone number'], a: 'Use the Contact form on this page, or tell me "I want to speak with someone" and I will take your details.' },
  { q: 'How can I register?', k: ['register', 'sign up', 'enrol', 'enroll'], a: 'To register, share your details with me ("I am a student") or use the Contact form and our team will confirm your registration.' },
];
const FIRST: Msg[] = [{ from: 'bot', text: 'Hi! 👋 Pick a question below or type your own.' }];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => JSON.parse(sessionStorage.getItem('chat') || 'null') || FIRST);
  const [input, setInput] = useState('');
  const [step, setStep] = useState<Step>('');
  const [d, setD] = useState<Record<string, string>>({});
  useEffect(() => sessionStorage.setItem('chat', JSON.stringify(msgs)), [msgs]);
  const add = (...m: Msg[]) => setMsgs(x => [...x, ...m]);
  const bot = (text: string): Msg => ({ from: 'bot', text });
  const user = (text: string): Msg => ({ from: 'user', text });

  const startLead = (pre: Record<string, string> = {}) => { setD(pre); setStep('name'); return bot("Sure! Let's take your details. " + ASK.name); };
  const reset = () => { setMsgs(FIRST); setStep(''); setD({}); };

  const answer = (t: string): Msg => {
    const l = t.toLowerCase();
    if (/student/.test(l)) return startLead({ user_type: 'student' });
    if (/interested in a service|customer/.test(l)) return startLead({ user_type: 'customer', interest: 'drone_services' });
    if (/speak|talk|human|someone/.test(l)) return startLead();
    const f = FAQ.find(x => x.k.some(k => l.includes(k)));
    if (f) return bot(f.a);
    if (/^(hi|hello|hey)\b/.test(l)) return bot('Hello! How can I help you today?');
    return bot("Sorry, I couldn't understand that. Try one of the suggested questions or say \"I want to speak with someone\".");
  };

  const send = async (text: string) => {
    const t = text.trim(); if (!t) return; setInput('');
    if (!step) return add(user(t), answer(t));
    let v = t;
    if (step === 'name' && t.length < 2) return add(user(t), bot('Please enter a valid name.'));
    if (step === 'email' && !/^\S+@\S+\.\S+$/.test(t)) return add(user(t), bot('That email looks invalid. Please try again.'));
    if (step === 'phone') { if (/^skip$/i.test(t)) v = ''; else if (!/^[0-9+\-\s]{7,15}$/.test(t)) return add(user(t), bot('Please enter a valid phone number or type "skip".')); }
    if (step === 'user_type') { v = t.toLowerCase(); if (!['student', 'customer', 'other'].includes(v)) return add(user(t), bot('Please choose Student, Customer or Other.')); }
    if (step === 'interest') { v = INT[t] || (Object.values(INT).includes(t) ? t : ''); if (!v) return add(user(t), bot('Please choose one of the options.')); }
    if (step === 'message' && t.length < 5) return add(user(t), bot('Please write at least 5 characters.'));
    const nd = { ...d, [step]: v };
    const next = ORDER.slice(ORDER.indexOf(step) + 1).find(s => !(s in nd));
    setD(nd);
    if (next) { setStep(next); return add(user(t), bot(ASK[next])); }
    setStep('');
    try { await createEnquiry({ ...nd, source: 'chatbot' }); add(user(t), bot('✅ Thanks! Your enquiry has been submitted. Our team will contact you soon.')); }
    catch { add(user(t), bot('❌ Sorry, we could not submit your enquiry. Please try again later.')); }
  };

  const chips = step === 'user_type' ? ['Student', 'Customer', 'Other'] : step === 'interest' ? Object.keys(INT)
    : step ? [] : [...FAQ.map(f => f.q), 'I am interested in a service', 'I am a student', 'I want to speak with someone'];

  return (<>
    <button className="fab" onClick={() => setOpen(!open)} aria-label="Toggle chat">{open ? '✕' : '💬'}</button>
    {open && <div className="chat">
      <div className="bar"><b>Assistant</b><button onClick={reset}>Clear chat</button></div>
      <div className="msgs">{msgs.map((m, i) => <div key={i} className={'bubble ' + m.from}>{m.text}</div>)}</div>
      <div className="quick">{chips.map(q => <button key={q} onClick={() => send(q)}>{q}</button>)}</div>
      <div className="row"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} placeholder="Type a message…" /><button onClick={() => send(input)}>Send</button></div>
    </div>}
  </>);
}
