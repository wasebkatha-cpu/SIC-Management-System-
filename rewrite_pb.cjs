const fs = require('fs');

const content = fs.readFileSync('src/components/publicBodies.tsx', 'utf-8');

// Update imports
let newContent = content.replace(
  "import { useState } from 'react';",
  "import { useState, useRef } from 'react';"
);

newContent = newContent.replace(
  "import { Search, Plus, Building2, MapPin, Globe, Mail, Phone, User, Users, Edit2 } from 'lucide-react';",
  "import { Search, Plus, Building2, MapPin, Globe, Mail, Phone, User, Users, Edit2, Upload, Info } from 'lucide-react';"
);

newContent = newContent.replace(
  "const { publicBodies, addPublicBody, getReaderForLocation, updatePublicBody } = useAppContext();",
  "const { publicBodies, addPublicBody, getReaderForLocation, updatePublicBody, addBulkPublicBodies } = useAppContext();\n  const fileInputRef = useRef<HTMLInputElement>(null);"
);

const fileUploadLogic = `
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        let parsedData: any[] = [];
        
        if (file.name.toLowerCase().endsWith('.json')) {
          parsedData = JSON.parse(content);
        } else if (file.name.toLowerCase().endsWith('.csv')) {
          parsedData = parseCSV(content);
        } else {
          alert('Unsupported file format. Please upload CSV or JSON.');
          return;
        }
        
        if (!Array.isArray(parsedData) || parsedData.length === 0) {
           alert('File must contain an array of objects.');
           return;
        }
        
        const standardFields = [
          'id', 'srNo', 'name', 'publicBodyName', 'designatedOfficialName', 'do_name', 'officialName', 
          'designatedOfficialDesignation', 'designation', 'headOfDepartmentName', 'hod_name', 
          'headOfDepartmentDesignation', 'hod_designation', 'district', 'division', 'reader', 
          'website', 'email', 'contactNumber', 'phone', 'address'
        ];
        
        const newBodies: PublicBody[] = parsedData.map((row, index) => {
          const additionalFields: {name: string, value: string}[] = [];
          
          Object.keys(row).forEach(key => {
            if (!standardFields.includes(key)) {
              additionalFields.push({ name: key, value: String(row[key]) });
            }
          });
          
          return {
            id: \`bulk-\${Date.now()}-\${index}\`,
            srNo: parseInt(row.srNo) || publicBodies.length + index + 1,
            name: row.name || row.publicBodyName || 'Unknown Public Body',
            designatedOfficialName: row.designatedOfficialName || row.do_name || row.officialName || 'Unknown Official',
            designatedOfficialDesignation: row.designatedOfficialDesignation || row.designation || '',
            headOfDepartmentName: row.headOfDepartmentName || row.hod_name || '',
            headOfDepartmentDesignation: row.headOfDepartmentDesignation || row.hod_designation || '',
            district: row.district || '',
            division: row.division || '',
            reader: row.reader || getReaderForLocation(row.division, row.district) || 'Unassigned',
            website: row.website || '',
            email: row.email || '',
            contactNumber: row.contactNumber || row.phone || '',
            address: row.address || '',
            additionalFields: additionalFields.length > 0 ? additionalFields : undefined
          };
        });
        
        addBulkPublicBodies(newBodies);
        await logActivity(\`Bulk uploaded \${newBodies.length} public bodies from file \${file.name}\`);
        alert(\`Successfully added \${newBodies.length} public bodies!\`);
      } catch (err) {
        alert('Error parsing file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseCSV = (csv: string) => {
    const lines = csv.split('\\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] ? values[index].trim() : '';
      });
      return obj;
    });
  };
`;

newContent = newContent.replace(
  "  const handleAddPublicBody = async (newBody: PublicBody) => {",
  fileUploadLogic + "\n  const handleAddPublicBody = async (newBody: PublicBody) => {"
);

const uploadButtonHTML = `
          <input 
            type="file" 
            accept=".csv,.json" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Upload</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
`;

newContent = newContent.replace(
  "          <button onClick={() => setIsAddModalOpen(true)}",
  uploadButtonHTML
);

// We also want to display additionalFields in the table. Let's find where to put it.
// Let's add it at the bottom of the contact grid.
const additionalFieldsRenderHTML = `
                        </div>
                        {body.additionalFields && body.additionalFields.length > 0 && (
                          <div className="col-span-2 mt-2 pt-2 border-t border-neutral-100 grid grid-cols-2 gap-2">
                            {body.additionalFields.map((field, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                <Info className="w-3 h-3 shrink-0" />
                                <span className="font-semibold capitalize truncate">{field.name}:</span>
                                <span className="truncate" title={field.value}>{field.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
`;

newContent = newContent.replace(
  `                        </div>\n                      </div>\n                    </td>\n                    <td className="px-4 py-4 text-center">`,
  additionalFieldsRenderHTML
);

fs.writeFileSync('src/components/publicBodies.tsx', newContent);
