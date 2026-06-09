import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import CareersGlobe from './CareersGlobe';
import '../../careers.css';

const locationOptions = [
  { label: 'All locations', value: 'all' },
  { label: 'Megenagna', value: 'Megenagna' },
  { label: 'Bole', value: 'Bole' },
  { label: 'Kebena', value: 'Kebena' },
  { label: 'Summit', value: 'Summit' },
  { label: 'Rufael', value: 'Rufael' },
  { label: 'Shola', value: 'Shola' },
  { label: 'Bambis', value: 'Bambis' },
  { label: 'Jemo', value: 'Jemo' },
  { label: 'Kazanchis', value: 'Kazanchis' }
];

const deptOptions = [
  { label: 'All departments', value: 'all' },
  { label: 'Sales', value: 'Sales' },
  { label: 'Engineering', value: 'Engineering' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Legal', value: 'Legal' },
  { label: 'Design', value: 'Design' }
];

export interface Job {
  id: number;
  title: string;
  location: string;
  department: string;
  type: string;
  about: string;
  whatYouDo: string[];
  aboutYou: string[];
  bonus: string[];
  salary: string;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_URL}/api`;

const LandingPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [locOpen, setLocOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);

  // Mobile states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
        setMobileFiltersOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_URL}/jobs`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const locMatch = locationFilter === 'all' || (job.location || '').includes(locationFilter);
        const deptMatch = deptFilter === 'all' || job.department === deptFilter;
        return locMatch && deptMatch;
      }),
    [locationFilter, deptFilter, jobs]
  );

  const activeFilterCount = (locationFilter !== 'all' ? 1 : 0) + (deptFilter !== 'all' ? 1 : 0);

  return (
    <div className="careers-theme">

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav>
        <a 
          className="nav-logo" 
          href="/careers"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.history.pushState(null, '', '/careers');
          }}
        >
          <div className="nav-logo-mark">
            <img src="/logo.svg" alt="Droga Group" />
          </div>
          Droga Group
        </a>

        {/* Desktop nav links */}
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
                <a className="dd-item" href="#positions">
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
          
          <a className="nav-link" href="#positions">Open Positions</a>
        </div>

        {/* Desktop nav right */}
        <div className="nav-right">
          <button className="btn-login" onClick={() => navigate('/signin')}>Log In</button>
          <button className="btn-signup nav-signup-desktop" onClick={() => navigate('/signin')}>Sign Up</button>
        </div>

        {/* Mobile hamburger button */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          type="button"
        >
          {mobileMenuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile menu drawer */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-links">
          <a className="mobile-nav-link" href="#" onClick={() => setMobileMenuOpen(false)}>Internship Program</a>
          <a className="mobile-nav-link" href="#" onClick={() => setMobileMenuOpen(false)}>How We Work</a>
          <a className="mobile-nav-link" href="#" onClick={() => setMobileMenuOpen(false)}>About Us</a>
          <a className="mobile-nav-link" href="#" onClick={() => setMobileMenuOpen(false)}>Contact Us</a>
          <a className="mobile-nav-link" href="#positions" onClick={() => setMobileMenuOpen(false)}>Open Positions</a>
        </div>
        <div className="mobile-menu-actions">
          <button className="btn-login mobile-btn-full" onClick={() => { navigate('/signin'); setMobileMenuOpen(false); }}>Log In</button>
          <button className="btn-signup mobile-btn-full" onClick={() => { navigate('/signin'); setMobileMenuOpen(false); }}>Sign Up</button>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="hero" style={{ position: 'relative' }}>
        <div className="hero-grid" />
        <CareersGlobe />

        {/* Intersection Markers */}
        <div style={{ position: 'absolute', inset: 0, width: '100%', maxWidth: 1280, margin: '0 auto', pointerEvents: 'none', zIndex: 10 }}>
          <div className="plus-mark" style={{ top: -7, left: 41 }} />
          <div className="plus-mark" style={{ bottom: -7, left: 321 }} />
        </div>

        <div className="hero-content">
          <h1 className="hero-title">Join us<br />to Ship what's Next.</h1>
          <a className="btn-open-positions" href="#positions">
            Open Positions
          </a>
        </div>
      </section>

      {/* ── Jobs Section ───────────────────────────────────────────────────── */}
      <section className="jobs-section" id="positions">

          {/* Mobile filter toggle bar */}
          <div className="mobile-filter-bar">
            <button
              className="mobile-filter-toggle"
              onClick={() => setMobileFiltersOpen((o) => !o)}
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="20" y2="12" />
                <line x1="12" y1="18" x2="20" y2="18" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                className="mobile-filter-clear"
                onClick={() => { setLocationFilter('all'); setDeptFilter('all'); }}
                type="button"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="jobs-container">
            {/* Filters sidebar — hidden on mobile unless toggled */}
            <aside className={`filters-col ${mobileFiltersOpen ? 'mobile-open' : ''}`}>
              {/* Mobile close button */}
              <div className="mobile-filter-header">
                <span>Filters</span>
                <button className="mobile-filter-close" onClick={() => setMobileFiltersOpen(false)} type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="filter-group">
                <div
                  className={`filter-header ${locOpen ? 'open' : ''}`}
                  onClick={() => setLocOpen((open) => !open)}
                >
                  Location
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <div className={`filter-options ${locOpen ? 'open' : ''}`}>
                  {locationOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`filter-option ${locationFilter === option.value ? 'active' : ''}`}
                      onClick={() => { setLocationFilter(option.value); if (window.innerWidth < 768) setMobileFiltersOpen(false); }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <div
                  className={`filter-header ${deptOpen ? 'open' : ''}`}
                  onClick={() => setDeptOpen((open) => !open)}
                >
                  Department
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <div className={`filter-options ${deptOpen ? 'open' : ''}`}>
                  {deptOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`filter-option ${deptFilter === option.value ? 'active' : ''}`}
                      onClick={() => { setDeptFilter(option.value); if (window.innerWidth < 768) setMobileFiltersOpen(false); }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div className="jobs-col">
              <div className="jobs-header">Open Positions at Droga Group</div>
              <div id="job-list">
                {loading ? (
                  <div style={{ padding: 48, color: '#888', fontSize: 15 }}>Loading positions...</div>
                ) : filteredJobs.length === 0 ? (
                  <div style={{ padding: 48, color: '#888', fontSize: 15 }}>
                    No positions match your filters.
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="job-item"
                      onClick={() => navigate(`/careers/jobs/${job.id}`, { state: { job } })}
                    >
                      <div>
                        <div className="job-title">{job.title}</div>
                        <div className="job-location">{job.location}</div>
                      </div>
                      <button
                        className="btn-read-more"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/careers/jobs/${job.id}`, { state: { job } });
                        }}
                      >
                        Read more
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

      {/* Footer spacer */}
      <div className="footer-spacer" />

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer>
        <div className="footer-grid">
          <div>
            <div className="footer-col-title">Droga Group</div>
            <a className="footer-link" href="#about">About Us</a>
            <a className="footer-link" href="#">Our Mission</a>
            <a className="footer-link" href="#">Values</a>
            <a className="footer-link" href="#contact">Contact Us</a>
          </div>
          <div>
            <div className="footer-col-title">Careers</div>
            <a className="footer-link" href="#positions">Open Positions</a>
            <a className="footer-link" href="#internship">Internship Program</a>
            <a className="footer-link" href="#">Talent Pool</a>
          </div>
          <div>
            <div className="footer-col-title">Resources</div>
            <a className="footer-link" href="#how-we-work">How We Work</a>
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

export default LandingPage;
