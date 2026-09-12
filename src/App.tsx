/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import LeftNave from './components/leftNave';
import DashBoard from './components/dashBoard';
import Complaints from './components/complaints';
import ComplaintDetails from './components/complaintDetails';
import PublicBodies from './components/publicBodies';
import DesignatedOfficials from './components/designatedOfficials';
import CauseList from './components/causeList';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const handleNavSelect = (view: string) => {
    setActiveView(view);
    if (view !== 'complaints') {
      setSelectedComplaintId(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <LeftNave activeView={activeView} onSelect={handleNavSelect} />
      <main className="flex-1 overflow-auto">
        {activeView === 'dashboard' && <DashBoard />}
        {activeView === 'complaints' && (
          selectedComplaintId ? (
            <ComplaintDetails 
              complaintId={selectedComplaintId} 
              onBack={() => setSelectedComplaintId(null)} 
            />
          ) : (
            <Complaints onSelectComplaint={setSelectedComplaintId} />
          )
        )}
        {activeView === 'publicBodies' && <PublicBodies />}
        {activeView === 'designatedOfficials' && <DesignatedOfficials />}
        {activeView === 'causeList' && <CauseList />}
      </main>
    </div>
  );
}
