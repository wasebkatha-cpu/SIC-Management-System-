import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Save, 
  Building2, 
  User, 
  FileText, 
  Calendar, 
  Mail, 
  Phone, 
  Globe, 
  Shield, 
  IdCard,
  Send,
  MapPin,
  Scale,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext, SINDH_DIVISIONS, ComplaintData } from '../context/AppContext';

interface ComplaintFormProps {
  onBack: () => void;
  initialData?: ComplaintData;
}

export default function ComplaintForm({ onBack, initialData }: ComplaintFormProps) {
  const { complaints, addComplaint, updateComplaint, publicBodies, readers, getReaderForLocation, addPublicBody } = useAppContext();
  const { logActivity, user } = useAuth();

  // Complainant fields
  const [complaintNo, setComplaintNo] = useState('');
  const [complainantName, setComplainantName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gender, setGender] = useState('Male');
  const [cnicNo, setCnicNo] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [emailAddress, setEmailAddress] = useState('');

  // Public Body fields
  const [respondentName, setRespondentName] = useState('');
  const [designatedOfficialName, setDesignatedOfficialName] = useState('');
  const [designatedOfficialDesignation, setDesignatedOfficialDesignation] = useState('');
  const [designatedOfficialContact, setDesignatedOfficialContact] = useState('');
  const [website, setWebsite] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');

  // First Application fields
  const [firstAppDate, setFirstAppDate] = useState('');
  const [firstAppMethod, setFirstAppMethod] = useState('');

  // Internal Review fields
  const [internalReviewDate, setInternalReviewDate] = useState('');
  const [internalReviewMethod, setInternalReviewMethod] = useState('');

  useEffect(() => {
    if (initialData) {
      setComplaintNo(initialData.complaintNo);
      setComplainantName(initialData.complainantName);
      setRespondentName(initialData.respondentName);
      setDesignatedOfficialName(initialData.designatedOfficialName || '');
      setDistrict(initialData.district || '');
      setDivision(initialData.division || '');
      
      if (initialData.additionalFields) {
        initialData.additionalFields.forEach(field => {
          if (field.name === "Father's Name") setFatherName(field.value);
          if (field.name === 'Gender') setGender(field.value);
          if (field.name === 'CNIC') setCnicNo(field.value);
          if (field.name === 'Contact No') setContactNo(field.value);
          if (field.name === 'Email') setEmailAddress(field.value);
          if (field.name === 'Official Designation') setDesignatedOfficialDesignation(field.value);
          if (field.name === '1st App Date') setFirstAppDate(field.value);
          if (field.name === '1st App Mode') setFirstAppMethod(field.value);
          if (field.name === 'Internal Review Date') setInternalReviewDate(field.value);
          if (field.name === 'Internal Review Mode') setInternalReviewMethod(field.value);
        });
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData) return;
    const currentYear = new Date().getFullYear();
    const prefix = `SIC-${currentYear}-`;
    
    const complaintsThisYear = complaints
      .filter(c => c.complaintNo.startsWith(prefix))
      .map(c => {
        const parts = c.complaintNo.split('-');
        return parseInt(parts[2], 10);
      })
      .filter(n => !isNaN(n));
      
    const nextNumber = complaintsThisYear.length > 0 ? Math.max(...complaintsThisYear) + 1 : 1;
    const formattedNumber = nextNumber.toString().padStart(2, '0');
    
    setComplaintNo(`${prefix}${formattedNumber}`);
  }, [complaints, initialData]);

  // Derive all available divisions across Sindh divisions, readers, public bodies & complaints
  const availableDivisions = useMemo(() => {
    const set = new Set<string>(Object.keys(SINDH_DIVISIONS));
    readers.forEach(r => r.assignedDivisions?.forEach(d => { if (d) set.add(d); }));
    publicBodies.forEach(pb => { if (pb.division) set.add(pb.division); });
    complaints.forEach(c => { if (c.division) set.add(c.division); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [readers, publicBodies, complaints]);

  // Helper to fetch districts under a given division
  const getDistrictsForDivision = (divName: string): string[] => {
    if (!divName) return [];
    const matchKey = Object.keys(SINDH_DIVISIONS).find(k => k.toLowerCase() === divName.toLowerCase());
    const list = matchKey ? [...SINDH_DIVISIONS[matchKey]] : [];

    readers.forEach(r => {
      if (r.assignedDivisions?.some(d => d.toLowerCase() === divName.toLowerCase())) {
        r.assignedDistricts?.forEach(dist => {
          if (!list.some(l => l.toLowerCase() === dist.toLowerCase())) {
            list.push(dist);
          }
        });
      }
    });

    publicBodies.forEach(pb => {
      if (pb.division && pb.division.toLowerCase() === divName.toLowerCase() && pb.district) {
        if (!list.some(l => l.toLowerCase() === pb.district.toLowerCase())) {
          list.push(pb.district);
        }
      }
    });

    return list.sort((a, b) => a.localeCompare(b));
  };

  // Helper to find parent division for a selected district
  const findDivisionForDistrict = (distName: string): string => {
    if (!distName) return '';
    for (const [div, districts] of Object.entries(SINDH_DIVISIONS)) {
      if (districts.some(d => d.toLowerCase() === distName.toLowerCase())) {
        return div;
      }
    }
    const pb = publicBodies.find(p => p.district && p.district.toLowerCase() === distName.toLowerCase());
    if (pb?.division) return pb.division;

    for (const r of readers) {
      if (r.assignedDistricts?.some(d => d.toLowerCase() === distName.toLowerCase()) && r.assignedDivisions?.length > 0) {
        return r.assignedDivisions[0];
      }
    }
    return '';
  };

  // Derive districts list (dependent on selected Division)
  const availableDistricts = useMemo(() => {
    if (division) {
      return getDistrictsForDivision(division);
    }
    // If no division selected yet, aggregate all known districts
    const set = new Set<string>();
    Object.values(SINDH_DIVISIONS).flat().forEach(d => set.add(d));
    readers.forEach(r => r.assignedDistricts?.forEach(d => { if (d) set.add(d); }));
    publicBodies.forEach(pb => { if (pb.district) set.add(pb.district); });
    complaints.forEach(c => { if (c.district) set.add(c.district); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [division, readers, publicBodies, complaints]);

  // Automatic Reader allotment in compliance with Readers feature
  const autoAssignedReader = useMemo(() => {
    const readerByLoc = getReaderForLocation(division, district);
    if (readerByLoc) return readerByLoc;
    const matchedPB = publicBodies.find(pb => pb.name.toLowerCase() === respondentName.trim().toLowerCase());
    if (matchedPB?.reader && matchedPB.reader !== 'Unassigned') return matchedPB.reader;
    return 'Unassigned';
  }, [division, district, respondentName, publicBodies, getReaderForLocation]);

  // Handle auto-population if existing public body is chosen
  const handlePublicBodyChange = (name: string) => {
    setRespondentName(name);
    const matched = publicBodies.find(pb => pb.name.toLowerCase() === name.trim().toLowerCase());
    if (matched) {
      if (matched.designatedOfficialName && !designatedOfficialName) {
        setDesignatedOfficialName(matched.designatedOfficialName);
      }
      if (matched.designatedOfficialDesignation && !designatedOfficialDesignation) {
        setDesignatedOfficialDesignation(matched.designatedOfficialDesignation);
      }
      if (matched.contactNumber && !designatedOfficialContact) {
        setDesignatedOfficialContact(matched.contactNumber);
      }
      if (matched.website && !website) {
        setWebsite(matched.website);
      }
      if (matched.division && !division) {
        setDivision(matched.division);
      }
      if (matched.district && !district) {
        setDistrict(matched.district);
      }
    }
  };

  const handleDivisionChange = (newDivision: string) => {
    setDivision(newDivision);
    if (district && newDivision) {
      const validDistricts = getDistrictsForDivision(newDivision);
      if (!validDistricts.some(d => d.toLowerCase() === district.toLowerCase())) {
        setDistrict('');
      }
    }
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    if (newDistrict && !division) {
      const parentDiv = findDivisionForDistrict(newDistrict);
      if (parentDiv) {
        setDivision(parentDiv);
      }
    }
  };

  const submitMethods = ['By Hand', 'By Courier', 'By Mail', 'By Web Portal'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Resolve matching reader strictly in compliance with Readers allotment logic
    const assignedReader = autoAssignedReader;

    const additionalFields: { name: string; value: string }[] = [];
    if (fatherName) additionalFields.push({ name: "Father's Name", value: fatherName });
    if (gender) additionalFields.push({ name: 'Gender', value: gender });
    if (cnicNo) additionalFields.push({ name: 'CNIC', value: cnicNo });
    if (contactNo) additionalFields.push({ name: 'Contact No', value: contactNo });
    if (emailAddress) additionalFields.push({ name: 'Email', value: emailAddress });
    if (designatedOfficialDesignation) additionalFields.push({ name: 'Official Designation', value: designatedOfficialDesignation });
    if (firstAppDate) additionalFields.push({ name: '1st App Date', value: firstAppDate });
    if (firstAppMethod) additionalFields.push({ name: '1st App Mode', value: firstAppMethod });
    if (internalReviewDate) additionalFields.push({ name: 'Internal Review Date', value: internalReviewDate });
    if (internalReviewMethod) additionalFields.push({ name: 'Internal Review Mode', value: internalReviewMethod });

    const matchedPB = publicBodies.find(pb => pb.name.toLowerCase() === respondentName.trim().toLowerCase());

    const canManagePublicBodies = user?.role === 'superUser' || user?.role === 'admin';
    const exactMatch = publicBodies.find(pb => 
      pb.name.toLowerCase() === respondentName.trim().toLowerCase() && 
      (pb.designatedOfficialName || '').toLowerCase() === (designatedOfficialName || '').trim().toLowerCase()
    );

    if (!exactMatch && canManagePublicBodies && respondentName.trim()) {
      addPublicBody({
        id: `pb-${Date.now()}`,
        srNo: publicBodies.length + 1,
        name: respondentName.trim(),
        designatedOfficialName: (designatedOfficialName || '').trim(),
        designatedOfficialDesignation: (designatedOfficialDesignation || '').trim(),
        headOfDepartmentName: '',
        headOfDepartmentDesignation: '',
        district: district || '',
        division: division || '',
        reader: assignedReader || 'Unassigned',
        website: website || '',
        email: emailAddress || '',
        contactNumber: designatedOfficialContact || '',
        address: '',
      });
    }

    if (initialData) {
      await updateComplaint(complaintNo, {
        complainantName: complainantName || 'Unknown Complainant',
        respondentName: respondentName || 'Pending Respondent',
        designatedOfficialName: designatedOfficialName || undefined,
        district: district || matchedPB?.district || undefined,
        division: division || matchedPB?.division || undefined,
        reader: assignedReader,
        additionalFields: additionalFields.length > 0 ? additionalFields : undefined,
      });

      if (complainantName) {
        await logActivity(`Updated complaint ${complaintNo} details for ${complainantName}`);
      } else {
        await logActivity(`Updated complaint ${complaintNo} details`);
      }
    } else {
      addComplaint({
        complaintNo: complaintNo,
        complainantName: complainantName || 'Unknown Complainant',
        respondentName: respondentName || 'Pending Respondent',
        designatedOfficialName: designatedOfficialName || undefined,
        district: district || matchedPB?.district || undefined,
        division: division || matchedPB?.division || undefined,
        counselorComplainant: '-',
        counselorRespondent: '-',
        previousHearingDate: '',
        nextHearingDate: '',
        statusStage: 'Initial Review',
        remarks: 'Newly registered complaint',
        reader: assignedReader,
        additionalFields: additionalFields.length > 0 ? additionalFields : undefined,
        attendanceHistory: [],
        proceedings: [],
        diaries: []
      });

      if (complainantName) {
        await logActivity(`Registered new complaint ${complaintNo} for ${complainantName}`);
      } else {
        await logActivity(`Registered new complaint ${complaintNo}`);
      }
    }
    onBack();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Complaints List
      </button>

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Complaint Registration</h1>
          <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">
            Fill out the details below to register a new RTI complaint in the commission.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-xs font-semibold text-blue-700 dark:text-blue-300 self-start sm:self-auto">
          <Shield className="w-3.5 h-3.5" />
          <span>Case ID: {complaintNo}</span>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Complainant Information */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50/80 dark:bg-slate-800/60 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Complainant Information
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                Complaint No. <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                disabled={!!initialData}
                value={complaintNo}
                onChange={(e) => setComplaintNo(e.target.value.toUpperCase())}
                className={`w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${!!initialData ? 'opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-slate-900' : ''}`}
                placeholder="e.g. SIC-2026-01" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                Complainant Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                value={complainantName}
                onChange={(e) => setComplainantName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="Enter full name" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                Father's Name
              </label>
              <input 
                type="text" 
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="Enter father's name" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                CNIC No.
              </label>
              <input 
                type="text" 
                value={cnicNo}
                onChange={(e) => setCnicNo(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="e.g. 12345-1234567-1" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                CNIC Attachment
              </label>
              <input 
                type="file" 
                className="block w-full text-sm text-neutral-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/70 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/70 border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg cursor-pointer transition-colors p-1" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                Contact No
              </label>
              <input 
                type="tel" 
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="Enter contact number" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                Mail Address
              </label>
              <input 
                type="email" 
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="Enter email address" 
              />
            </div>
          </div>
        </div>

        {/* Public Body Details */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50/80 dark:bg-slate-800/60 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
              <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Public Body Details
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                Public Body Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                list="public-bodies-list"
                value={respondentName}
                onChange={(e) => handlePublicBodyChange(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="Select or enter public body name" 
              />
              <datalist id="public-bodies-list">
                {publicBodies.map((pb) => (
                  <option key={pb.id} value={pb.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                Designated Official Name
              </label>
              <input 
                type="text" 
                value={designatedOfficialName}
                onChange={(e) => setDesignatedOfficialName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="Enter official's name" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                Designation
              </label>
              <input 
                type="text" 
                value={designatedOfficialDesignation}
                onChange={(e) => setDesignatedOfficialDesignation(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="Enter designation" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                Contact No. of Designated Official
              </label>
              <input 
                type="tel" 
                value={designatedOfficialContact}
                onChange={(e) => setDesignatedOfficialContact(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="Enter contact number" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                Website
              </label>
              <input 
                type="url" 
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="https://" 
              />
            </div>

            {/* Field: Divisions */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Divisions
                </label>
                {division && (
                  <button
                    type="button"
                    onClick={() => handleDivisionChange('')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={division}
                onChange={(e) => handleDivisionChange(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-neutral-900 dark:text-white">
                  Select Division...
                </option>
                {availableDivisions.map(divName => (
                  <option key={divName} value={divName} className="bg-white dark:bg-slate-900 text-neutral-900 dark:text-white">
                    {divName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 dark:text-slate-400 mt-1">
                Division jurisdiction for reader allotment & complaint listing filter.
              </p>
            </div>

            {/* Sub-field: District */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  District
                  <span className="text-xs text-neutral-400 dark:text-slate-500 font-normal">
                    {division ? `(Sub-field of ${division})` : '(Sub-field of Division)'}
                  </span>
                </label>
                {district && (
                  <button
                    type="button"
                    onClick={() => setDistrict('')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <select
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-neutral-900 dark:text-white">
                  {division ? `Select District in ${division}...` : 'Select District (or choose Division first)...'}
                </option>
                {division ? (
                  availableDistricts.map(distName => (
                    <option key={distName} value={distName} className="bg-white dark:bg-slate-900 text-neutral-900 dark:text-white">
                      {distName}
                    </option>
                  ))
                ) : (
                  Object.entries(SINDH_DIVISIONS).map(([divGroup, districts]) => (
                    <optgroup key={divGroup} label={`${divGroup} Division`} className="bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-300 font-semibold">
                      {districts.map(distName => (
                        <option key={`${divGroup}-${distName}`} value={distName} className="bg-white dark:bg-slate-900 text-neutral-900 dark:text-white font-normal">
                          {distName} ({divGroup})
                        </option>
                      ))}
                    </optgroup>
                  ))
                )}
              </select>
              <p className="text-xs text-neutral-500 dark:text-slate-400 mt-1">
                {division ? `Sub-district belonging to ${division} Division.` : 'Dependent sub-field of Division.'}
              </p>
            </div>

            {/* Reader Feature Allotment Preview */}
            <div className="md:col-span-2 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/30 p-4 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-semibold text-neutral-700 dark:text-slate-200">
                      Reader Feature Allotment:
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      autoAssignedReader !== 'Unassigned'
                        ? 'bg-purple-600 text-white dark:bg-purple-500'
                        : 'bg-neutral-200 text-neutral-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {autoAssignedReader}
                    </span>
                    {autoAssignedReader !== 'Unassigned' && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        Compliant with Reader Assignment Rules
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {autoAssignedReader !== 'Unassigned'
                      ? `This complaint will automatically be assigned to ${autoAssignedReader} according to reader jurisdiction rules for ${district ? `District: ${district}, ` : ''}${division ? `Division: ${division}` : 'this location'}. It will be filterable under ${autoAssignedReader} in the Reader filter and ${district || division} in the District/Division filters in Complaint Listing.`
                      : (division || district)
                        ? `No reader is currently assigned to ${district ? `District: ${district}, ` : ''}${division ? `Division: ${division}` : ''}. It will be registered under 'Unassigned' and can be allotted via Reader Management.`
                        : 'Select Divisions and District to preview the automatic reader allotment and verify district filter compliance.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* First Application Details */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50/80 dark:bg-slate-800/60 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              First Application Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                  First Application Date
                </label>
                <input 
                  type="date" 
                  value={firstAppDate}
                  onChange={(e) => setFirstAppDate(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                  Submitted Through
                </label>
                <select 
                  className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={firstAppMethod}
                  onChange={(e) => setFirstAppMethod(e.target.value)}
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-neutral-900 dark:text-white">Select method...</option>
                  {submitMethods.map(method => (
                    <option key={method} value={method} className="bg-white dark:bg-slate-900 text-neutral-900 dark:text-white">{method}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional Uploads for First Application */}
            {firstAppMethod === 'By Hand' && (
              <div className="bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900/50 space-y-2">
                <label className="block text-sm font-semibold text-blue-900 dark:text-blue-300">
                  Upload First Application Receipt
                </label>
                <p className="text-xs text-neutral-600 dark:text-slate-400">
                  Please upload the application containing signature, stamp, and date of receipt by the Designated Official.
                </p>
                <input 
                  type="file" 
                  className="block w-full text-sm text-neutral-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white dark:file:bg-slate-800 file:border file:border-neutral-200 dark:file:border-slate-700 file:text-neutral-700 dark:file:text-slate-200 hover:file:bg-neutral-50 dark:hover:file:bg-slate-700 border border-neutral-200 dark:border-slate-700 rounded-lg cursor-pointer bg-white dark:bg-slate-950 p-1" 
                />
              </div>
            )}
            {firstAppMethod === 'By Courier' && (
              <div className="bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900/50 space-y-2">
                <label className="block text-sm font-semibold text-blue-900 dark:text-blue-300">
                  Upload Courier Receipt & Delivery Report
                </label>
                <p className="text-xs text-neutral-600 dark:text-slate-400">
                  Please upload the courier receipt along with the delivery report.
                </p>
                <input 
                  type="file" 
                  className="block w-full text-sm text-neutral-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white dark:file:bg-slate-800 file:border file:border-neutral-200 dark:file:border-slate-700 file:text-neutral-700 dark:file:text-slate-200 hover:file:bg-neutral-50 dark:hover:file:bg-slate-700 border border-neutral-200 dark:border-slate-700 rounded-lg cursor-pointer bg-white dark:bg-slate-950 p-1" 
                />
              </div>
            )}
          </div>
        </div>

        {/* Internal Review Details */}
        <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50/80 dark:bg-slate-800/60 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Internal Review Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                  Internal Review Application Dated
                </label>
                <input 
                  type="date" 
                  value={internalReviewDate}
                  onChange={(e) => setInternalReviewDate(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300 mb-1.5">
                  Submitted Through
                </label>
                <select 
                  className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={internalReviewMethod}
                  onChange={(e) => setInternalReviewMethod(e.target.value)}
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-neutral-900 dark:text-white">Select method...</option>
                  {submitMethods.map(method => (
                    <option key={method} value={method} className="bg-white dark:bg-slate-900 text-neutral-900 dark:text-white">{method}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional Uploads for Internal Review */}
            {internalReviewMethod === 'By Hand' && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50 space-y-2">
                <label className="block text-sm font-semibold text-amber-900 dark:text-amber-300">
                  Upload Internal Review Receipt
                </label>
                <p className="text-xs text-neutral-600 dark:text-slate-400">
                  Please upload the application containing signature, stamp, and date of receipt by the Head of Department.
                </p>
                <input 
                  type="file" 
                  className="block w-full text-sm text-neutral-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white dark:file:bg-slate-800 file:border file:border-neutral-200 dark:file:border-slate-700 file:text-neutral-700 dark:file:text-slate-200 hover:file:bg-neutral-50 dark:hover:file:bg-slate-700 border border-neutral-200 dark:border-slate-700 rounded-lg cursor-pointer bg-white dark:bg-slate-950 p-1" 
                />
              </div>
            )}
            {internalReviewMethod === 'By Courier' && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50 space-y-2">
                <label className="block text-sm font-semibold text-amber-900 dark:text-amber-300">
                  Upload Courier Receipt & Delivery Report
                </label>
                <p className="text-xs text-neutral-600 dark:text-slate-400">
                  Please upload the courier receipt along with the delivery report for the internal review.
                </p>
                <input 
                  type="file" 
                  className="block w-full text-sm text-neutral-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white dark:file:bg-slate-800 file:border file:border-neutral-200 dark:file:border-slate-700 file:text-neutral-700 dark:file:text-slate-200 hover:file:bg-neutral-50 dark:hover:file:bg-slate-700 border border-neutral-200 dark:border-slate-700 rounded-lg cursor-pointer bg-white dark:bg-slate-950 p-1" 
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 text-sm font-medium text-neutral-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:focus:ring-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Submit Complaint
          </button>
        </div>
      </form>
    </div>
  );
}

