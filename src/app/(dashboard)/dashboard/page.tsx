import DashboardStats from '@/components/DashboardStats';
import SessionsTable from '@/components/SessionsTable';

export default function DashboardPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-zinc-100 tracking-tight">Dashboard</h1>
        <p className="text-zinc-500 text-xs md:text-sm mt-0.5">Real-time parking overview and statistics</p>
      </div>
      <DashboardStats />
      <SessionsTable />
    </div>
  );
}
