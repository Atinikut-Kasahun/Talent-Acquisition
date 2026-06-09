import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import '../../careers.css';
import type { Job } from './LandingPage';

const API_URL = import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_URL}/api`;

interface ApplyForm {
  full_name: string;
  phone: string;
  email: string;
  gender: string;
  location: string;
  relocate: string;
  education_level: string;
  field_of_study: string;
  institution: string;
  certifications: string;
  graduation_year: string;
  cgpa: string;
  experience_years: string;
  recent_employer: string;
  responsibilities: string;
  skills: string;
  contract_type: string;
  preferred_position: string;
  expected_salary: string;
  interest_reason: string;
  notice_period: string;
  start_date: string;
  comments: string;
  acknowledge: boolean;
  confirmed: boolean;
}

const emptyForm: ApplyForm = {
  full_name: '',
  phone: '',
  email: '',
  gender: '',
  location: '',
  relocate: '',
  education_level: '',
  field_of_study: '',
  institution: '',
  certifications: '',
  graduation_year: '',
  cgpa: '',
  experience_years: '',
  recent_employer: '',
  responsibilities: '',
  skills: '',
  contract_type: '',
  preferred_position: '',
  expected_salary: '',
  interest_reason: '',
  notice_period: '',
  start_date: '',
  comments: '',
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
    if (!form.full_name || !form.phone || !form.email) {
      setError('Please fill in your full name, phone number, and email address.');
      return;
    }
    if (!form.gender || !form.location || !form.relocate) {
      setError('Please complete your personal and contact information.');
      return;
    }
    if (
      !form.education_level ||
      !form.field_of_study ||
      !form.institution ||
      !form.graduation_year ||
      !form.cgpa
    ) {
      setError('Please complete your education and qualifications.');
      return;
    }
    if (!form.experience_years || !form.contract_type || !form.preferred_position) {
      setError('Please complete your work experience and role-specific screening fields.');
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
      formData.append('full_name', form.full_name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('gender', form.gender);
      formData.append('location', form.location);
      formData.append('relocate', form.relocate);
      formData.append('education_level', form.education_level);
      formData.append('field_of_study', form.field_of_study);
      formData.append('institution', form.institution);
      formData.append('certifications', form.certifications);
      formData.append('graduation_year', form.graduation_year);
      formData.append('cgpa', form.cgpa);
      formData.append('experience_years', form.experience_years);
      formData.append('recent_employer', form.recent_employer);
      formData.append('responsibilities', form.responsibilities);
      formData.append('skills', form.skills);
      formData.append('contract_type', form.contract_type);
      formData.append('preferred_position', form.preferred_position);
      formData.append('expected_salary', form.expected_salary);
      formData.append('interest_reason', form.interest_reason);
      formData.append('notice_period', form.notice_period);
      formData.append('start_date', form.start_date);
      formData.append('comments', form.comments);
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
          
          <div className="dropdown">
            <button className="nav-link" type="button">
              Internship Program
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            <div className="dropdown-menu">
              <div>
                <div className="dd-section-title">Details</div>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Overview</div>
                    <div className="dd-item-desc">Nurturing the next generation of talent</div>
                  </div>
                </a>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Requirements</div>
                    <div className="dd-item-desc">Bachelor's or Master's degree program</div>
                  </div>
                </a>
              </div>
              <div>
                <div className="dd-section-title">Process</div>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Application Process</div>
                    <div className="dd-item-desc">March for our summer cohort</div>
                  </div>
                </a>
                <a className="dd-item" href="/careers#positions">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Apply Now</div>
                    <div className="dd-item-desc">Submit your application today</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="dropdown">
            <button className="nav-link" type="button">
              How We Work
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            <div className="dropdown-menu">
              <div>
                <div className="dd-section-title">Journey</div>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Application & Screening</div>
                    <div className="dd-item-desc">First steps in the process</div>
                  </div>
                </a>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Written Exam & Interview</div>
                    <div className="dd-item-desc">Demonstrating your skills</div>
                  </div>
                </a>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Offer & Onboarding</div>
                    <div className="dd-item-desc">Welcome to the team</div>
                  </div>
                </a>
              </div>
              <div>
                <div className="dd-section-title">Philosophy</div>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Transparency</div>
                    <div className="dd-item-desc">Informed at every stage</div>
                  </div>
                </a>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Why Droga</div>
                    <div className="dd-item-desc">Fair, transparent, merit-based</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="dropdown">
            <button className="nav-link" type="button">
              About Us
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            <div className="dropdown-menu">
              <div>
                <div className="dd-section-title">Identity</div>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Company Mission</div>
                    <div className="dd-item-desc">Excellence in pharma & healthcare</div>
                  </div>
                </a>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Impact</div>
                    <div className="dd-item-desc">Advancing healthcare across Ethiopia</div>
                  </div>
                </a>
              </div>
              <div>
                <div className="dd-section-title">Values</div>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Trust</div>
                    <div className="dd-item-desc">Integrity and transparency</div>
                  </div>
                </a>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12h20M12 2v20"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Innovation</div>
                    <div className="dd-item-desc">Seeking better ways to serve</div>
                  </div>
                </a>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Patient-Centricity</div>
                    <div className="dd-item-desc">Patients at the heart of all we do</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="dropdown">
            <button className="nav-link" type="button">
              Contact Us
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            <div className="dropdown-menu">
              <div>
                <div className="dd-section-title">Support</div>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Technical Support</div>
                    <div className="dd-item-desc">support@drogagroup.com</div>
                  </div>
                </a>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Inquiries</div>
                    <div className="dd-item-desc">careers@drogagroup.com</div>
                  </div>
                </a>
              </div>
              <div>
                <div className="dd-section-title">Response</div>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Response Promise</div>
                    <div className="dd-item-desc">Within 48 hours</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <a className="nav-link" href="/careers#positions" onClick={(e) => { e.preventDefault(); navigate('/careers#positions'); }}>
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
              {job.department}
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
            / <strong>{job.department}</strong>
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
                    <div className="form-group">
                      <div className="form-question">SECTION 1: Personal & Contact Information</div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Full Name (Required)</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Full Name"
                        value={form.full_name}
                        onChange={(e) => handleField('full_name', e.target.value)}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Phone Number (Required)</label>
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
                    </div>

                    <div className="form-group">
                      <div className="form-question">Gender (Required)</div>
                      <div className="radio-grid">
                        {['Male', 'Female'].map((option) => (
                          <label key={option} className="radio-opt">
                            <input
                              type="radio"
                              name="gender"
                              value={option}
                              checked={form.gender === option}
                              onChange={() => handleField('gender', option)}
                            />{' '}
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Your Current Location / Home Location</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="e.g., Piyasa, Megenagna, Adama, Hawassa, 4 Kilo"
                        value={form.location}
                        onChange={(e) => handleField('location', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <div className="form-question">Are you open to relocate from your home location? (Required)</div>
                      <div className="radio-grid">
                        {['Yes', 'No'].map((option) => (
                          <label key={option} className="radio-opt">
                            <input
                              type="radio"
                              name="relocate"
                              value={option}
                              checked={form.relocate === option}
                              onChange={() => handleField('relocate', option)}
                            />{' '}
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>

                    <hr className="form-divider" />

                    <div className="form-group">
                      <div className="form-question">SECTION 2: Education & Qualifications</div>
                    </div>

                    <div className="form-group">
                      <div className="form-question">Highest Level of Education (Required)</div>
                      <div className="radio-grid-col">
                        {[
                          'Doctorate / Ph.D.',
                          "Master's Degree",
                          "Bachelor's Degree",
                          'Diploma',
                          'High School Diploma / Secondary School Certificate',
                        ].map((option) => (
                          <label key={option} className="radio-opt">
                            <input
                              type="radio"
                              name="education_level"
                              value={option}
                              checked={form.education_level === option}
                              onChange={() => handleField('education_level', option)}
                            />{' '}
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Field of Study (Required)</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="e.g., Pharmacy, Business, IT"
                          value={form.field_of_study}
                          onChange={(e) => handleField('field_of_study', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Name Of Institution (Required)</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Institution Name"
                          value={form.institution}
                          onChange={(e) => handleField('institution', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Certifications / Licenses</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Certifications / Licenses"
                          value={form.certifications}
                          onChange={(e) => handleField('certifications', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Graduation Year (Required)</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="e.g., 2024"
                          value={form.graduation_year}
                          onChange={(e) => handleField('graduation_year', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">CGPA (Required)</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="e.g., 3.5"
                        value={form.cgpa}
                        onChange={(e) => handleField('cgpa', e.target.value)}
                      />
                    </div>

                    <hr className="form-divider" />

                    <div className="form-group">
                      <div className="form-question">SECTION 3: Work Experience</div>
                    </div>

                    <div className="form-group">
                      <div className="form-question">Years of Relevant Experience (Required)</div>
                      <div className="radio-grid-col">
                        {[
                          'Above 10 Years',
                          '6 Years to 9 Years',
                          '3 Years to 5 Years',
                          '1 Years to 2 Years',
                          'Less than 1 Year',
                          'No Experience',
                        ].map((option) => (
                          <label key={option} className="radio-opt">
                            <input
                              type="radio"
                              name="experience_years"
                              value={option}
                              checked={form.experience_years === option}
                              onChange={() => handleField('experience_years', option)}
                            />{' '}
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Most Recent Employer</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Most Recent Employer"
                        value={form.recent_employer}
                        onChange={(e) => handleField('recent_employer', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Key Responsibilities in Your Last Role</label>
                      <textarea
                        className="form-input"
                        rows={4}
                        placeholder="Describe your key responsibilities"
                        value={form.responsibilities}
                        onChange={(e) => handleField('responsibilities', e.target.value)}
                      />
                    </div>

                    <hr className="form-divider" />

                    <div className="form-group">
                      <div className="form-question">SECTION 4: Skills & Tools</div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Technical Skills (e.g., software, tools)</label>
                      <textarea
                        className="form-input"
                        rows={4}
                        placeholder="List your technical skills"
                        value={form.skills}
                        onChange={(e) => handleField('skills', e.target.value)}
                      />
                    </div>

                    <hr className="form-divider" />

                    <div className="form-group">
                      <div className="form-question">SECTION 5: Role-Specific Screening</div>
                    </div>

                    <div className="form-group">
                      <div className="form-question">Contract Type (Required)</div>
                      <div className="radio-grid">
                        {['Permanent', 'Contract', 'Part-Time'].map((option) => (
                          <label key={option} className="radio-opt">
                            <input
                              type="radio"
                              name="contract_type"
                              value={option}
                              checked={form.contract_type === option}
                              onChange={() => handleField('contract_type', option)}
                            />{' '}
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Preferred job position you want to join (Required)</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="e.g., Jr. pharmacist, Dispensary, Regulatory affairs"
                        value={form.preferred_position}
                        onChange={(e) => handleField('preferred_position', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Expected Salary Range</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="e.g., 20,000 - 30,000"
                        value={form.expected_salary}
                        onChange={(e) => handleField('expected_salary', e.target.value)}
                      />
                    </div>

                    <hr className="form-divider" />

                    <div className="form-group">
                      <div className="form-question">SECTION 6: Situational Questions</div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Why are you interested in our company?</label>
                      <textarea
                        className="form-input"
                        rows={4}
                        placeholder="Explain why you are interested in our company"
                        value={form.interest_reason}
                        onChange={(e) => handleField('interest_reason', e.target.value)}
                      />
                    </div>

                    <hr className="form-divider" />

                    <div className="form-group">
                      <div className="form-question">SECTION 7: Document Uploads</div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Upload Resume (CV)</label>
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

                    <div className="form-group">
                      <div className="form-question">SECTION 8: Availability</div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Notice Period</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="e.g., 2 weeks"
                          value={form.notice_period}
                          onChange={(e) => handleField('notice_period', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Preferred Start Date</label>
                        <input
                          className="form-input"
                          type="date"
                          value={form.start_date}
                          onChange={(e) => handleField('start_date', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Any Comments</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Any additional information"
                        value={form.comments}
                        onChange={(e) => handleField('comments', e.target.value)}
                      />
                    </div>

                    <hr className="form-divider" />

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

                    <div className="form-group">
                      <div className="form-question">Please double-check all the information provided above.</div>
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
            <div className="footer-col-title">Droga Group</div>
            <a className="footer-link" href="/careers#about">About Us</a>
            <a className="footer-link" href="#">Our Mission</a>
            <a className="footer-link" href="#">Values</a>
            <a className="footer-link" href="/careers#contact">Contact Us</a>
          </div>
          <div>
            <div className="footer-col-title">Careers</div>
            <a className="footer-link" href="/careers#positions">Open Positions</a>
            <a className="footer-link" href="/careers#internship">Internship Program</a>
            <a className="footer-link" href="#">Talent Pool</a>
          </div>
          <div>
            <div className="footer-col-title">Resources</div>
            <a className="footer-link" href="/careers#how-we-work">How We Work</a>
            <a className="footer-link" href="#">FAQ</a>
            <a className="footer-link" href="#">Life at Droga</a>
            <a className="footer-link" href="#">Help Center</a>
          </div>
          <div>
            <div className="footer-col-title">Legal & Social</div>
            <a className="footer-link" href="#">Privacy Policy</a>
            <a className="footer-link" href="#">Terms of Service</a>
            <a className="footer-link" href="#">LinkedIn</a>
            <a className="footer-link" href="#">Telegram</a>
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
