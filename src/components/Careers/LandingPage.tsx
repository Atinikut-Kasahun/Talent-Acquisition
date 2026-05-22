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
  dept: string;
  type: string;
  about: string;
  whatYouDo: string[];
  aboutYou: string[];
  bonus: string[];
  salary: string;
}

const API_URL = 'http://127.0.0.1:8000/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [locOpen, setLocOpen] = useState(true);
  const [deptOpen, setDeptOpen] = useState(true);

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
        const deptMatch = deptFilter === 'all' || job.dept === deptFilter;
        return locMatch && deptMatch;
      }),
    [locationFilter, deptFilter, jobs]
  );

  return (
    <div className="careers-theme">
      {/* Navigation */}
      <nav>
        <a className="nav-logo" href="/careers">
          <div className="nav-logo-mark">
            <img src="/logo.svg" alt="Droga Group" />
          </div>
          Droga Group
        </a>

        <div className="nav-links">
          <div className="dropdown">
            <button className="nav-link" type="button">
              Products
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="dropdown-menu">
              <div>
                <div className="dd-section-title">AI Cloud</div>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="dd-item-name">AI Gateway</div>
                    <div className="dd-item-desc">One endpoint, all your models</div>
                  </div>
                </a>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                    </svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Sandbox</div>
                    <div className="dd-item-desc">Isolated, safe code execution</div>
                  </div>
                </a>
              </div>
              <div>
                <div className="dd-section-title">Core Platform</div>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                    </svg>
                  </div>
                  <div>
                    <div className="dd-item-name">CI/CD</div>
                    <div className="dd-item-desc">Helping teams ship 6× faster</div>
                  </div>
                </a>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20" />
                    </svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Content Delivery</div>
                    <div className="dd-item-desc">Fast, scalable, and reliable</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="dropdown">
            <button className="nav-link" type="button">
              Candidates
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="dropdown-menu">
              <div>
                <div className="dd-section-title">How to Apply</div>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Application Process</div>
                    <div className="dd-item-desc">Steps to submit your application</div>
                  </div>
                </a>
                <a className="dd-item" href="#">
                  <div className="dd-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="dd-item-name">Benefits</div>
                    <div className="dd-item-desc">Compensation and perks</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <a className="nav-link" href="#about">About</a>
          <a className="nav-link" href="#positions">Open Positions</a>
        </div>

        <div className="nav-right">
          <button className="btn-login" onClick={() => navigate('/signin')}>Log In</button>
          <button className="btn-signup" onClick={() => navigate('/signin')}>Sign Up</button>
        </div>
      </nav>

      {/* Hero */}
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

      {/* Jobs Section */}
      <section className="jobs-section" id="positions">
        <div className="jobs-container">
          <aside className="filters-col">
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
                    onClick={() => setLocationFilter(option.value)}
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
                    onClick={() => setDeptFilter(option.value)}
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

      {/* Footer */}
      <footer>
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
            <a className="footer-link" href="#">Observability</a>
            <a className="footer-link" href="#">AI Gateway <span className="badge-new">NEW</span></a>
            <a className="footer-link" href="#">Droga Agent <span className="badge-new">NEW</span></a>
          </div>
          <div>
            <div className="footer-col-title">Secure</div>
            <a className="footer-link" href="#">Platform security</a>
            <a className="footer-link" href="#">Web Application Firewall</a>
            <a className="footer-link" href="#">Bot management</a>
            <a className="footer-link" href="#">BotID</a>
            <a className="footer-link" href="#">Sandbox <span className="badge-new">NEW</span></a>
          </div>
          <div>
            <div className="footer-col-title">Learn</div>
            <a className="footer-link" href="#">Docs</a>
            <a className="footer-link" href="#">Blog</a>
            <a className="footer-link" href="#">Changelog</a>
            <a className="footer-link" href="#">Knowledge Base</a>
            <a className="footer-link" href="#">Academy</a>
            <a className="footer-link" href="#">Community</a>
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
