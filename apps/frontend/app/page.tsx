import { JobBoard } from './components/job-board';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-5 py-6 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(125,211,252,0.18),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(147,197,253,0.12),transparent_32%)]" />
      <div className="relative">
        <JobBoard initialJobs={[]} />
      </div>
    </div>
  );
}
