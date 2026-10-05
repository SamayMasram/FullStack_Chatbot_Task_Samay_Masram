import { useState } from 'react';
import Chatbot from './Chatbot';
import EnquiryForm from './EnquiryForm';
import Admin from './Admin';
import Sections from './Sections';
import UserArea from './UserArea';

type Page = 'home' | 'admin' | 'user';
const LINKS: [string, string][] = [['Home', 'top'], ['Services', 'services'], ['Courses', 'courses'], ['Contact', 'contact']];

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [active, setActive] = useState('top');
  const [menu, setMenu] = useState(false);
  const current = page === 'home' ? active : page;

  const go = (id: string) => {
    setPage('home'); setActive(id); setMenu(false);
    setTimeout(() => id === 'top' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60);
  };
  const open = (p: Page) => { setPage(p); setMenu(false); window.scrollTo(0, 0); };

  return (<>
    <header className="navbar">
      <div className="nav-inner">
        <a className="brand" href="#top" onClick={e => { e.preventDefault(); go('top'); }}>
          <span className="logo">🚁</span><span>Drone<b>TV</b> Assistant</span>
        </a>
        <button className={'burger' + (menu ? ' open' : '')} onClick={() => setMenu(!menu)} aria-label="Toggle menu" aria-expanded={menu}>
          <span /><span /><span />
        </button>
        <nav className={menu ? 'show' : ''}>
          {LINKS.map(([label, id]) => (
            <a key={id} href={'#' + id} className={current === id ? 'active' : ''} onClick={e => { e.preventDefault(); go(id); }}>{label}</a>
          ))}
          <a href="#user" className={current === 'user' ? 'active' : ''} onClick={e => { e.preventDefault(); open('user'); }}>My Enquiries</a>
          <button className="nav-cta" onClick={() => open('admin')}>Admin</button>
        </nav>
      </div>
    </header>

    <main id="top">
      {page === 'home' ? (<>
        <section className="hero">
          <div>
            <span className="eyebrow">Support &amp; Lead Assistant</span>
            <h2>Everything drones, answered in seconds.</h2>
            <p>Explore our services and training, chat with the assistant, or send an enquiry and track its progress anytime.</p>
            <div className="cta">
              <button className="btn" onClick={() => go('contact')}>Send an Enquiry</button>
              <button className="btn ghost" onClick={() => go('services')}>Explore Services</button>
            </div>
          </div>
          <div className="stats">
            <div><b>💬</b><span>Instant chatbot answers</span></div>
            <div><b>📍</b><span>Track your enquiry status</span></div>
            <div><b>🎓</b><span>Training for every level</span></div>
          </div>
        </section>
        <Sections />
        <section id="contact"><h2>Contact / Enquiry</h2><EnquiryForm /></section>
        <Chatbot />
      </>) : page === 'admin' ? <Admin /> : <UserArea />}
    </main>
    <footer>© {new Date().getFullYear()} DroneTV Assistant · Built with React, Express &amp; MySQL</footer>
  </>);
}