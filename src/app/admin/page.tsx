import { AdminClient } from './AdminClient';

export const metadata = {
  title: 'Internal Admin Dashboard - SpikeDocs',
  description: 'Internal SpikeDocs Monitoring Dashboard for Subscribers, Revenue, Churn, and System Logs.',
};

export default function AdminPage() {
  return <AdminClient />;
}
