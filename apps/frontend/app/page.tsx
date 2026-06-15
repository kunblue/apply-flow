import { JobBoard } from './components/job-board';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden px-5 py-6 text-slate-900">
      <div className="relative">
        <JobBoard initialJobs={[]} />
      </div>
    </div>
  );
}
