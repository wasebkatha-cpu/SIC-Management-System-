import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Compass,
  FileText,
  Building2,
  UserCheck,
  ClipboardList,
  Users,
  MessageSquare,
  History,
  Shield,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Printer,
  Scale,
  MapPin,
  Calendar,
  Layers,
  HelpCircle,
  Sparkles,
  Info,
  SlidersHorizontal,
  Bookmark,
  Send,
  Download,
  Key,
  SunMoon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Lock,
  Hash,
  AtSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SINDH_DIVISIONS } from '../context/AppContext';

interface DocumentationProps {
  onNavigate?: (view: string) => void;
}

export interface DocStepAction {
  label: string;
  view: string;
  permissionKey?: string;
}

interface DocSection {
  id: string;
  title: string;
  category: 'quickstart' | 'core' | 'records' | 'collab' | 'admin' | 'faq';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  targetView?: string;
  badge?: string;
  content: {
    overview: string;
    whereToGo: {
      location: string;
      permissionRequired?: string;
      accessUrlHint?: string;
    };
    howToDo: {
      step: number;
      title: string;
      description: string;
      tip?: string;
      actions?: DocStepAction[];
    }[];
    keyFeatures?: string[];
    rulesOrNotes?: string[];
  };
}

export interface FeatureNavItem {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  description: string;
  sectionId: string;
  permissionKey?: string;
  isSuperUserOnly?: boolean;
  accentBg: string;
  accentText: string;
  accentBorder: string;
}

export const APPLICATION_FEATURES: FeatureNavItem[] = [
  {
    id: 'dashboard',
    name: 'Executive Dashboard',
    category: 'Analytics & KPIs',
    icon: Layers,
    badge: 'Executive',
    description: 'Real-time KPI metrics, disposal counts, department breakdown & district visualizations.',
    sectionId: 'dashboard',
    permissionKey: 'dashboard',
    accentBg: 'bg-blue-50 dark:bg-blue-950/50',
    accentText: 'text-blue-600 dark:text-blue-400',
    accentBorder: 'hover:border-blue-500/50 dark:hover:border-blue-500/50'
  },
  {
    id: 'complaints',
    name: 'Complaints & Appeals',
    category: 'Case Operations',
    icon: FileText,
    badge: 'Core Workflow',
    description: 'Register RTI appeals, automatic division/district reader allotment, hearing diaries & statuses.',
    sectionId: 'complaints-module',
    permissionKey: 'complaints',
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    accentBorder: 'hover:border-emerald-500/50 dark:hover:border-emerald-500/50'
  },
  {
    id: 'causeList',
    name: 'Daily Cause List',
    category: 'Court Hearings',
    icon: ClipboardList,
    badge: 'Daily Docket',
    description: 'Courtroom docket schedule, reader filtering, official printouts, party attendance & orders.',
    sectionId: 'cause-list',
    permissionKey: 'causeList',
    accentBg: 'bg-purple-50 dark:bg-purple-950/50',
    accentText: 'text-purple-600 dark:text-purple-400',
    accentBorder: 'hover:border-purple-500/50 dark:hover:border-purple-500/50'
  },
  {
    id: 'readers',
    name: 'Readers Management',
    category: 'Jurisdiction & Allotment',
    icon: Users,
    badge: 'Jurisdiction',
    description: 'Court Readers I, II, and III caseloads and Sindh divisions/districts territorial allocation.',
    sectionId: 'readers-allotment',
    permissionKey: 'readers',
    accentBg: 'bg-cyan-50 dark:bg-cyan-950/50',
    accentText: 'text-cyan-600 dark:text-cyan-400',
    accentBorder: 'hover:border-cyan-500/50 dark:hover:border-cyan-500/50'
  },
  {
    id: 'publicBodies',
    name: 'Public Bodies Directory',
    category: 'Departments Database',
    icon: Building2,
    badge: 'Registry',
    description: 'Sindh government departments, public authorities, websites, and default assigned reader.',
    sectionId: 'public-bodies-officials',
    permissionKey: 'publicBodies',
    accentBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    accentText: 'text-indigo-600 dark:text-indigo-400',
    accentBorder: 'hover:border-indigo-500/50 dark:hover:border-indigo-500/50'
  },
  {
    id: 'designatedOfficials',
    name: 'Designated Officials (PIOs)',
    category: 'Officer Registry',
    icon: UserCheck,
    badge: 'Officers',
    description: 'Public Information Officers (PIOs) directory, official titles, contact numbers & emails.',
    sectionId: 'public-bodies-officials',
    permissionKey: 'designatedOfficials',
    accentBg: 'bg-teal-50 dark:bg-teal-950/50',
    accentText: 'text-teal-600 dark:text-teal-400',
    accentBorder: 'hover:border-teal-500/50 dark:hover:border-teal-500/50'
  },
  {
    id: 'chat',
    name: 'Internal Team Chat',
    category: 'Live Collaboration',
    icon: MessageSquare,
    badge: 'Real-Time',
    description: 'Team Group Chat, direct messaging, case attachments, voice notes & floating popup window.',
    sectionId: 'internal-chat',
    accentBg: 'bg-sky-50 dark:bg-sky-950/50',
    accentText: 'text-sky-600 dark:text-sky-400',
    accentBorder: 'hover:border-sky-500/50 dark:hover:border-sky-500/50'
  },
  {
    id: 'chatKeys',
    name: 'Chat Keys & Case Sharing',
    category: 'Live Collaboration',
    icon: Hash,
    badge: 'Smart Shortcuts',
    description: 'Quick-share complaints (#), cause lists (>), public bodies (!), designated officials (*), and staff (@).',
    sectionId: 'chat-keys',
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    accentBorder: 'hover:border-emerald-500/50 dark:hover:border-emerald-500/50'
  },
  {
    id: 'activityHistory',
    name: 'Activity History & Audit',
    category: 'Security & Logs',
    icon: History,
    badge: 'Audit Trail',
    description: 'Full chronological audit trail of complaint edits, status changes, hearing reschedules & logins.',
    sectionId: 'activity-history',
    permissionKey: 'activityHistory',
    accentBg: 'bg-rose-50 dark:bg-rose-950/50',
    accentText: 'text-rose-600 dark:text-rose-400',
    accentBorder: 'hover:border-rose-500/50 dark:hover:border-rose-500/50'
  },
  {
    id: 'adminManagement',
    name: 'Admin Management',
    category: 'Access Control (RBAC)',
    icon: Shield,
    badge: 'Super User Only',
    description: 'Provision staff accounts, assign granular per-module permissions & reset passwords.',
    sectionId: 'admin-management',
    isSuperUserOnly: true,
    permissionKey: 'adminManagement',
    accentBg: 'bg-amber-50 dark:bg-amber-950/50',
    accentText: 'text-amber-600 dark:text-amber-400',
    accentBorder: 'hover:border-amber-500/50 dark:hover:border-amber-500/50'
  }
];

export default function Documentation({ onNavigate }: DocumentationProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSectionId, setActiveSectionId] = useState<string>('where-to-go');
  const [expandedFaqs, setExpandedFaqs] = useState<number[]>([0, 1]);

  const canAccessView = (viewKey?: string) => {
    if (!viewKey) return true;
    if (!user) return false;
    if (user.role === 'superUser') return true;
    if (viewKey === 'adminManagement') {
      return user.role === 'superUser' || (user.permissions && user.permissions.includes('adminManagement' as any));
    }
    if (user.role === 'admin') {
      if (!user.permissions || user.permissions.length === 0) return true;
      return user.permissions.includes(viewKey as any);
    }
    return false;
  };

  const toggleFaq = (idx: number) => {
    setExpandedFaqs(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const docSections: DocSection[] = useMemo(() => [
    {
      id: 'where-to-go',
      title: 'Where to Go for What? (Interactive Directory)',
      category: 'quickstart',
      icon: Compass,
      badge: 'Core Reference',
      description: 'Quick cheat-sheet mapping everyday Commission tasks to exact screens and 1-click shortcuts.',
      content: {
        overview: 'Use this quick directory whenever you want to know exactly which screen to open, where buttons are located, and how to execute key tasks in the SIC Management System.',
        whereToGo: {
          location: 'Accessible across all modules through the Left Navigation sidebar.',
        },
        howToDo: [
          {
            step: 1,
            title: 'Register a New Citizen Complaint or RTI Appeal',
            description: 'Navigate to "Complaints" -> Click the "+ Add Complaint" button -> Complete complainant info, public body, division & district -> Click Save Complaint.',
            tip: 'The division and district you select will automatically assign the appropriate Reader (e.g. Reader I, II, III) based on Commission territorial rules.',
            actions: [
              { label: 'Open Complaints Registry', view: 'complaints' }
            ]
          },
          {
            step: 2,
            title: 'View or Update Today\'s Scheduled Hearing Docket',
            description: 'Navigate to "Cause List" -> Check today\'s date docket -> Use Reader filters to view cases listed for a specific reader -> Mark attendance or update proceeding stage.',
            tip: 'You can print the courtroom docket in one click using the "Print Cause List" button.',
            actions: [
              { label: 'Open Daily Cause List', view: 'causeList' }
            ]
          },
          {
            step: 3,
            title: 'Look Up Public Bodies & Designated PIO Information',
            description: 'Navigate to "Public Bodies" to view government departments, websites, and assigned readers; or navigate to "Designated Officials" to view Public Information Officers (PIOs).',
            tip: 'Use the search bar on either screen to quickly find contact phone numbers and email addresses.',
            actions: [
              { label: 'Open Public Bodies', view: 'publicBodies' },
              { label: 'Open Designated PIOs', view: 'designatedOfficials' }
            ]
          },
          {
            step: 4,
            title: 'Rebalance Reader Caseloads or Update Jurisdictions',
            description: 'Navigate to "Readers" -> Review pending complaints under Reader I, II, and III -> Click "Edit Jurisdiction" to allocate Sindh divisions and districts.',
            tip: 'Changes to reader jurisdictions immediately update future complaint intake assignments.',
            actions: [
              { label: 'Open Readers Management', view: 'readers' }
            ]
          },
          {
            step: 5,
            title: 'Collaborate with Commission Colleagues in Real-Time',
            description: 'Click "Internal Chat" in the left menu, or click the floating chat button at the bottom-right of your screen -> Choose Team Group Chat or a direct colleague chat -> Send messages, files, and voice notes.',
            tip: 'Popup chat lets you message colleagues without interrupting what you are doing in Complaints or Cause List.',
            actions: [
              { label: 'Open Internal Chat', view: 'chat' }
            ]
          },
          {
            step: 6,
            title: 'Audit System Operations or Trace Altered Case Records',
            description: 'Navigate to "Activity History" -> Filter by user, date, or action -> Inspect who created complaints, marked hearings, or changed permissions.',
            tip: 'All critical system events are logged with precise timestamps and responsible usernames.',
            actions: [
              { label: 'Open Activity History', view: 'activityHistory' }
            ]
          },
          {
            step: 7,
            title: 'Manage Staff Accounts & Module Access (Super Users Only)',
            description: 'Navigate to "Admin Management" -> Click "+ Add Admin" to provision staff accounts -> Check specific module permissions -> Save account.',
            tip: 'You can disable user accounts or reset passwords directly from this screen.',
            actions: [
              { label: 'Open Admin Management', view: 'adminManagement' }
            ]
          }
        ],
        keyFeatures: [
          'Direct navigation shortcuts to all app sections',
          'Searchable task database matching keywords like "attendance", "upload", "cause list"',
          'Clear role-based permission visibility'
        ]
      }
    },
    {
      id: 'dashboard',
      title: 'Executive Dashboard & Analytics',
      category: 'core',
      icon: Layers,
      targetView: 'dashboard',
      badge: 'Overview',
      description: 'Central command center with key metrics, complaint statuses, and district/department breakdown charts.',
      content: {
        overview: 'The Executive Dashboard provides an immediate analytical summary of all RTI appeals and statutory proceedings handled by the Sindh Information Commission.',
        whereToGo: {
          location: 'Left Navigation -> "Dashboard" (Top menu item)',
          permissionRequired: 'dashboard'
        },
        howToDo: [
          {
            step: 1,
            title: 'Review Key Performance Indicators (KPIs)',
            description: 'View the consolidated metrics card displaying Total Complaints, Disposed-off, In Process, Penalties Imposed, Non-Maintainable, and Proactive Disclosure cases.',
            actions: [
              { label: 'Go to Executive Dashboard', view: 'dashboard' }
            ]
          },
          {
            step: 2,
            title: 'Inspect Department-Wise Complaints & District-Wise Trends',
            description: 'Review the consolidated lists for Department-wise and District-wise complaints. To view graphical data, click the "View Chart" button inside either card to open an interactive visualization modal.',
            actions: [
              { label: 'Open Complaints Registry', view: 'complaints' }
            ]
          },
          {
            step: 3,
            title: 'Access Quick Hearing Shortcuts',
            description: 'Click on upcoming hearing cards or quick action badges to jump directly to specific complaints or today\'s cause list.',
            actions: [
              { label: 'Open Daily Cause List', view: 'causeList' },
              { label: 'View All Complaints', view: 'complaints' }
            ]
          }
        ],
        keyFeatures: [
          'Consolidated 6-metric summary card with responsive counters',
          'Modal popups for Department-wise and District-wise graphical analysis',
          'Immediate status indicators: Disposed-off vs In Process vs Non-Maintainable'
        ],
        rulesOrNotes: [
          'KPI numbers recalculate instantly whenever complaints are created, disposed, or status stages are updated.'
        ]
      }
    },
    {
      id: 'complaints-module',
      title: 'Complaints & Appeals Management',
      category: 'core',
      icon: FileText,
      targetView: 'complaints',
      badge: 'Primary Module',
      description: 'Complete lifecycle of RTI complaints: intake, auto-reader assignment, hearings, diary entries, and disposal.',
      content: {
        overview: 'The Complaints module handles all citizen appeals filed before the Sindh Information Commission against government departments failing to provide requested public information.',
        whereToGo: {
          location: 'Left Navigation -> "Complaints"',
          permissionRequired: 'complaints'
        },
        howToDo: [
          {
            step: 1,
            title: 'Initiate a New Complaint Registration',
            description: 'Click the green "+ Add Complaint" button in the top-right corner of the Complaints screen.',
            actions: [
              { label: 'Go to Complaints (+ Add)', view: 'complaints' }
            ]
          },
          {
            step: 2,
            title: 'Enter Complainant Details',
            description: 'Fill in Complainant Full Name (required), Father\'s Name, CNIC Number, Contact Phone Number, and Email Address.'
          },
          {
            step: 3,
            title: 'Select Public Body & Department',
            description: 'Type or pick the respondent Public Body from the dropdown list. The system automatically populates known official designation, contact number, and website.',
            tip: 'If this is a new public body not yet in the list, simply type its full department title.',
            actions: [
              { label: 'Browse Public Bodies', view: 'publicBodies' }
            ]
          },
          {
            step: 4,
            title: 'Select Geographic Division & District (Jurisdiction)',
            description: 'Select the administrative "Divisions" (e.g. Karachi, Hyderabad, Sukkur, Larkana, Mirpur Khas, Shaheed Benazirabad). The "District" sub-field will dynamically show the matching districts for that division.',
            tip: 'Notice the "Reader Feature Allotment" card below the inputs: it will automatically determine whether Reader I, Reader II, or Reader III takes jurisdiction of this case.',
            actions: [
              { label: 'Review Reader Jurisdictions', view: 'readers' }
            ]
          },
          {
            step: 5,
            title: 'Record First Application & Internal Review Details',
            description: 'Specify the statutory dates and submission methods (By Hand, By Courier, By Mail, By Web Portal) when the citizen initially requested information from the department.'
          },
          {
            step: 6,
            title: 'Submit and Inspect Case Workspace',
            description: 'Click "Save Complaint". The complaint is issued an official identifier (e.g. SIC-2026-05) and logged in the complaint table.'
          },
          {
            step: 7,
            title: 'Manage Complaint Details & Proceedings',
            description: 'Click on any complaint row or view icon to open Complaint Details. From there, you can: (a) Add proceedings and hearing milestones, (b) Record daily Case Diary notes, (c) Mark attendance for parties, (d) Set Next Hearing Date, and (e) Update status (In Process, Disposed-off, Non-Maintainable).',
            actions: [
              { label: 'Open Complaints Registry', view: 'complaints' }
            ]
          }
        ],
        keyFeatures: [
          'Automatic Complaint Number generation (`SIC-YYYY-XX`)',
          'Real-time Reader Allotment preview compliant with Commission rules',
          'Multi-criteria filters: Search by keyword, filter by District, Division, Reader, and Status',
          'Printable case summary and detailed proceedings log'
        ]
      }
    },
    {
      id: 'cause-list',
      title: 'Daily Cause List & Courtroom Proceeding Console',
      category: 'core',
      icon: ClipboardList,
      targetView: 'causeList',
      badge: 'Courtroom Docket',
      description: 'Manage daily docket, filter by Readers, mark attendance, and open complaints for hearing management, drafts, submissions, and diaries.',
      content: {
        overview: 'The Daily Cause List is the formal courtroom schedule for the Chief Information Commissioner and Information Commissioners. Clicking on any complaint in the Cause List opens the full Courtroom Proceeding Console (CauseListProceeding) with comprehensive features for managing hearings, attendance, custom drafts, proceedings history, submissions, and case diaries—fully compliant with the application themeSwitch in both Light and Dark modes.',
        whereToGo: {
          location: 'Left Navigation -> "Cause List"',
          permissionRequired: 'causeList'
        },
        howToDo: [
          {
            step: 1,
            title: 'Where to Go: Daily Cause List Docket & Reader Filtering',
            description: 'Navigate to "Cause List" in the left sidebar. Use the date picker or "Today" / "Tomorrow" quick buttons to inspect cases scheduled for hearing. Filter by Reader (All, Reader I, Reader II, Reader III) or search by complaint number and party name. Click "Print Cause List" to generate an official paper docket for notice boards and courtroom rostrums.',
            tip: 'The Cause List automatically organizes complaints chronologically by hearing time and highlights cases with overdue compliance orders.',
            actions: [
              { label: 'Open Daily Cause List', view: 'causeList', permissionKey: 'causeList' },
              { label: 'Manage Reader Jurisdictions', view: 'readers', permissionKey: 'readers' }
            ]
          },
          {
            step: 2,
            title: 'What to Do: Opening a Complaint in Cause List (Courtroom Console Modal)',
            description: 'Click directly on any complaint card or row in the Cause List. This immediately opens the comprehensive Complaint Proceeding & Courtroom Console modal. This console provides a unified interface for all hearing actions: hearing parameters, attendance records, official notice drafts, document attachments, submissions, and case diary minutes. It dynamically respects your Light/Dark mode themeSwitch.',
            tip: 'You can press Esc or click the close button at the top-right to return back to the Cause List docket at any time without losing saved changes.',
            actions: [
              { label: 'Launch Cause List to Open a Case', view: 'causeList', permissionKey: 'causeList' }
            ]
          },
          {
            step: 3,
            title: 'Feature 1: Updating Hearing Details & Bench Scheduling',
            description: 'Where: Inside the opened complaint console -> "Hearing Details & Bench Scheduling" panel.\nWhat to do: 1) Change the Hearing Date and Hearing Time (e.g. 10:30 AM). 2) Select the Hearing Room or Bench (e.g., Bench I - Main Courtroom, Bench II). 3) Set Hearing Nature / Stage (Preliminary Hearing, Regular Hearing, Final Arguments, Compliance Review, Notice Returnable). 4) Set Presiding Quorum / Commissioners. 5) Specify the Next Hearing Date. 6) Choose Hearing Status (Scheduled, Adjourned, Concluded, Disposed). 7) Click "Save Hearing Details". All changes instantly synchronize with the daily Cause List and Activity Audit Log.',
            tip: 'When you set a next hearing date, the complaint will automatically populate in the Cause List on that scheduled day under the assigned Reader.',
            actions: [
              { label: 'Open Daily Cause List', view: 'causeList', permissionKey: 'causeList' },
              { label: 'View in Complaints Registry', view: 'complaints', permissionKey: 'complaints' }
            ]
          },
          {
            step: 4,
            title: 'Feature 2: Updating Party & Counsel Attendance Details',
            description: 'Where: Inside the opened complaint console -> "Party & Counsel Attendance" section.\nWhat to do: 1) Record Complainant Status: Present, Absent, or Represented by Counsel. Enter Complainant Advocate Name and Contact number. 2) Record Respondent Designated Official (PIO) Status: Present, Absent, or Department Representative. Enter Respondent Counsel Name. 3) Add Court Appearance Notes (e.g. "complainant requested time to file rejoinder"). 4) Click "Save Attendance Details". Attendance status is saved in real time and automatically formatted on printed hearing minutes.',
            tip: 'Marking attendance accurately ensures that ex-parte proceedings or cost orders under the Sindh RTI Act are documented with statutory compliance.',
            actions: [
              { label: 'Open Daily Cause List', view: 'causeList', permissionKey: 'causeList' }
            ]
          },
          {
            step: 5,
            title: 'Feature 3: Generating Custom Drafts & Standard Official Templates',
            description: 'Where: Inside the opened complaint console -> "Notice / Order Templates" dropdown & "+ Custom Notice / Draft" button in the header.\nWhat to do: 1) Choose a Standard Template: Notice of Hearing to Complainant, Notice of Hearing to Respondent (PIO), Order Sheet / Hearing Order, Final Decision / Compliance Directive, or Show-Cause Summons. 2) Or click "+ Custom Notice / Draft" to launch the Custom Notice Modal: specify Custom Notice Title, Recipient, Subject, Reference Number, and format custom body text. 3) The Rich Text Notice Draft Modal opens with official Sindh Information Commission letterhead, date, case metadata, and official seal. 4) Review, edit, print directly, or export as PDF for formal dispatch.',
            tip: 'All generated notices and custom orders are automatically added to the case\'s Proceedings History for permanent archival.',
            actions: [
              { label: 'Launch Cause List for Custom Drafts', view: 'causeList', permissionKey: 'causeList' }
            ]
          },
          {
            step: 6,
            title: 'Feature 4: Proceedings History & Fullscreen Document Viewer Modal',
            description: 'Where: Inside the opened complaint console -> "Proceedings & Orders History" table.\nWhat to do: 1) View the complete chronological table of every proceeding, notice, order sheet, and decision issued for this complaint. 2) Click "View Document" or the document icon on any entry to launch the full-screen Document Viewer Modal. 3) The viewer supports both PDF documents and scanned PNG/JPEG images with zoom controls (50% - 200%), external tab viewing, download, and instant printing. 4) Click "Upload File" or "Replace File" inside the viewer to attach an official signed order, scanned stamp, or notice copy. The viewer fully supports dark/light mode.',
            tip: 'Replacing or uploading an attachment immediately persists the file to the case record and displays an "Uploaded Attachment Attached" badge.',
            actions: [
              { label: 'Open Courtroom Console', view: 'causeList', permissionKey: 'causeList' },
              { label: 'View Case Documents', view: 'complaints', permissionKey: 'complaints' }
            ]
          },
          {
            step: 7,
            title: 'Feature 5: Updating Case Submissions, Written Replies & Annexures',
            description: 'Where: Inside the opened complaint console -> "Submissions & Rejoinders" panel.\nWhat to do: 1) Review Complainant Submissions (grounds of appeal, initial RTI request proof, rejoinder). 2) Review Respondent Department Submissions (written replies, department comments, compliance reports, exemption justifications under Section 16 of the Act). 3) Click "+ Add Submission" to record new filings: select Filing Party (Complainant or Respondent), enter Submission Title, Date of Filing, Description, and upload supporting documentary evidence or annexures. 4) Track whether requested information was provided or disputed.',
            tip: 'Submissions can be cross-examined during courtroom arguments and printed for the Commissioner\'s bench folder.',
            actions: [
              { label: 'Open Cause List Submissions', view: 'causeList', permissionKey: 'causeList' }
            ]
          },
          {
            step: 8,
            title: 'Feature 6: Adding & Managing Case Diaries (Hearing Minutes & Bench Notes)',
            description: 'Where: Inside the opened complaint console -> "Case Diary & Hearing Minutes" section at the bottom.\nWhat to do: 1) Click "+ Add Diary Entry" / "Log Hearing Minutes". 2) Enter Entry Date (defaults to today\'s hearing date). 3) Enter Title / Stage (e.g. "Order Dictated in Open Court", "Interim Direction to Secretary Health", "Rejoinder Taken on Record"). 4) Type Detailed Minutes / Dictated Order in the text area. 5) Specify the Next Directive or compliance deadline. 6) Click "Save Diary Entry". The diary entry is instantly recorded in the permanent chronological case log with author credentials.',
            tip: 'The Case Diary acts as the official judicial record of the Commission, providing a seamless continuum across successive hearing dates.',
            actions: [
              { label: 'Open Cause List Minutes & Diary', view: 'causeList', permissionKey: 'causeList' },
              { label: 'View Case Diary in Complaints', view: 'complaints', permissionKey: 'complaints' }
            ]
          }
        ],
        keyFeatures: [
          'Full-featured Complaint Proceeding & Courtroom Console (causeListProceeding)',
          '100% ThemeSwitch compliant (seamless Dark Mode and Light Mode support)',
          'Real-time hearing details update with instant docket synchronization',
          'Party and legal counsel attendance recording with appearance notes',
          'Standard notice templates (Hearing Notice, Order Sheet, Compliance Directive, Summons)',
          'Custom Notice Creation Modal with custom title, recipient, reference & body',
          'Rich Text Notice Draft editor with official SIC letterhead and print/PDF export',
          'Proceedings History timeline with full-screen PDF & Image Document Viewer',
          'Document attachment uploader and replacer (PDF/PNG) directly inside the viewer',
          'Complainant and Respondent submissions and rejoinders management',
          'Chronological Case Diary and courtroom hearing minutes logger'
        ],
        rulesOrNotes: [
          'Important Operational Notes:',
          '• Theme Compliance: Clicking any complaint in the Cause List opens the modal styled with the global themeSwitch (dark mode / light mode).',
          '• Territorial Sync: Any change to hearing dates or stages is immediately reflected in the Reader\'s active docket and the Executive Dashboard.',
          '• Official Orders: When issuing a Final Disposal order, update the Hearing Status to "Disposed" and log the final compliance deadline in the Case Diary.'
        ]
      }
    },
    {
      id: 'readers-allotment',
      title: 'Readers Management & Territorial Jurisdictions',
      category: 'records',
      icon: Users,
      targetView: 'readers',
      badge: 'Jurisdiction Allotment',
      description: 'Configure Reader assignments, territorial division/district allocation, and balance pending caseloads.',
      content: {
        overview: 'The Readers feature allocates the Commission\'s caseload among designated Court Readers (Reader I, Reader II, Reader III). Reader assignments are tied to Sindh administrative divisions and districts.',
        whereToGo: {
          location: 'Left Navigation -> "Readers"',
          permissionRequired: 'readers'
        },
        howToDo: [
          {
            step: 1,
            title: 'Review Current Reader Jurisdictions',
            description: 'View the cards for Reader I, Reader II, and Reader III, showing their assigned divisions (e.g. Karachi Division, Hyderabad Division), assigned districts, and active pending caseload counts.',
            actions: [
              { label: 'Open Readers Management', view: 'readers' }
            ]
          },
          {
            step: 2,
            title: 'Edit Reader Territorial Allocation',
            description: 'Click "Edit Jurisdiction" on any Reader card. Select or deselect divisions and districts under their responsibility -> Click "Save Allocation".',
            actions: [
              { label: 'Allocate Reader Jurisdictions', view: 'readers' }
            ]
          },
          {
            step: 3,
            title: 'How Allotment Happens Automatically in Complaint Form',
            description: 'When staff fills the Add Complaint form, selecting a Division (e.g. Karachi) and District (e.g. South) automatically allocates the case to Reader I based on these rules. If no explicit location is given, it looks up the Public Body\'s registered district.',
            actions: [
              { label: 'Test in Complaint Form', view: 'complaints' }
            ]
          },
          {
            step: 4,
            title: 'Manual Reallocation / Caseload Rebalancing',
            description: 'If a reader is on leave or caseloads become unbalanced, adjust territorial jurisdictions or reassign specific complaints from Complaint Details.',
            actions: [
              { label: 'View Readers Overview', view: 'readers' },
              { label: 'View Complaints', view: 'complaints' }
            ]
          }
        ],
        keyFeatures: [
          'Strict Sindh administrative division and district mapping',
          'Real-time caseload metrics per reader',
          'Seamless automatic assignment at complaint intake',
          'Fallback to Unassigned if a region has no designated reader'
        ],
        rulesOrNotes: [
          'Standard Allotment Default:',
          '• Reader I: Karachi Division (East, West, South, Central, Malir, Korangi, Keamari)',
          '• Reader II: Hyderabad Division, Mirpur Khas Division, Shaheed Benazirabad Division',
          '• Reader III: Sukkur Division, Larkana Division'
        ]
      }
    },
    {
      id: 'public-bodies-officials',
      title: 'Public Bodies Directory',
      category: 'records',
      icon: Building2,
      targetView: 'publicBodies',
      badge: 'Statutory Registry',
      description: 'Maintain Sindh government departments, public authorities, and their default assigned reader.',
      content: {
        overview: 'Public authorities covered under the Sindh Transparency and Right to Information Act 2016 are cataloged here with their official contact information.',
        whereToGo: {
          location: 'Left Navigation -> "Public Bodies"',
          permissionRequired: 'publicBodies'
        },
        howToDo: [
          {
            step: 1,
            title: 'Add a New Public Body',
            description: 'Navigate to "Public Bodies" -> Click "+ Add Public Body" -> Provide Department Name, Category (e.g. Health, Education, Police, Services), Division, District, Website, and Default Assigned Reader -> Save.',
            actions: [
              { label: 'Open Public Bodies Directory', view: 'publicBodies' }
            ]
          },
          {
            step: 2,
            title: 'Update Existing Public Body Information',
            description: 'Search for any department -> Click the "Edit" icon -> Update official phone number, email address, or designated official name.',
            actions: [
              { label: 'Manage Public Bodies', view: 'publicBodies' }
            ]
          },
          {
            step: 3,
            title: 'Cross-Reference Designated Officials',
            description: 'To look up notified Public Information Officers directly, navigate to the Designated Officials registry.',
            actions: [
              { label: 'Open Designated Officials', view: 'designatedOfficials' }
            ]
          }
        ],
        keyFeatures: [
          'Centralized repository of government departments across Sindh',
          'Quick auto-population in complaint intake forms',
          'Direct contact actions (dial phone, send email)'
        ]
      }
    },
    {
      id: 'designated-officials',
      title: 'Designated Officials (PIOs) Directory',
      category: 'records',
      icon: UserCheck,
      targetView: 'designatedOfficials',
      badge: 'Officer Registry',
      description: 'Dedicated registry of Public Information Officers (PIOs) across all Sindh government departments.',
      content: {
        overview: 'Under Section 7 of the Sindh Transparency & RTI Act 2016, every public body is legally required to notify a Designated Official (PIO) to respond to citizen information requests.',
        whereToGo: {
          location: 'Left Navigation -> "Designated Officials"',
          permissionRequired: 'designatedOfficials'
        },
        howToDo: [
          {
            step: 1,
            title: 'Search for a Notified PIO',
            description: 'Navigate to "Designated Officials" -> Search by official\'s name, department name, or location to inspect their title, phone number, and official email.',
            actions: [
              { label: 'Open Designated Officials', view: 'designatedOfficials' }
            ]
          },
          {
            step: 2,
            title: 'Directly Contact Official',
            description: 'Click on the email or phone link to initiate direct correspondence for compliance verification.',
            actions: [
              { label: 'Launch PIO Directory', view: 'designatedOfficials' }
            ]
          }
        ],
        keyFeatures: [
          'Direct officer contact information (phones & emails)',
          'Searchable by official name, post, and department',
          'Linked directly to Public Body records'
        ]
      }
    },
    {
      id: 'internal-chat',
      title: 'Internal Team Chat & Real-Time Collaboration',
      category: 'collab',
      icon: MessageSquare,
      targetView: 'chat',
      badge: 'Collaboration',
      description: 'Real-time internal communications: Team Group Chat, direct messages, file attachments, and floating popup chat.',
      content: {
        overview: 'Internal Chat keeps Commission officers, readers, and registry staff connected without relying on external messaging apps.',
        whereToGo: {
          location: 'Left Navigation -> "Internal Chat", or click the floating chat bubble in the bottom right corner of any page'
        },
        howToDo: [
          {
            step: 1,
            title: 'Join Team Group Chat or Start Direct Message',
            description: 'Open Internal Chat. Select "Team Group Chat" from the conversation list for office-wide announcements, or click on any staff member\'s name for a private 1-on-1 discussion.',
            actions: [
              { label: 'Open Internal Team Chat', view: 'chat' }
            ]
          },
          {
            step: 2,
            title: 'Send Text, Case Files & Documents',
            description: 'Type your message in the input box. To attach a case document, summons, or evidence photo, click the paperclip attachment icon and select your file.',
            actions: [
              { label: 'Open Chat Room', view: 'chat' }
            ]
          },
          {
            step: 3,
            title: 'Use Message Replies & Reactions',
            description: 'Hover over any message to reply directly in a thread or react with quick emojis (thumbs up, checkmark, gavel).',
            actions: [
              { label: 'Open Team Chat', view: 'chat' }
            ]
          },
          {
            step: 4,
            title: 'Multitask with Popup Floating Chat & Smart Trigger Keys',
            description: 'While browsing Complaints or Cause List, click the floating chat badge at the bottom-right. Type trigger keys to instantly search and link cases: # for Complaints, > for Cause List dockets, ! for Public Bodies, * for Designated Officials, and @ for Colleague mentions.',
            tip: 'See the dedicated "Chat Keys & Case Sharing" guide for complete details on keyboard controls and interactive cards.',
            actions: [
              { label: 'Open Full Chat', view: 'chat' },
              { label: 'Open Cause List', view: 'causeList', permissionKey: 'causeList' },
              { label: 'Open Complaints', view: 'complaints', permissionKey: 'complaints' }
            ]
          }
        ],
        keyFeatures: [
          'Group chat & direct peer-to-peer messaging',
          'Smart Chat Keys (#, >, !, *, @) for instant record linking',
          'Real-time sound and banner notifications',
          'File attachment support (PDF, DOCX, PNG, JPG) with case linking',
          'Popup chat overlay for rapid multitasking without leaving current view'
        ]
      }
    },
    {
      id: 'chat-keys',
      title: 'Chat Keys, Smart Links & Case Sharing Shortcuts',
      category: 'collab',
      icon: Hash,
      targetView: 'chat',
      badge: 'Smart Shortcuts',
      description: 'Quick-reference guide to chat trigger keys: # for Complaints, > for Cause Lists, ! for Public Bodies, * for Designated Officials, and @ for Staff Mentions.',
      content: {
        overview: 'The SIC Internal Chat and Floating Popup Chat feature an intelligent autocomplete system that turns simple keystrokes into live, interactive reference cards. Staff members can quickly link, share, and navigate to registered complaints, court cause list schedules, government departments, and public information officers without copying links or manually switching pages.',
        whereToGo: {
          location: 'Any Chat Input -> "Internal Chat" or the Floating "Popup Chat" window on any page',
          accessUrlHint: 'Type #, >, !, *, or @ directly in the message composer'
        },
        howToDo: [
          {
            step: 1,
            title: 'Share Complaints & Appeals using the "#" Key',
            description: 'Type "#" in the message input (e.g. "#SIC-2026-01" or "#Ahmed"). An autocomplete popover displays registered complaints showing registration number, parties, district, and current hearing stage. Press Enter or Tab to insert. In the chat feed, this renders an interactive Complaint Card with parties, district badge, status, and a direct "View Case" button that immediately opens the complaint details.',
            tip: 'Typing "#" searches across complaint numbers, complainant names, respondent departments, and districts in real time.',
            actions: [
              { label: 'Open Chat to Try', view: 'chat' },
              { label: 'Open Complaints Registry', view: 'complaints', permissionKey: 'complaints' }
            ]
          },
          {
            step: 2,
            title: 'Share Daily Cause List Hearing Dockets using the ">" Key',
            description: 'Type ">" in the message input (or type "> Cause List"). The popover lists Today\'s courtroom docket and all upcoming hearing dates with total scheduled case counts. Selecting a date generates a Cause List card with a "View Cause List" button that navigates directly to that date\'s court docket.',
            tip: 'Use ">" whenever alerting readers or the Secretary about courtroom hearing schedules for today or upcoming days.',
            actions: [
              { label: 'Open Cause List', view: 'causeList', permissionKey: 'causeList' }
            ]
          },
          {
            step: 3,
            title: 'Share Public Bodies & Government Departments using the "!" Key',
            description: 'Type "!" (or "$" or "/pb") followed by the department name (e.g. "!Health", "!Education", "!KMC"). The system filters all registered Sindh government departments, showing their division, district, and assigned reader. Clicking the shared card opens the Public Bodies directory pre-filtered to that authority.',
            tip: 'Prefixing with "!" or "$" works seamlessly from anywhere in your message.',
            actions: [
              { label: 'Open Public Bodies', view: 'publicBodies', permissionKey: 'publicBodies' }
            ]
          },
          {
            step: 4,
            title: 'Share Designated Officials (PIOs) using the "*" Key',
            description: 'Type "*" (or "~", "^", "?", or "/do") followed by the officer\'s name or post (e.g. "*Director", "*Rashid Ali"). The popover pulls verified Public Information Officers with their phone numbers and emails. Clicking "View Official" on the shared card jumps straight to their profile in the PIO Directory.',
            tip: 'Great for quickly sharing official contact numbers with colleagues handling compliance orders.',
            actions: [
              { label: 'Open PIO Directory', view: 'designatedOfficials', permissionKey: 'designatedOfficials' }
            ]
          },
          {
            step: 5,
            title: 'Mention Staff Members & Commission Officers using the "@" Key',
            description: 'Type "@" followed by a colleague\'s name or username to tag them. The popover lists all SuperUsers and Admins with their role badges. Tagged colleagues receive highlighted visual mentions and prompt notifications.',
            tip: 'Use "@" in Team Group Chat to draw immediate attention from Commission officers or specific court readers.'
          },
          {
            step: 6,
            title: 'Add Files & Evidence to Cases directly from Chat',
            description: 'When documents, orders, or photos are shared in chat via the paperclip button, any user can click "Attach to Complaint" or "Add to Case" to directly link that file into the official hearing diary or proceeding attachments of any complaint.',
            tip: 'Eliminates re-uploading documents received through chat into case records.',
            actions: [
              { label: 'Go to Chat', view: 'chat' }
            ]
          }
        ],
        keyFeatures: [
          '# Key: Search complaints by number, complainant, respondent, or district with one-click "View Case" navigation',
          '> Key: Instant link to today\'s or upcoming cause list hearing dockets with scheduled case counts',
          '! / $ Key: Sindh Public Bodies directory search with assigned reader & department info',
          '* / ~ / ^ Key: Designated Official (PIO) contact cards with phone numbers & emails',
          '@ Key: Staff member & Admin role mentions with visual badges and notifications',
          'Full keyboard navigation: ↑ / ↓ to navigate items, Enter / Tab to select, Esc to dismiss',
          'Attach to Case: Link incoming chat files and evidence straight into complaint proceeding records'
        ],
        rulesOrNotes: [
          'Chat keys operate identically in both the Full Internal Team Chat and the floating Popup Chat widget.',
          'Recipients in any view can click on shared cards in the chat feed to jump straight to the case or docket without losing their place.',
          'All shared complaint, cause list, and directory links respect user role-based permissions (RBAC).'
        ]
      }
    },
    {
      id: 'activity-history',
      title: 'Activity History & Audit Trail',
      category: 'admin',
      icon: History,
      targetView: 'activityHistory',
      badge: 'Security Audit',
      description: 'Tamper-evident audit trail capturing all system events, status changes, hearing updates, and logins.',
      content: {
        overview: 'For accountability and regulatory compliance, every operational action taken in the SIC Management System is automatically recorded in the Activity History audit log.',
        whereToGo: {
          location: 'Left Navigation -> "Activity History"',
          permissionRequired: 'activityHistory'
        },
        howToDo: [
          {
            step: 1,
            title: 'Inspect Recent Operations',
            description: 'View chronologically sorted logs of user activities: complaint registration, hearing date rescheduling, attendance marking, public body updates, and permission edits.',
            actions: [
              { label: 'Open Activity History', view: 'activityHistory' }
            ]
          },
          {
            step: 2,
            title: 'Filter Audit Logs',
            description: 'Use search and date filters to locate specific events (e.g. search "SIC-2026-01" to trace all modifications to complaint 01, or search an admin\'s username).',
            actions: [
              { label: 'Search Audit Logs', view: 'activityHistory' }
            ]
          }
        ],
        keyFeatures: [
          'Immutable audit logging for regulatory compliance',
          'Author identification, action description, and exact timestamp',
          'Fast search across historical records'
        ]
      }
    },
    {
      id: 'admin-management',
      title: 'User Management & Role-Based Permissions (RBAC)',
      category: 'admin',
      icon: Shield,
      targetView: 'adminManagement',
      badge: 'Super User Only',
      description: 'Provision staff accounts, assign granular permissions, disable accounts, and manage passwords.',
      content: {
        overview: 'The Commission Secretary or Super User has exclusive authority to create staff admin accounts and grant fine-grained permissions to specific modules.',
        whereToGo: {
          location: 'Left Navigation -> "Admin Management" (Visible to Super User)',
          permissionRequired: 'adminManagement'
        },
        howToDo: [
          {
            step: 1,
            title: 'Create a New Admin Account',
            description: 'Click the "+ Add Admin" button -> Enter Full Name, Username, and initial password.',
            actions: [
              { label: 'Open Admin Management', view: 'adminManagement' }
            ]
          },
          {
            step: 2,
            title: 'Assign Granular Module Permissions',
            description: 'Check off the modules this staff member is authorized to access (e.g. Complaints, Cause List, Public Bodies, Readers, Activity History). Staff without a permission will not see that module in their navigation.',
            actions: [
              { label: 'Configure Staff Permissions', view: 'adminManagement' }
            ]
          },
          {
            step: 3,
            title: 'Suspend or Re-enable Accounts',
            description: 'Toggle the status switch on any user row to deactivate access immediately.',
            actions: [
              { label: 'Manage Admin Accounts', view: 'adminManagement' }
            ]
          }
        ],
        keyFeatures: [
          'Role distinction: Super User (Full Unrestricted Access) vs Admin (Granular RBAC)',
          'Instant permission enforcement without requiring user relogin',
          'One-click credential resets and account deactivation'
        ]
      }
    },
    {
      id: 'faqs',
      title: 'Frequently Asked Questions & Troubleshooting',
      category: 'faq',
      icon: HelpCircle,
      badge: 'Q & A',
      description: 'Answers to common questions regarding hearings, readers, printouts, and system behavior.',
      content: {
        overview: 'Quick solutions and answers to common procedural and technical questions encountered during day-to-day operations.',
        whereToGo: {
          location: 'Refer to this section whenever an unexpected issue or procedural question arises.'
        },
        howToDo: [
          {
            step: 1,
            title: 'What should I do if a complaint shows "Unassigned" reader?',
            description: 'This happens if neither the complaint nor the public body has a division or district that matches a configured reader. Simply open the complaint in "Complaints" -> edit the location to a recognized Sindh district or division, or go to "Readers" to expand the reader\'s jurisdiction.',
            actions: [
              { label: 'Open Complaints Registry', view: 'complaints' },
              { label: 'Open Readers Jurisdictions', view: 'readers' }
            ]
          },
          {
            step: 2,
            title: 'How do I print the daily Cause List for courtroom display?',
            description: 'Go to "Cause List", select the target date, and click the "Print Cause List" button at the top-right. The page will format cleanly into an official courtroom table with headers and signature blocks.',
            actions: [
              { label: 'Go to Cause List', view: 'causeList' }
            ]
          },
          {
            step: 3,
            title: 'How do I switch between Light and Dark theme?',
            description: 'Look at the bottom of the Left Navigation sidebar. Click the "Light Mode / Dark Mode" toggle button. Your preference is saved locally and applies instantly across all screens.'
          },
          {
            step: 4,
            title: 'How do I change my account password or avatar?',
            description: 'At the bottom of the left navigation, click on your user profile banner -> Click the "Key" icon to change password, or click the "Edit Profile" icon to update your name and profile avatar.'
          },
          {
            step: 5,
            title: 'Are scrollbars missing from the application?',
            description: 'No, scrollbars have been visually hidden to provide a clean, modern interface, but scrolling functionality remains 100% active via mouse wheel, trackpad, touchscreen, or arrow keys on every page and table.'
          },
          {
            step: 6,
            title: 'How do I share a complaint, cause list, or designated official in chat?',
            description: 'In any chat box (Internal Chat or Floating Popup Chat), use smart trigger keys: type "#" to search and link any registered complaint, ">" to share today\'s or upcoming Cause Lists, "!" to link a Public Body/Department, "*" to share a Designated Official (PIO), and "@" to mention a colleague. The message will render a live card with a one-click button that navigates directly to the case, docket, or officer record.',
            actions: [
              { label: 'Open Chat', view: 'chat' },
              { label: 'View Chat Keys Guide', view: 'documentation' }
            ]
          }
        ]
      }
    }
  ], []);

  // Filter sections based on search and category
  const filteredSections = useMemo(() => {
    return docSections.filter(sec => {
      const matchesCategory = selectedCategory === 'all' || sec.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inTitle = sec.title.toLowerCase().includes(q);
      const inDesc = sec.description.toLowerCase().includes(q);
      const inOverview = sec.content.overview.toLowerCase().includes(q);
      const inSteps = sec.content.howToDo.some(step => 
        step.title.toLowerCase().includes(q) || step.description.toLowerCase().includes(q)
      );
      const inFeatures = sec.content.keyFeatures?.some(f => f.toLowerCase().includes(q));

      return inTitle || inDesc || inOverview || inSteps || inFeatures;
    });
  }, [docSections, selectedCategory, searchQuery]);

  const activeSection = useMemo(() => {
    return docSections.find(s => s.id === activeSectionId) || docSections[0];
  }, [docSections, activeSectionId]);

  const handlePrint = () => {
    window.print();
  };

  const handleJumpToSection = (sectionId: string, targetView?: string) => {
    setActiveSectionId(sectionId);
    if (targetView && onNavigate) {
      // Optional direct navigation
    }
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden transition-colors">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Official System Documentation & User Manual</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
              SIC Management System Guide
            </h1>
            <p className="text-neutral-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Comprehensive reference manual explaining how each feature works, where to go for every Commission task, step-by-step instructions, and operational best practices.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 text-neutral-700 dark:text-slate-200 text-sm font-medium transition-colors cursor-pointer border border-neutral-200 dark:border-slate-700"
              title="Print or Save Documentation as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print Manual</span>
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors cursor-pointer shadow-xs"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="mt-6 relative max-w-2xl">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, workflows, questions... (e.g. 'how to add complaint', 'reader allotment', 'attendance', 'cause list')"
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-950 text-neutral-900 dark:text-white text-sm placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:text-slate-400 dark:hover:text-white px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        {/* Actionable Feature Launchpad */}
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-slate-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Direct Feature Launchpad (All Applications & Modules)
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-slate-400 hidden sm:inline">
              Click any feature below to navigate instantly
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {APPLICATION_FEATURES.map((feat) => {
              const Icon = feat.icon;
              const allowed = canAccessView(feat.permissionKey);
              return (
                <button
                  key={feat.id}
                  onClick={() => {
                    if (allowed && onNavigate) {
                      onNavigate(feat.id);
                    }
                  }}
                  disabled={!allowed}
                  className={`group relative p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    allowed
                      ? 'bg-neutral-50 dark:bg-slate-950/80 border-neutral-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer shadow-2xs hover:shadow-xs'
                      : 'bg-neutral-100/60 dark:bg-slate-900/40 border-neutral-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                  }`}
                  title={allowed ? `Open ${feat.name}` : `Requires ${feat.permissionKey} permission`}
                >
                  <div className="flex items-start justify-between w-full mb-2">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-400 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    {allowed ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                    ) : (
                      <Shield className="w-3 h-3 text-neutral-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      {feat.name}
                    </h4>
                    <p className="text-[10px] text-neutral-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {feat.badge || feat.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Topics' },
          { id: 'quickstart', label: '🎯 Where to Go for What?' },
          { id: 'core', label: '⚖️ Core Hearings & Complaints' },
          { id: 'records', label: '🏛️ Public Bodies & Readers' },
          { id: 'collab', label: '💬 Team Collaboration' },
          { id: 'admin', label: '🛡️ Admin & Security' },
          { id: 'faq', label: '❓ FAQs & Solutions' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer border ${
              selectedCategory === cat.id
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-neutral-600 dark:text-slate-300 border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Topics Sidebar + Detailed Content View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation: Sections List */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-slate-400">
              Documentation Chapters ({filteredSections.length})
            </span>
          </div>

          <div className="space-y-1.5">
            {filteredSections.map(section => {
              const IconComponent = section.icon;
              const isActive = activeSectionId === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isActive
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-neutral-200 dark:border-slate-800 hover:border-neutral-300 dark:hover:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isActive 
                      ? 'bg-amber-500 text-white dark:bg-amber-500' 
                      : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <h3 className={`text-sm font-semibold truncate ${
                        isActive ? 'text-amber-950 dark:text-amber-200' : 'text-neutral-900 dark:text-white'
                      }`}>
                        {section.title}
                      </h3>
                      {section.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 border border-neutral-200 dark:border-slate-700">
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {section.description}
                    </p>
                  </div>
                </button>
              );
            })}

            {filteredSections.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl">
                <Search className="w-8 h-8 text-neutral-400 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-700 dark:text-slate-300">No matching chapters found</p>
                <p className="text-xs text-neutral-500 dark:text-slate-400 mt-1">Try searching with a different term like "complaints", "cause list", or "chat".</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Details Panel: In-Depth Step-by-Step Guide */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs transition-colors">
            {/* Active Topic Header */}
            <div className="border-b border-neutral-200 dark:border-slate-800 pb-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                    <activeSection.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Chapter: {activeSection.category.toUpperCase()}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                      {activeSection.title}
                    </h2>
                  </div>
                </div>

                {activeSection.targetView && onNavigate && (
                  <button
                    onClick={() => onNavigate(activeSection.targetView!)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>Launch Feature</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="mt-4 text-sm sm:text-base text-neutral-600 dark:text-slate-300 leading-relaxed">
                {activeSection.content.overview}
              </p>
            </div>

            {/* Where to Go Box */}
            <div className="bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 rounded-xl p-4.5 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Where to Go in the Application
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-neutral-900 dark:text-white flex-wrap">
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Menu Location
                  </span>
                  <span>{activeSection.content.whereToGo.location}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  {activeSection.content.whereToGo.permissionRequired && (
                    <div className="text-xs text-neutral-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-neutral-400 dark:text-slate-500" />
                      <span>Permission: <code className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-slate-800 font-mono text-[11px]">{activeSection.content.whereToGo.permissionRequired}</code></span>
                    </div>
                  )}

                  {activeSection.targetView && onNavigate && canAccessView(activeSection.content.whereToGo.permissionRequired) && (
                    <button
                      onClick={() => onNavigate(activeSection.targetView!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Open Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Chat Keys Cheat Sheet & Visual Guide (for chat-keys or internal-chat) */}
            {(activeSection.id === 'chat-keys' || activeSection.id === 'internal-chat') && (
              <div className="p-5 rounded-2xl bg-linear-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/20 border border-emerald-300/60 dark:border-emerald-800/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-200/80 dark:border-emerald-800/50">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      <Hash className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        Chat Keys &amp; Smart Links Cheat Sheet
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          Live Autocomplete
                        </span>
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-slate-400">
                        Type any trigger key in the message composer to open real-time search and generate interactive cards with one-click navigation.
                      </p>
                    </div>
                  </div>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('chat')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      <span>Open Chat to Test</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 5 Chat Key Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* # Complaint */}
                  <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900 flex flex-col justify-between gap-2.5 shadow-2xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <kbd className="px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-mono font-bold text-sm border border-amber-300 dark:border-amber-800 shadow-2xs">
                            #
                          </kbd>
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">
                            Link Complaint / Case
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                          Registry
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-slate-300">
                        Type <code className="px-1 py-0.5 font-mono text-[11px] bg-neutral-100 dark:bg-slate-800 rounded">#</code> to search complaints by registration number, complainant name, respondent, or district.
                      </p>
                      <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-[11px] font-mono text-amber-900 dark:text-amber-300">
                        Token: #SIC-2026-XX
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                        <strong>In Chat:</strong> Renders a compact, fixed-width case card with status badge &amp; a <span className="font-semibold text-amber-700 dark:text-amber-400">"Details"</span> button opening Complaint Details directly.
                      </p>
                    </div>
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('complaints')}
                        className="inline-flex items-center justify-center gap-1 w-full py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-900/60 transition-colors cursor-pointer"
                      >
                        <span>View Complaints Registry</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* > Cause List */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900 flex flex-col justify-between gap-2.5 shadow-2xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <kbd className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-mono font-bold text-sm border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                            &gt;
                          </kbd>
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">
                            Link Courtroom Cause List
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                          Hearings
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-slate-300">
                        Type <code className="px-1 py-0.5 font-mono text-[11px] bg-neutral-100 dark:bg-slate-800 rounded">&gt;</code> to browse Today's courtroom docket and all upcoming hearing dates with case counts.
                      </p>
                      <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 text-[11px] font-mono text-emerald-900 dark:text-emerald-300">
                        Token: &gt; Cause List: DD-MM-YYYY (Today / In Xd)
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                        <strong>In Chat:</strong> Renders a docket card with hearing date, scheduled count &amp; a <span className="font-semibold text-emerald-700 dark:text-emerald-400">"View Cause List"</span> button.
                      </p>
                    </div>
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('causeList')}
                        className="inline-flex items-center justify-center gap-1 w-full py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-900/60 transition-colors cursor-pointer"
                      >
                        <span>Open Cause List Schedule</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* ! Public Body */}
                  <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900 flex flex-col justify-between gap-2.5 shadow-2xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <kbd className="px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 font-mono font-bold text-sm border border-indigo-300 dark:border-indigo-800 shadow-2xs">
                            !
                          </kbd>
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">
                            Link Public Body / Dept
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500 dark:text-slate-400">
                          also $ or /pb
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-slate-300">
                        Type <code className="px-1 py-0.5 font-mono text-[11px] bg-neutral-100 dark:bg-slate-800 rounded">!</code> followed by department name to search Sindh government bodies, divisions, and assigned readers.
                      </p>
                      <div className="p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/40 text-[11px] font-mono text-indigo-900 dark:text-indigo-300">
                        Token: !School Education &amp; Literacy Dept
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                        <strong>In Chat:</strong> Renders department card with assigned reader, district &amp; <span className="font-semibold text-indigo-700 dark:text-indigo-400">"View Department"</span> button.
                      </p>
                    </div>
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('publicBodies')}
                        className="inline-flex items-center justify-center gap-1 w-full py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg border border-indigo-200 dark:border-indigo-900/60 transition-colors cursor-pointer"
                      >
                        <span>Open Public Bodies Directory</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* * Designated Official */}
                  <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-white dark:bg-slate-900 flex flex-col justify-between gap-2.5 shadow-2xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <kbd className="px-2.5 py-1 rounded-md bg-teal-100 dark:bg-teal-950/80 text-teal-900 dark:text-teal-200 font-mono font-bold text-sm border border-teal-300 dark:border-teal-800 shadow-2xs">
                            *
                          </kbd>
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">
                            Link Designated Official (PIO)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500 dark:text-slate-400">
                          also ~, ^, /do
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-slate-300">
                        Type <code className="px-1 py-0.5 font-mono text-[11px] bg-neutral-100 dark:bg-slate-800 rounded">*</code> followed by officer name to search Public Information Officers with verified contacts.
                      </p>
                      <div className="p-2 rounded-lg bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/40 text-[11px] font-mono text-teal-900 dark:text-teal-300">
                        Token: *Rashid Ali (Director, Health Dept)
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                        <strong>In Chat:</strong> Renders officer card with designation, phone, email &amp; <span className="font-semibold text-teal-700 dark:text-teal-400">"View Official"</span> button.
                      </p>
                    </div>
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('designatedOfficials')}
                        className="inline-flex items-center justify-center gap-1 w-full py-1 text-xs font-medium text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-lg border border-teal-200 dark:border-teal-900/60 transition-colors cursor-pointer"
                      >
                        <span>Open Designated Officials (PIOs)</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Mentions & Keyboard Controls Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* @ Mention */}
                  <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-900 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <kbd className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 font-mono font-bold text-sm border border-blue-300 dark:border-blue-800 shadow-2xs">
                          @
                        </kbd>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white">
                          Mention Colleague or Admin
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                        Team
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-slate-300">
                      Type <code className="px-1 py-0.5 font-mono text-[11px] bg-neutral-100 dark:bg-slate-800 rounded">@</code> to filter SuperUsers and Admins. Tagged members receive instant notifications and styled role badges.
                    </p>
                    <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 text-[11px] font-mono text-blue-900 dark:text-blue-300">
                      Token: @Zahid Hussain (SuperUser)
                    </div>
                  </div>

                  {/* Keyboard Controls Box */}
                  <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-2xs">
                    <h5 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
                      Keyboard Controls in Autocomplete
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 font-mono text-[10px]">↑</kbd>
                        <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 font-mono text-[10px]">↓</kbd>
                        <span>Navigate items</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 font-mono text-[10px]">Enter</kbd>
                        <span>Insert link</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 font-mono text-[10px]">Tab</kbd>
                        <span>Autocomplete</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 font-mono text-[10px]">Esc</kbd>
                        <span>Close popover</span>
                      </div>
                    </div>
                    <div className="pt-1 text-[10px] text-neutral-500 dark:text-slate-400 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between">
                      <span><kbd className="px-1 py-0.5 bg-neutral-100 dark:bg-slate-800 rounded font-mono">Shift+Enter</kbd> = New line</span>
                      <span><kbd className="px-1 py-0.5 bg-neutral-100 dark:bg-slate-800 rounded font-mono">Enter</kbd> = Send message</span>
                    </div>
                  </div>
                </div>

                {/* Case File Linking Banner */}
                <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/80 flex items-start gap-2.5 text-xs text-emerald-950 dark:text-emerald-200">
                  <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Attach Shared Chat Documents Directly to Cases: </span>
                    <span>
                      When any PDF, order, or image file is received in chat, click <strong className="underline">"Attach to Complaint"</strong> or <strong className="underline">"Add to Case"</strong> to directly save that document into the official case proceedings of any selected complaint.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step by Step "How to Do" */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Step-by-Step How To Do
              </h3>

              <div className="space-y-3.5">
                {activeSection.content.howToDo.map((step) => (
                  <div
                    key={step.step}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-neutral-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-amber-300 dark:border-amber-800/60">
                        {step.step}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {step.title}
                          </h4>
                          {step.actions && step.actions.length > 0 && onNavigate && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {step.actions.map((act, aIdx) => {
                                const allowed = canAccessView(act.permissionKey);
                                return (
                                  <button
                                    key={aIdx}
                                    onClick={() => {
                                      if (allowed) onNavigate(act.view);
                                    }}
                                    disabled={!allowed}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border ${
                                      allowed
                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                                        : 'bg-neutral-100 dark:bg-slate-800 text-neutral-400 dark:text-slate-500 border-neutral-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
                                    }`}
                                    title={allowed ? `Navigate to ${act.label}` : 'Access restricted for your role'}
                                  >
                                    <span>{act.label}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-slate-300 leading-relaxed">
                          {step.description}
                        </p>

                        {step.tip && (
                          <div className="text-xs flex items-start gap-1.5 text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/40 p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/60">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                            <span><strong>Pro-Tip:</strong> {step.tip}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Features & System Rules */}
            {activeSection.content.keyFeatures && (
              <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-slate-300 flex items-center gap-1.5 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Key Capabilities & Automated Behaviors
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeSection.content.keyFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50 dark:bg-slate-950 text-xs font-medium text-neutral-700 dark:text-slate-300 border border-neutral-200 dark:border-slate-800"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Administrative Rules */}
            {activeSection.content.rulesOrNotes && (
              <div className="mt-6 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Statutory & Operational Rules
                </h4>
                <ul className="space-y-1.5 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed list-none">
                  {activeSection.content.rulesOrNotes.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-600 dark:text-amber-400 shrink-0">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Frequently Asked Questions Interactive Accordion */}
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs transition-colors space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Quick Solutions & Common Queries
                </h3>
                <p className="text-xs text-neutral-500 dark:text-slate-400">
                  Click any question to view immediate resolution steps.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  q: 'Where do I go to print the daily Cause List for courtrooms?',
                  a: 'Navigate to "Cause List" in the left navigation sidebar. Select the hearing date you want to print, then click the "Print Cause List" button at the top-right of the Cause List card. The layout automatically formats into an official paper docket.'
                },
                {
                  q: 'How does the system know which Reader to allot to a new complaint?',
                  a: 'The system uses the Commission\'s jurisdictional rules. When you choose a Division (e.g. Karachi) and District (e.g. South), it matches the assigned reader (Reader I for Karachi, Reader II for Hyderabad/Mirpur Khas/SBA, Reader III for Sukkur/Larkana). You can see the allotment in real-time on the form.'
                },
                {
                  q: 'What should I do if a public body is not appearing in the dropdown?',
                  a: 'You can directly type any new Public Body title into the Public Body input field in the Add Complaint form. Alternatively, if you have permissions, open "Public Bodies" from the left menu and click "+ Add Public Body" to register it permanently with its official contacts and website.'
                },
                {
                  q: 'How do I mark attendance during a hearing?',
                  a: 'Open "Cause List", locate the case on the docket, and click "Mark Attendance". Check the status for Complainant, Respondent Official, and Legal Counsel. Alternatively, you can open the case in "Complaints" -> "Complaint Details" -> "Attendance History" tab.'
                },
                {
                  q: 'Why does an admin user see an "Access Restricted" message on certain sections?',
                  a: 'The Super User configures Role-Based Access Control (RBAC). If a staff member needs access to Complaints, Cause List, or Public Bodies, a Super User can enable those permissions in "Admin Management".'
                }
              ].map((faq, idx) => {
                const isOpen = expandedFaqs.includes(idx);
                return (
                  <div
                    key={idx}
                    className="border border-neutral-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full text-left px-4 py-3.5 bg-neutral-50/70 dark:bg-slate-950/60 hover:bg-neutral-100/80 dark:hover:bg-slate-800 flex items-center justify-between gap-3 text-sm font-semibold text-neutral-800 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-purple-600 dark:text-purple-400">Q:</span>
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0 rotate-180 transition-transform" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0 transition-transform" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3.5 bg-white dark:bg-slate-900 border-t border-neutral-200 dark:border-slate-800 text-xs sm:text-sm text-neutral-600 dark:text-slate-300 leading-relaxed">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
