import { Home, Compass, Trophy, Inbox, User } from 'lucide-react-native';
import { TabsLayout } from '@/components/TabsLayout';

export default function TalentTabs() {
  return (
    <TabsLayout
      tabs={[
        { name: 'home', title: 'Home', icon: Home },
        { name: 'discover', title: 'Discover', icon: Compass },
        { name: 'competitions', title: 'Competitions', icon: Trophy },
        { name: 'inbox', title: 'Inbox', icon: Inbox },
        { name: 'profile', title: 'Profile', icon: User },
      ]}
    />
  );
}
