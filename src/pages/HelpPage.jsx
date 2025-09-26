import React, { useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import './HelpPage.css';
import { useTranslation } from 'react-i18next';

// Mock data for the help page
const FAQS = [
  { q: 'How do I create a new request?', a: 'Navigate to All Requests and click the Add Request button. Fill in the form and submit.' },
  { q: 'How do I book a resource?', a: 'Open Master Calendar and click Add Booking or click on an available timeslot.' },
  { q: 'Where can I see reports?', a: 'Go to Analytics to view charts, trends, and recent feedback.' }
];

const TROUBLESHOOTING = [
  { title: 'Cannot login', steps: ['Ensure your credentials are correct', 'Try resetting your password from the login page', 'Contact support if issue persists'] },
  { title: 'Missing permissions', steps: ['Check your user role in Profile', 'Contact an administrator to update your role'] }
];

const VIDEO_GUIDES = [
  { title: 'Create a Request (2:05)', url: '#', desc: 'Quick walkthrough for creating requests.' },
  { title: 'Using the Master Calendar (3:40)', url: '#', desc: 'How to book and manage resources.' }
];

export default function HelpPage() {
  const { t } = useTranslation();
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    // Mock sending - just simulate success
    console.log('Mock send contact', { contactName, contactEmail, contactMsg });
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <div className="page-content help-page">
      <SectionHeader title="Help & Support" subtitle="Guides, FAQs and contact" />

      <div className="card">
        <div className="card-header">{t('Getting started')}</div>
        <div className="card-content">
          <p>{t('If you need help using GSUS, start with these resources:')}</p>
          <ul>
            <li><strong>{t('All Requests')}</strong> — {t('create and manage requests and feedback')}</li>
            <li><strong>{t('Master Calendar')}</strong> — {t('view bookings and schedule resources')}</li>
            <li><strong>{t('Analytics')}</strong> — {t('review performance metrics and feedback')}</li>
          </ul>
        </div>
      </div>

      <div className="card faq-card">
        <div className="card-header">Frequently asked questions</div>
        <div className="card-content">
          <ul className="faq-list">
            {FAQS.map((f, i) => (
              <li key={i} className="faq-item">
                <div className="faq-q">{f.q}</div>
                <div className="faq-a">{f.a}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Troubleshooting</div>
        <div className="card-content">
          {TROUBLESHOOTING.map((t, i) => (
            <div key={i} className="troubleshoot-block">
              <div className="troubleshoot-title">{t.title}</div>
              <ol>
                {t.steps.map((s, n) => <li key={n}>{s}</li>)}
              </ol>
            </div>
          ))}
        </div>
      </div>

      <div className="card video-card">
        <div className="card-header">Video Guides</div>
        <div className="card-content video-list">
          {VIDEO_GUIDES.map((v, i) => (
            <div key={i} className="video-item">
              <div className="video-title"><a href={v.url}>{v.title}</a></div>
              <div className="video-desc">{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card contact-card">
        <div className="card-header">{t('Contact support')}</div>
        <div className="card-content">
          <form onSubmit={handleSend} className="contact-form">
            <div className="form-row">
              <input placeholder={t('Your name')} value={contactName} onChange={e => setContactName(e.target.value)} />
            </div>
            <div className="form-row">
              <input placeholder={t('Your email')} value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
            </div>
            <div className="form-row">
              <textarea placeholder={t('How can we help?')} value={contactMsg} onChange={e => setContactMsg(e.target.value)} />
            </div>
            <div className="form-row">
              <button className="btn btn-primary" type="submit">{t('Send')}</button>
              {sent && <span className="sent-ok">{t('Message queued (mock)')}</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
