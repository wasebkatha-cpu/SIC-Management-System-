/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import LeftNave from './components/leftNave';
import DashBoard from './components/dashBoard';
import Complaints from './components/complaints';
import ComplaintDetails from './components/complaintDetails';
import PublicBodies from './components/publicBodies';
import DesignatedOfficials from './components/designatedOfficials';
import CauseList from './components/causeList';
import Reader from './components/reader';
import Login from './components/Login';
import AdminManagement from './components/AdminManagement';
import ActivityHistory from './components/ActivityHistory';
import Chat from './components/chat';
import Documentation from './components/Documentation';
import { useAuth } from './context/AuthContext';
import AppNotification from './components/notification';
import ChatNotification from './components/ChatNotification';
import Popup from './components/popup';
import PopupChat from './components/PopupChat';

export default function App() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const handleNavSelect = (view: string) => {
    setActiveView(view);
    if (view !== 'complaints') {
      setSelectedComplaintId(null);
    }
  };

  const handleNavigateToComplaint = (complaintId: string) => {
    setSelectedComplaintId(complaintId);
    setActiveView('complaints');
  };

  const handleNavigateToCauseList = (date?: string) => {
    if (date) {
      localStorage.setItem('cause_list_target_date', date);
      window.dispatchEvent(new CustomEvent('switch_cause_list_date', { detail: date }));
    }
    setActiveView('causeList');
  };

  const handleNavigateToPublicBody = (publicBodyName?: string) => {
    setActiveView('publicBodies');
    if (publicBodyName) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('focus_public_body', { detail: { search: publicBodyName } }));
      }, 100);
    }
  };

  const handleNavigateToDesignatedOfficial = (officialName?: string) => {
    setActiveView('designatedOfficials');
    if (officialName) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('focus_designated_official', { detail: { search: officialName } }));
      }, 100);
    }
  };

  useEffect(() => {
    const handleComplaintEvent = (e: any) => {
      if (e.detail?.complaintId) {
        handleNavigateToComplaint(e.detail.complaintId);
      }
    };
    const handleCauseListEvent = (e: any) => {
      handleNavigateToCauseList(e.detail?.date);
    };
    const handlePublicBodyEvent = (e: any) => {
      if (e.detail?.search) {
        handleNavigateToPublicBody(e.detail.search);
      }
    };
    const handleDesignatedOfficialEvent = (e: any) => {
      if (e.detail?.search) {
        handleNavigateToDesignatedOfficial(e.detail.search);
      }
    };

    window.addEventListener('navigate_to_complaint', handleComplaintEvent as EventListener);
    window.addEventListener('navigate_to_cause_list', handleCauseListEvent as EventListener);
    window.addEventListener('navigate_to_public_body', handlePublicBodyEvent as EventListener);
    window.addEventListener('navigate_to_designated_official', handleDesignatedOfficialEvent as EventListener);

    return () => {
      window.removeEventListener('navigate_to_complaint', handleComplaintEvent as EventListener);
      window.removeEventListener('navigate_to_cause_list', handleCauseListEvent as EventListener);
      window.removeEventListener('navigate_to_public_body', handlePublicBodyEvent as EventListener);
      window.removeEventListener('navigate_to_designated_official', handleDesignatedOfficialEvent as EventListener);
    };
  }, []);

  const handleOpenChat = (chatId: string) => {
    localStorage.setItem('active_chat_target', chatId);
    window.dispatchEvent(new CustomEvent('switch_active_chat', { detail: chatId }));
    handleNavSelect('chat');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-600">Loading Application...</div>;
  }

  if (!user) {
    return <Login />;
  }

  const hasPermission = (perm: string) => {
    if (perm === 'documentation') return true;
    if (user.role === 'superUser') return true;
    if (user.role === 'admin') {
      if (!user.permissions || user.permissions.length === 0) return true; // Full access for legacy
      return user.permissions.includes(perm as any);
    }
    return false;
  };

  return (
    <div className="h-screen w-full bg-neutral-50 dark:bg-[#090d16] text-neutral-900 dark:text-white flex overflow-hidden transition-colors duration-200">

      <AppNotification onOpenCauseList={() => handleNavSelect('causeList')} />
      <ChatNotification onOpenChat={handleOpenChat} />
      <Popup onOpenCauseList={() => handleNavSelect('causeList')} />
      {activeView !== 'chat' && (
        <PopupChat
          onOpenFullScreen={() => handleNavSelect('chat')}
          onNavigateToComplaint={handleNavigateToComplaint}
          onNavigateToCauseList={handleNavigateToCauseList}
          onNavigateToPublicBody={handleNavigateToPublicBody}
          onNavigateToDesignatedOfficial={handleNavigateToDesignatedOfficial}
        />
      )}
      <LeftNave activeView={activeView} onSelect={handleNavSelect} userRole={user.role} />
      <main className="flex-1 h-full overflow-y-auto overflow-x-auto min-w-0 bg-neutral-50 dark:bg-[#090d16]">
        {!hasPermission(activeView) && activeView !== 'adminManagement' ? (
           <div className="p-8 text-center text-neutral-500 dark:text-neutral-200 mt-20">
             <Shield className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-700 mb-4" />
             <h2 className="text-xl font-semibold text-neutral-700 dark:text-white mb-2">Access Restricted</h2>
             <p>You do not have permission to view this section. Please select an available option from the menu.</p>
           </div>
        ) : (
          <>
            {activeView === 'dashboard' && hasPermission('dashboard') && <DashBoard onNavigate={handleNavSelect} />}
            {activeView === 'complaints' && hasPermission('complaints') && (
              selectedComplaintId ? (
                <ComplaintDetails 
                  complaintId={selectedComplaintId} 
                  onBack={() => setSelectedComplaintId(null)} 
                />
              ) : (
                <Complaints onSelectComplaint={setSelectedComplaintId} />
              )
            )}
            {activeView === 'publicBodies' && hasPermission('publicBodies') && <PublicBodies />}
            {activeView === 'designatedOfficials' && hasPermission('designatedOfficials') && <DesignatedOfficials />}
            {activeView === 'causeList' && hasPermission('causeList') && <CauseList />}
            {activeView === 'readers' && hasPermission('readers') && <Reader />}
            {activeView === 'adminManagement' && user.role === 'superUser' && <AdminManagement />}
            {activeView === 'activityHistory' && hasPermission('activityHistory') && <ActivityHistory />}
            {activeView === 'chat' && (
              <Chat 
                onNavigateToComplaint={handleNavigateToComplaint}
                onNavigateToCauseList={handleNavigateToCauseList}
                onNavigateToPublicBody={handleNavigateToPublicBody}
                onNavigateToDesignatedOfficial={handleNavigateToDesignatedOfficial}
              />
            )}
            {activeView === 'documentation' && <Documentation onNavigate={handleNavSelect} />}
          </>
        )}
      </main>
    </div>
  );
}
