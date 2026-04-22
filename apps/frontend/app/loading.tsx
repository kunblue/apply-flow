import { Skeleton } from '@/components/ui/skeleton';

const COLUMNS = ['已投递', '面试中', '未通过', '已拿 Offer'];
const CARD_SKELETON_IDS = ['first', 'second'];
const METRIC_SKELETON_IDS = ['m1', 'm2', 'm3', 'm4'];

export default function Loading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-5 py-6 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(125,211,252,0.18),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(147,197,253,0.12),transparent_32%)]" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7 space-y-4">
            <header className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </header>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {METRIC_SKELETON_IDS.map((id) => (
                <div key={id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <Skeleton className="h-3 w-18" />
                  <Skeleton className="mt-2 h-7 w-16" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </div>
              ))}
            </section>
          </div>

          <div className="xl:col-span-5 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-2 h-4 w-64 max-w-full" />
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-32 lg:col-span-2" />
              <Skeleton className="h-10 w-28 lg:col-span-2" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => (
            <div
              key={column}
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-8 rounded-md" />
              </div>

              <div className="space-y-4">
                {CARD_SKELETON_IDS.map((id) => (
                  <div key={`${column}-${id}`} className="rounded-xl border border-slate-200/80 p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Skeleton className="h-5 w-16 rounded-md" />
                      <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                    <Skeleton className="mt-3 h-14 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
