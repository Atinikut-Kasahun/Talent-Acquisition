<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Branch;
use App\Models\JobPosting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        
        $pharma = \App\Models\Company::firstOrCreate([
            'slug' => 'droga-pharma'
        ], [
            'name' => 'Droga Pharma',
            'website' => 'https://pharma.droga-group.com',
            'is_active' => true,
        ]);
        $physio = \App\Models\Company::firstOrCreate([
            'slug' => 'droga-physio'
        ], [
            'name' => 'Droga Physiotherapy',
            'website' => 'https://physio.droga-group.com',
            'is_active' => true,
        ]);
        $diagnostics = \App\Models\Company::firstOrCreate([
            'slug' => 'droga-diagnostics'
        ], [
            'name' => 'Droga Diagnostics',
            'website' => 'https://diagnostics.droga-group.com',
            'is_active' => true,
        ]);

        
        $defaultAdmin = User::firstOrCreate([
            'email' => 'admin@droga-group.com'
        ], [
            'name' => 'Admin',
            'password' => Hash::make('password'),
            'role' => 'superadmin',
            'is_active' => true,
            'company_id' => $pharma->id,
        ]);

        $superadmin = User::firstOrCreate([
            'email' => 'superadmin@droga-group.com'
        ], [
            'name' => 'Super Admin',
            'password' => Hash::make('DrogaCareers@2026'),
            'role' => 'superadmin',
            'is_active' => true,
            'company_id' => $pharma->id,
        ]);

        $hr = User::firstOrCreate([
            'email' => 'hr@droga-group.com'
        ], [
            'name' => 'HR Manager',
            'password' => Hash::make('DrogaHR@2026'),
            'role' => 'hr',
            'is_active' => true,
            'company_id' => $physio->id,
        ]);

        $freshk = User::firstOrCreate([
            'email' => 'freshk@droga.com'
        ], [
            'name' => 'Fresh K',
            'password' => Hash::make('password'),
            'role' => 'hr',
            'is_active' => true,
            'company_id' => $physio->id,
        ]);

        
        $branchesData = [
            ['name' => 'Megenagna', 'city' => 'Addis Ababa', 'phone' => '+251911000001'],
            ['name' => 'Bole', 'city' => 'Addis Ababa', 'phone' => '+251911000002'],
            ['name' => 'Kebena', 'city' => 'Addis Ababa', 'phone' => '+251911000003'],
            ['name' => 'Summit', 'city' => 'Addis Ababa', 'phone' => '+251911000004'],
            ['name' => 'Rufael', 'city' => 'Addis Ababa', 'phone' => '+251911000005'],
            ['name' => 'Shola', 'city' => 'Addis Ababa', 'phone' => '+251911000006'],
            ['name' => 'Bambis', 'city' => 'Addis Ababa', 'phone' => '+251911000007'],
            ['name' => 'Jemo', 'city' => 'Addis Ababa', 'phone' => '+251911000008'],
            ['name' => 'Kazanchis', 'city' => 'Addis Ababa', 'phone' => '+251911000009'],
        ];

        $branches = [];
        foreach ($branchesData as $b) {
            $branches[$b['name']] = Branch::firstOrCreate([
                'slug' => Str::slug($b['name'])
            ], [
                'name' => $b['name'],
                'city' => $b['city'],
                'phone' => $b['phone'],
                'is_active' => true,
            ]);
        }

        
        $jobs = [
            [
                'title' => 'Customer Success Manager, Enterprise (US)',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking an experienced Enterprise Customer Success Manager to manage relationships with our largest, most strategic enterprise customers, driving adoption, retention, and expansion.',
                'what_you_do' => [
                    'Serve as primary contact for strategic enterprise accounts',
                    'Conduct regular business reviews and executive alignment sessions',
                    'Identify and mitigate churn risks proactively',
                    'Advocate for customer needs internally with product and engineering teams'
                ],
                'about_you' => [
                    '5+ years in enterprise customer success or account management',
                    'Proven ability to manage large, complex strategic accounts',
                    'Excellent presentation and communication skills'
                ],
                'bonus' => [
                    'Experience with developer tools or cloud infrastructure platforms',
                    'Familiarity with SaaS pricing and billing structures'
                ],
                'salary_range' => '$110,000 – $150,000',
                'branches' => ['Megenagna', 'Bole', 'Kazanchis']
            ],
            [
                'title' => 'Customer Success Manager, Startups',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking a Customer Success Manager, Startups to help our startup customers achieve their goals on the Droga Group platform, driving adoption, satisfaction, and growth at scale.',
                'what_you_do' => [
                    'Manage a high-velocity portfolio of startup accounts',
                    'Proactively reach out to customers at risk of churn',
                    'Drive product adoption through onboarding, training, and enablement'
                ],
                'about_you' => [
                    '2–4 years in customer success, ideally in a startup environment',
                    'Strong organizational skills and account portfolio management',
                    'Empathetic communicator with customer-first mindset'
                ],
                'bonus' => [
                    'Experience with developer tools or cloud platforms'
                ],
                'salary_range' => '$90,000 – $120,000',
                'branches' => ['Bole']
            ],
            [
                'title' => 'Director, Sales Development',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking a Director of Sales Development to build, scale, and lead our SDR organization, creating outbound programs, developing talent, and driving pipeline.',
                'what_you_do' => [
                    'Build, scale, and manage a high-performing SDR team',
                    'Recruit, train, and develop SDRs to consistently exceed targets',
                    'Design and implement outbound processes and enablement'
                ],
                'about_you' => [
                    '7+ years of sales development experience with 3+ years in leadership',
                    'Proven track record building and scaling SDR teams in B2B SaaS',
                    'Deep expertise in outbound sales methodologies'
                ],
                'bonus' => [
                    'Experience leading SDR organizations in high-growth environments'
                ],
                'salary_range' => '£210,000 – £266,000',
                'branches' => ['Kebena']
            ],
            [
                'title' => 'Enterprise Account Executive',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking an Enterprise Account Executive to drive new business and expansion within our largest enterprise accounts, engaging with technical buyers.',
                'what_you_do' => [
                    'Own a territory of enterprise accounts and drive net-new revenue',
                    'Lead complex, multi-stakeholder sales cycles from discovery to close',
                    'Engage C-suite, VP, and Director-level buyers across organizations'
                ],
                'about_you' => [
                    '6+ years of enterprise SaaS sales with consistent track record of exceeding quota',
                    'Experience selling to technical buyers (engineering, DevOps, platform teams)',
                    'Strong executive presence and relationship building'
                ],
                'bonus' => [
                    'Experience with developer tools or cloud infrastructure'
                ],
                'salary_range' => '$150,000 – $220,000 OTE',
                'branches' => ['Megenagna', 'Kebena', 'Summit']
            ],
            [
                'title' => 'Enterprise Account Executive (EMEA)',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking an Enterprise Account Executive (EMEA) to lead strategic sales efforts across our largest EMEA enterprise accounts, building lasting partnerships.',
                'what_you_do' => [
                    'Own a portfolio of strategic enterprise accounts across EMEA',
                    'Drive complex, consultative sales cycles involving multiple stakeholders',
                    'Build and maintain executive relationships across customer organizations'
                ],
                'about_you' => [
                    '6+ years of enterprise SaaS sales experience in EMEA markets',
                    'Demonstrated ability to close seven-figure deals',
                    'Excellent cross-cultural communication'
                ],
                'bonus' => [
                    'Experience selling developer infrastructure or cloud platforms'
                ],
                'salary_range' => '£140,000 – £200,000 OTE',
                'branches' => ['Summit']
            ],
            [
                'title' => 'Partner Manager, GSI',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking a Partner Manager, GSI to build and manage strategic partnerships with Global System Integrators, driving co-sell and go-to-market alignment.',
                'what_you_do' => [
                    'Develop and manage relationships with key GSI partners (Accenture, Deloitte, etc.)',
                    'Drive co-sell motions and joint pipeline development with partner teams',
                    'Execute joint GTM initiatives and co-marketing campaigns'
                ],
                'about_you' => [
                    '5+ years of channel or partner management experience, ideally with GSIs',
                    'Deep understanding of GSI business models and revenue generation',
                    'Strong ability to build relationships at senior levels'
                ],
                'bonus' => [
                    'Existing relationships with major GSI practices'
                ],
                'salary_range' => '$120,000 – $170,000 OTE',
                'branches' => ['Megenagna', 'Rufael', 'Shola']
            ],
            [
                'title' => 'Renewals Manager',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking a Renewals Manager to drive on-time renewals and net revenue retention across our commercial and enterprise customer base.',
                'what_you_do' => [
                    'Own the renewal process for a large portfolio of customer accounts',
                    'Forecast renewal outcomes accurately and identify at-risk accounts early',
                    'Negotiate renewal contracts and resolve commercial objections'
                ],
                'about_you' => [
                    '3+ years in renewals management, customer success, or sales operations',
                    'Proven track record of achieving high renewal rates',
                    'Strong negotiation and objection-handling skills'
                ],
                'bonus' => [
                    'Experience with Salesforce or Gainsight renewals workflows'
                ],
                'salary_range' => '$90,000 – $120,000',
                'branches' => ['Bambis', 'Jemo', 'Kazanchis']
            ],
            [
                'title' => 'Sales Development Representative',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking a Sales Development Representative to generate qualified pipeline by engaging developers, engineering leaders, and technical decision-makers.',
                'what_you_do' => [
                    'Prospect and qualify new business opportunities through outbound outreach',
                    'Research target accounts and personalize messaging for key buyers',
                    'Book qualified meetings for Account Executives'
                ],
                'about_you' => [
                    '1–2 years of SDR or BDR experience in B2B SaaS',
                    'Curiosity about technology and developer tools',
                    'Strong written communication and resilience'
                ],
                'bonus' => [
                    'Experience using Outreach, Salesloft, or similar tools'
                ],
                'salary_range' => '$70,000 – $95,000 OTE',
                'branches' => ['Shola']
            ],
            [
                'title' => 'Startups Accelerator Manager',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking a Startups Accelerator Manager to build and operate our startup accelerator program, helping early-stage companies succeed.',
                'what_you_do' => [
                    'Design and run Droga Group\'s startup accelerator program',
                    'Recruit, onboard, and manage cohorts of early-stage startup companies',
                    'Build relationships with top-tier VCs and accelerators'
                ],
                'about_you' => [
                    '4+ years in startup ecosystem, venture, or developer community roles',
                    'Deep network within the startup and VC community',
                    'Strong program management and event execution skills'
                ],
                'bonus' => [
                    'Experience building accelerator or incubator programs'
                ],
                'salary_range' => '$100,000 – $140,000',
                'branches' => ['Kazanchis']
            ],
            [
                'title' => 'Startups Program Lead',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking a Startups Program Lead to scale our startup engagement programs, driving awareness, adoption, and growth.',
                'what_you_do' => [
                    'Develop and scale Droga Group\'s startup engagement strategy',
                    'Build and maintain partnerships with VCs and startup communities',
                    'Create programs that drive developer adoption among startups'
                ],
                'about_you' => [
                    '3–5 years in developer relations, community, or startup ecosystem roles',
                    'Strong understanding of the startup landscape and startup GTM needs',
                    'Excellent written and verbal communication skills'
                ],
                'bonus' => [
                    'Technical background or experience with developer tools'
                ],
                'salary_range' => '$95,000 – $135,000',
                'branches' => ['Jemo']
            ],
            [
                'title' => 'Strategic Account Executive',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking a Strategic Account Executive to manage and grow our most valuable enterprise relationships, acting as a trusted partner.',
                'what_you_do' => [
                    'Own a focused portfolio of strategic accounts and drive revenue growth',
                    'Build and maintain executive-level relationships across customer organizations',
                    'Lead strategic account planning and multi-year deal negotiation'
                ],
                'about_you' => [
                    '8+ years of enterprise SaaS sales with a strong record of exceeding quota',
                    'Experience managing and growing $1M+ ARR accounts',
                    'Board-level executive presence and executive selling skills'
                ],
                'bonus' => [
                    'Experience selling developer infrastructure or platform products'
                ],
                'salary_range' => '$180,000 – $260,000 OTE',
                'branches' => ['Megenagna', 'Bole', 'Shola']
            ],
            [
                'title' => 'VDR, Majors [APAC]',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking a VDR, Majors (APAC) to drive pipeline generation and new business development for our major accounts segment.',
                'what_you_do' => [
                    'Generate and qualify pipeline for major accounts across APAC',
                    'Conduct outbound prospecting targeting engineering and technical decision-makers',
                    'Partner with Account Executives to drive top-of-funnel activity'
                ],
                'about_you' => [
                    '2–4 years of SDR or BDR experience in APAC markets',
                    'Understanding of the APAC enterprise technology landscape',
                    'Strong outbound prospecting and communication skills'
                ],
                'bonus' => [
                    'Experience in a developer-focused or cloud infrastructure company'
                ],
                'salary_range' => 'AU$80,000 – AU$110,000 OTE',
                'branches' => ['Rufael']
            ],
            [
                'title' => 'Vercel Development Representative – APAC',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking a Development Representative – APAC to drive developer awareness and pipeline generation across the Asia-Pacific region.',
                'what_you_do' => [
                    'Engage with developers and technical founders across the APAC region',
                    'Drive awareness of Droga Group\'s platform through community activity',
                    'Qualify and convert inbound leads from developer communities'
                ],
                'about_you' => [
                    '1–3 years in developer relations, technical sales development, or community roles',
                    'Passion for developer tools and cloud-native technology',
                    'Strong written and verbal communication skills'
                ],
                'bonus' => [
                    'Experience with open-source developer communities'
                ],
                'salary_range' => 'AU$75,000 – AU$100,000 OTE',
                'branches' => ['Bambis']
            ],
            [
                'title' => 'Vercel Development Representative, Startups',
                'department' => 'Sales',
                'employment_type' => 'Full Time',
                'about' => 'We are seeking a Development Representative, Startups to generate pipeline and drive developer engagement among early-stage startup companies.',
                'what_you_do' => [
                    'Identify and engage early-stage startups with high growth potential',
                    'Drive outbound outreach to founders, CTOs, and engineering teams',
                    'Qualify inbound leads from startup-focused channels'
                ],
                'about_you' => [
                    '1–3 years of SDR or developer community experience',
                    'Strong interest in startups and the early-stage ecosystem',
                    'Comfort engaging technical founders and engineering leaders'
                ],
                'bonus' => [
                    'Experience with developer tools or startup-focused platforms'
                ],
                'salary_range' => '$70,000 – $100,000 OTE',
                'branches' => ['Kebena']
            ]
        ];

        foreach ($jobs as $jobData) {
            $jp = JobPosting::create([
                'title' => $jobData['title'],
                'slug' => Str::slug($jobData['title']) . '-' . Str::random(4),
                'department' => $jobData['department'],
                'employment_type' => $jobData['employment_type'],
                'about' => $jobData['about'],
                'what_you_do' => $jobData['what_you_do'],
                'about_you' => $jobData['about_you'],
                'bonus' => $jobData['bonus'],
                'salary_range' => $jobData['salary_range'],
                'status' => 'published',
                'created_by' => $superadmin->id,
            ]);

            
            $branchIds = [];
            foreach ($jobData['branches'] as $bName) {
                if (isset($branches[$bName])) {
                    $branchIds[] = $branches[$bName]->id;
                }
            }
            $jp->branches()->sync($branchIds);
        }
    }
}
