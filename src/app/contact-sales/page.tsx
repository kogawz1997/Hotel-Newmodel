export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm uppercase tracking-[0.3em] text-amber-600">Maitri Production Suite</p>
      <h1 className="mt-3 text-4xl font-semibold text-slate-950">Contact sales</h1>
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <ul className="grid gap-3 text-slate-700">
          <li>Enterprise onboarding intake</li>
          <li>Multi-property rollout planning</li>
          <li>White-label and SSO readiness</li>
        </ul>
      </section>
    </main>
  );
}
