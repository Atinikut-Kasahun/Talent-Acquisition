import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import '../../careers.css';
import type { Job } from './LandingPage';

const API_URL = 'http://127.0.0.1:8000/api';

interface ApplyForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  country: string;
  visa: string;
  work_auth: string;
  heard_from: string;
  acknowledge: boolean;
  confirmed: boolean;
}

const emptyForm: ApplyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  linkedin: '',
  portfolio: '',
  country: '',
  visa: '',
  work_auth: '',
  heard_from: '',
  acknowledge: false,
  confirmed: false,
};

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>((location.state as any)?.job || null);
  const [loading, setLoading] = useState(!job);
  const [form, setForm] = useState<ApplyForm>(emptyForm);
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!job && id) {
      fetch(`${API_URL}/jobs/${id}`)
        .then((r) => r.json())
        .then((data) => setJob(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, job]);

  const handleField = (field: keyof ApplyForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      setError('Please fill in your first name, last name, and email.');
      return;
    }
    if (!form.acknowledge || !form.confirmed) {
      setError('Please acknowledge and confirm the required checkboxes.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('first_name', form.first_name);
      formData.append('last_name', form.last_name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('linkedin', form.linkedin);
      formData.append('portfolio', form.portfolio);
      formData.append('country', form.country);
      formData.append('visa', form.visa);
      formData.append('work_auth', form.work_auth);
      formData.append('heard_from', form.heard_from);
      if (resume) formData.append('resume', resume);

      const res = await fetch(`${API_URL}/jobs/${id}/apply`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Submission failed. Please try again.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="careers-theme" style={{ padding: 80, textAlign: 'center', color: '#888' }}>
        Loading job...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="careers-theme" style={{ padding: 80, textAlign: 'center', color: '#888' }}>
        Job not found.{' '}
        <a href="/careers" onClick={(e) => { e.preventDefault(); navigate('/careers'); }}>
          Back to Careers
        </a>
      </div>
    );
  }

  return (
    <div className="careers-theme">
      {/* Navbar */}
      <nav>
        <a className="nav-logo" href="/careers" onClick={(e) => { e.preventDefault(); navigate('/careers'); }}>
          <div className="nav-logo-mark">
            <img src="/logo.svg" alt="Droga Group" />
          </div>
          Droga Group
        </a>
        <div className="nav-links">
          <a className="nav-link" href="/careers" onClick={(e) => { e.preventDefault(); navigate('/careers'); }}>
            Careers
          </a>
          <a className="nav-link" href="#positions" onClick={(e) => { e.preventDefault(); navigate('/careers#positions'); }}>
            Open Positions
          </a>
        </div>
        <div className="nav-right">
          <button className="btn-login" onClick={() => navigate('/signin')}>Log In</button>
          <button className="btn-signup" onClick={() => navigate('/signin')}>Sign Up</button>
        </div>
      </nav>

      {/* Job Hero */}
      <div className="jd-hero">
        <div className="jd-grid-bg" />
        <div className="jd-hero-inner">
          <button
            className="btn-back"
            type="button"
            onClick={() => navigate('/careers')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Careers
          </button>
          <div className="jd-meta">
            <div className="jd-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              {job.dept}
            </div>
            <div className="jd-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 010 20" />
                <path d="M12 2a15.3 15.3 0 000 20" />
              </svg>
              {(job.location || '').split(',')[0]}
            </div>
            <div className="jd-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {job.type}
            </div>
          </div>
          <h1 className="jd-title">{job.title}</h1>
          <div className="jd-breadcrumb">
            <a href="/careers" onClick={(e) => { e.preventDefault(); navigate('/careers'); }}>
              Careers
            </a>{' '}
            / <strong>{job.dept}</strong>
          </div>
        </div>
      </div>

      {/* Job Body */}
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="jd-body">
          <div className="jd-content">
            {/* About Droga */}
            <div className="jd-section" style={{ borderTop: 'none', paddingTop: 40 }}>
              <div className="jd-section-title">About Droga Group:</div>
              <p className="jd-text">
                Droga Group gives developers the tools and cloud infrastructure to build, scale, and
                secure a faster, more personalized web. As the team behind v0, Next.js, and AI SDK,
                Droga Group helps customers like Ramp, Supreme, PayPal, and Under Armour build for
                the AI-native web.
              </p>
              <p className="jd-text">
                Our mission is to enable the world to ship the best products. That starts with
                creating a place where everyone can do their best work. Whether you're building on
                our platform, supporting our customers, or shaping our story: You can just ship
                things.
              </p>
            </div>

            {/* About the Role */}
            <div className="jd-section">
              <div className="jd-section-title">About the Role:</div>
              <p className="jd-text" dangerouslySetInnerHTML={{ __html: job.about }} />
              <p className="jd-text">
                If you're based within a pre-determined commuting distance of one of our offices
                (SF, NY, London, or Berlin), the role includes in-office anchor days on Monday,
                Tuesday, and Friday. If you're located beyond that distance, the role is fully
                remote.
              </p>
            </div>

            {/* What You Will Do */}
            {job.whatYouDo && job.whatYouDo.length > 0 && (
              <div className="jd-section">
                <div className="jd-section-title">What You Will Do:</div>
                <ul className="jd-list">
                  {job.whatYouDo.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* About You */}
            {job.aboutYou && job.aboutYou.length > 0 && (
              <div className="jd-section">
                <div className="jd-section-title">About You:</div>
                <ul className="jd-list">
                  {job.aboutYou.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bonus */}
            {job.bonus && job.bonus.length > 0 && (
              <div className="jd-section">
                <div className="jd-section-title">Bonus If You:</div>
                <ul className="jd-list">
                  {job.bonus.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            <div className="jd-section">
              <div className="jd-section-title">Benefits:</div>
              <ul className="jd-list">
                <li>Competitive compensation package, including equity.</li>
                <li>Inclusive Healthcare Package.</li>
                <li>Learn and Grow – we provide mentorship and send you to events that help you build your network and skills.</li>
                <li>Flexible Time Off.</li>
                <li>We will provide you the gear you need to do your role, and a WFH budget for you to outfit your space as needed.</li>
              </ul>
              {job.salary && (
                <p className="jd-text" style={{ marginTop: 20 }}>
                  {job.salary}
                </p>
              )}
            </div>

            {/* Application Form */}
            <div className="apply-section">
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="apply-title" style={{ color: '#22c55e' }}>✓ Application Submitted!</div>
                  <div className="apply-subtitle">
                    Thank you for applying for the <strong>{job.title}</strong> role. We'll be in touch soon.
                  </div>
                  <button
                    className="btn-submit"
                    style={{ marginTop: 24 }}
                    onClick={() => navigate('/careers')}
                  >
                    Back to Careers
                  </button>
                </div>
              ) : (
                <>
                  <div className="apply-title">Apply Now.</div>
                  <div className="apply-subtitle">
                    Tell us why you'd be a good fit for the {job.title} role.
                  </div>

                  {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                      {error}
                    </div>
                  )}

                  <div className="form-wrapper">
                    {/* Name Row */}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="First Name"
                          value={form.first_name}
                          onChange={(e) => handleField('first_name', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Last Name"
                          value={form.last_name}
                          onChange={(e) => handleField('last_name', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Contact Row */}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                          className="form-input"
                          type="email"
                          placeholder="you@email.com"
                          value={form.email}
                          onChange={(e) => handleField('email', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <div className="phone-wrap">
                          <div className="phone-flag">🇪🇹</div>
                          <input
                            className="phone-input"
                            type="tel"
                            placeholder="+251 911 000 000"
                            value={form.phone}
                            onChange={(e) => handleField('phone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Resume */}
                    <div className="form-group">
                      <label className="form-label">Resume (Optional)</label>
                      <label className="upload-box" style={{ cursor: 'pointer' }}>
                        <input
                          type="file"
                          accept=".pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => setResume(e.target.files?.[0] || null)}
                        />
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {resume ? resume.name : 'Upload your resume'}
                      </label>
                      <div className="upload-hint">Resume should be a PDF under 3.5MB.</div>
                    </div>

                    <hr className="form-divider" />

                    {/* Country */}
                    <div className="form-group">
                      <div className="form-question">
                        Are you currently based in any of these countries?
                      </div>
                      <div className="radio-grid">
                        {['United States', 'Germany', 'United Kingdom', 'Argentina', 'Australia', 'Canada', 'India', 'Japan', 'Ethiopia', 'Other'].map((country) => (
                          <label key={country} className="radio-opt">
                            <input
                              type="radio"
                              name="country"
                              value={country}
                              checked={form.country === country}
                              onChange={() => handleField('country', country)}
                            />{' '}
                            {country}
                          </label>
                        ))}
                      </div>
                    </div>

                    <hr className="form-divider" />

                    {/* Visa */}
                    <div className="form-group">
                      <div className="form-question">Will you require Visa Sponsorship now, or in the future?</div>
                      <div className="radio-grid">
                        {['Yes', 'No'].map((answer) => (
                          <label key={answer} className="radio-opt">
                            <input
                              type="radio"
                              name="visa"
                              value={answer}
                              checked={form.visa === answer}
                              onChange={() => handleField('visa', answer)}
                            />{' '}
                            {answer}
                          </label>
                        ))}
                      </div>
                    </div>

                    <hr className="form-divider" />

                    {/* Work Authorization */}
                    <div className="form-group">
                      <div className="form-question">
                        Your authorization to work in the country where you live.
                      </div>
                      <div className="radio-grid-col">
                        {[
                          'I am authorized to work in the country due to my nationality',
                          'I am authorized to work in the country based on a valid work permit and do not need a company to sponsor my visa',
                          'I am authorized to work in the country based on a valid work permit which needs to be sponsored by the company I work for',
                          'I am not authorized to work in the country and need visa support',
                          'Other',
                        ].map((option) => (
                          <label key={option} className="radio-opt">
                            <input
                              type="radio"
                              name="auth"
                              value={option}
                              checked={form.work_auth === option}
                              onChange={() => handleField('work_auth', option)}
                            />{' '}
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>

                    <hr className="form-divider" />

                    {/* Privacy */}
                    <div className="form-group">
                      <div className="privacy-note">
                        By submitting my application, I acknowledge that I have read and understand Droga Group's{' '}
                        <a className="privacy-link" href="#">Job Applicant Privacy Notice ↗</a>
                      </div>
                      <label className="radio-opt" style={{ marginTop: 10 }}>
                        <input
                          type="checkbox"
                          checked={form.acknowledge}
                          onChange={(e) => handleField('acknowledge', e.target.checked)}
                        />{' '}
                        Acknowledge/Confirm
                      </label>
                    </div>

                    <hr className="form-divider" />

                    {/* Accuracy */}
                    <div className="form-group">
                      <div className="form-question">
                        Please double-check all the information provided above.
                      </div>
                      <label className="radio-opt">
                        <input
                          type="checkbox"
                          checked={form.confirmed}
                          onChange={(e) => handleField('confirmed', e.target.checked)}
                        />{' '}
                        I have reviewed and confirmed that all the information provided is accurate and complete.
                      </label>
                    </div>

                    <hr className="form-divider" />

                    {/* Heard From */}
                    <div className="form-group">
                      <div className="form-question">Where did you first hear about this role?</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
                        {[
                          'Other job boards',
                          'LLMs (ChatGPT, etc.)',
                          "I'm a Droga Group customer",
                          'Referral from a Droga customer',
                          'Referral from a Droga team member',
                          'Social media (X, Instagram, YouTube, etc.)',
                          'Other Content (news articles, podcasts, blogs)',
                          'Developer communities (GitHub, Hacker News, Reddit, etc.)',
                          'Other',
                        ].map((source) => (
                          <label key={source} className="radio-opt">
                            <input
                              type="radio"
                              name="source"
                              value={source}
                              checked={form.heard_from === source}
                              onChange={() => handleField('heard_from', source)}
                            />{' '}
                            {source}
                          </label>
                        ))}
                      </div>
                    </div>

                    <hr className="form-divider" />

                    {/* Social */}
                    <div className="form-group">
                      <div className="form-question">Optionally, include links to your social media profiles.</div>
                      <div className="form-row" style={{ marginTop: 8 }}>
                        <div className="form-group">
                          <label className="form-label">LinkedIn</label>
                          <div className="linkedin-wrap">
                            <div className="linkedin-prefix">linkedin.com/in/</div>
                            <input
                              className="linkedin-input"
                              type="text"
                              placeholder="handle"
                              value={form.linkedin}
                              onChange={(e) => handleField('linkedin', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Portfolio</label>
                          <div className="portfolio-wrap">
                            <div className="portfolio-prefix">https://</div>
                            <input
                              className="portfolio-input"
                              type="text"
                              placeholder="portfolio.com"
                              value={form.portfolio}
                              onChange={(e) => handleField('portfolio', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="form-divider" />

                    {/* Submit */}
                    <div className="submit-row">
                      <button
                        className="btn-submit"
                        type="button"
                        disabled={submitting}
                        onClick={handleSubmit}
                      >
                        {submitting ? 'Submitting...' : 'Submit Application'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="jd-sidebar">
            <a
              className="btn-apply"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('.apply-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Apply for Role
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 40 }}>
        <div className="footer-grid">
          <div>
            <div className="footer-col-title">Get Started</div>
            <a className="footer-link" href="#">Templates</a>
            <a className="footer-link" href="#">Supported frameworks</a>
            <a className="footer-link" href="#">Marketplace</a>
            <a className="footer-link" href="#">Domains</a>
          </div>
          <div>
            <div className="footer-col-title">Build</div>
            <a className="footer-link" href="#">Next.js on Droga</a>
            <a className="footer-link" href="#">Turborepo</a>
            <a className="footer-link" href="#">v0</a>
          </div>
          <div>
            <div className="footer-col-title">Scale</div>
            <a className="footer-link" href="#">Content delivery network</a>
            <a className="footer-link" href="#">Fluid compute</a>
            <a className="footer-link" href="#">CI/CD</a>
            <a className="footer-link" href="#">AI Gateway <span className="badge-new">NEW</span></a>
          </div>
          <div>
            <div className="footer-col-title">Secure</div>
            <a className="footer-link" href="#">Platform security</a>
            <a className="footer-link" href="#">Web Application Firewall</a>
            <a className="footer-link" href="#">Bot management</a>
          </div>
          <div>
            <div className="footer-col-title">Resources</div>
            <a className="footer-link" href="#">Pricing</a>
            <a className="footer-link" href="#">Customers</a>
            <a className="footer-link" href="#">Enterprise</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} Droga Group. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default JobDetail;
