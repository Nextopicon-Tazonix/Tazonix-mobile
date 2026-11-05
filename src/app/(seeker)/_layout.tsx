import { LayoutDashboard, Search, Bookmark, MessageSquare, Building2 } from 'lucide-react-native';
import { TabsLayout } from '@/components/TabsLayout';

export default function SeekerTabs() {
  return (
    <TabsLayout
      tabs={[
        { name: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
        { name: 'find-talent', title: 'Discover Talent', icon: Search },
        { name: 'shortlist', title: 'Shortlist', icon: Bookmark },
        { name: 'messages', title: 'Inbox', icon: MessageSquare },
        { name: 'account', title: 'Account', icon: Building2 },
      ]}
    />
  );
}
