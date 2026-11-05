import { Redirect } from 'expo-router';
import { useAuth } from '@/store/auth';
import { homeFor } from '@/lib/session';

export default function Index() {
  const user = useAuth((s) => s.user);
  return <Redirect href={homeFor(user)} />;
}
