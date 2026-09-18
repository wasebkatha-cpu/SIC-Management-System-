// Official Notice / Order document template generator for Sindh Information Commission

export function generateOfficialNoticeSvg(params: {
  title: string;
  complaintNo: string;
  date: string;
  complainantName: string;
  respondentName: string;
}): string {
  const { title, complaintNo, date, complainantName, respondentName } = params;
  
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="800" height="1100" style="background:#ffffff; font-family: 'Segoe UI', Arial, sans-serif;">
  <!-- Border and Official Header -->
  <rect x="25" y="25" width="750" height="1050" fill="#ffffff" stroke="#065f46" stroke-width="3" rx="4"/>
  <rect x="35" y="35" width="730" height="1030" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
  
  <!-- Crest / Monogram -->
  <g transform="translate(400, 95)" text-anchor="middle">
    <circle cx="0" cy="0" r="28" fill="#f0fdf4" stroke="#047857" stroke-width="2"/>
    <path d="M-14,4 Q0,-16 14,4 Q0,20 -14,4 Z" fill="#047857"/>
    <circle cx="0" cy="-2" r="4" fill="#ffffff"/>
    <path d="M-10,12 L0,2 L10,12" stroke="#ffffff" stroke-width="2" fill="none"/>
  </g>
  
  <!-- Header Text -->
  <text x="400" y="145" text-anchor="middle" font-size="13" font-weight="600" fill="#047857" letter-spacing="1">GOVERNMENT OF SINDH</text>
  <text x="400" y="170" text-anchor="middle" font-size="20" font-weight="bold" fill="#0f172a" letter-spacing="0.5">SINDH INFORMATION COMMISSION</text>
  <text x="400" y="190" text-anchor="middle" font-size="11" fill="#64748b">Sindh Secretariat, Court Road, Karachi - Phone: 021-99201234 - info@sic.sindh.gov.pk</text>
  
  <!-- Divider Line -->
  <line x1="60" y1="205" x2="740" y2="205" stroke="#047857" stroke-width="2"/>
  
  <!-- Ref Details -->
  <text x="65" y="235" font-size="12" font-weight="bold" fill="#334155">Case No: <tspan font-weight="bold" fill="#047857">${complaintNo}</tspan></text>
  <text x="735" y="235" text-anchor="end" font-size="12" font-weight="bold" fill="#334155">Dated: <tspan font-weight="normal" fill="#0f172a">${date}</tspan></text>
  
  <!-- Notice Badge / Heading -->
  <rect x="230" y="260" width="340" height="34" rx="6" fill="#ecfdf5" stroke="#a7f3d0"/>
  <text x="400" y="282" text-anchor="middle" font-size="14" font-weight="bold" fill="#065f46" letter-spacing="0.5">${title.toUpperCase()}</text>
  
  <!-- Parties Section -->
  <rect x="65" y="315" width="670" height="90" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="85" y="340" font-size="12" font-weight="bold" fill="#1e293b">IN THE MATTER OF APPEAL / COMPLAINT:</text>
  
  <text x="85" y="365" font-size="12" font-weight="bold" fill="#0f172a">${complainantName}</text>
  <text x="650" y="365" text-anchor="end" font-size="11" font-style="italic" fill="#64748b">... Complainant / Appellant</text>
  
  <text x="85" y="385" text-anchor="start" font-size="11" font-weight="bold" fill="#94a3b8">VERSUS</text>
  
  <text x="85" y="395" font-size="12" font-weight="bold" fill="#0f172a">${respondentName}</text>
  <text x="650" y="395" text-anchor="end" font-size="11" font-style="italic" fill="#64748b">... Public Body / Respondent</text>
  
  <!-- Subject & Legal Notice Body -->
  <text x="65" y="440" font-size="12" font-weight="bold" fill="#0f172a">SUBJECT: PROCEEDINGS UNDER SINDH TRANSPARENCY AND RIGHT TO INFORMATION ACT, 2016</text>
  
  <foreignObject x="65" y="455" width="670" height="340">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-size: 12px; line-height: 1.7; color: #334155; text-align: justify;">
      <p style="margin-bottom: 12px;">
        <strong>WHEREAS</strong>, the above-captioned complaint has been preferred before the Sindh Information Commission regarding the non-provision of requisite public records under the provisions of the Sindh Transparency and Right to Information Act, 2016.
      </p>
      <p style="margin-bottom: 12px;">
        <strong>AND WHEREAS</strong>, pursuant to the statutory powers vested in the Commission, this official communication (<strong>${title}</strong>) is formally issued on this day of <strong>${date}</strong> for immediate compliance and appearance before the designated Bench.
      </p>
      <p style="margin-bottom: 12px;">
        <strong>NOW THEREFORE</strong>, both parties and their authorized legal counsels are hereby directed to take notice of the proceedings and submit attested copies of relevant rejoinders, certified records, or replies within the prescribed timeframe. Failure to comply may attract statutory penalty proceedings under the relevant schedule of the Act.
      </p>
      <div style="background: #f1f5f9; padding: 10px 14px; border-left: 4px solid #047857; margin-top: 14px; border-radius: 4px;">
        <strong>Bench Order / Direction:</strong> Record attendance and submit compliance report on or before the scheduled hearing. Both sides are bound to adhere to the cause list timings.
      </div>
    </div>
  </foreignObject>
  
  <!-- Signatures and Official Stamp -->
  <g transform="translate(100, 880)">
    <rect x="0" y="0" width="130" height="70" rx="35" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 3" opacity="0.8"/>
    <text x="65" y="32" text-anchor="middle" font-size="9" font-weight="bold" fill="#dc2626">SINDH INFORMATION</text>
    <text x="65" y="45" text-anchor="middle" font-size="9" font-weight="bold" fill="#dc2626">COMMISSION</text>
    <text x="65" y="58" text-anchor="middle" font-size="8" fill="#dc2626">OFFICIAL SEAL</text>
  </g>
  
  <g transform="translate(520, 880)">
    <path d="M10,25 Q35,-5 60,20 T110,15 T150,25" stroke="#1e3a8a" stroke-width="2" fill="none"/>
    <line x1="0" y1="40" x2="190" y2="40" stroke="#94a3b8" stroke-width="1"/>
    <text x="95" y="56" text-anchor="middle" font-size="11" font-weight="bold" fill="#0f172a">Registrar / Authorized Officer</text>
    <text x="95" y="70" text-anchor="middle" font-size="10" fill="#64748b">Sindh Information Commission</text>
  </g>
  
  <!-- Footer Note -->
  <line x1="60" y1="990" x2="740" y2="990" stroke="#e2e8f0" stroke-width="1"/>
  <text x="400" y="1015" text-anchor="middle" font-size="10" fill="#94a3b8">This is a system-certified document issued by the Sindh Information Commission Case Management System.</text>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
