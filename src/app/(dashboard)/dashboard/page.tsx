import DashboardStats from '@/components/DashboardStats';
import SessionsTable from '@/components/SessionsTable';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Real-time parking overview and statistics</p>
      </div>

      <DashboardStats />

      <SessionsTable />
    </div>
  );
}
