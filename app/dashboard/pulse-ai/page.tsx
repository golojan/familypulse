export const metadata = {
  title: "Pulse AI · FamilyPulse",
};

export default function PulseAiPage() {
  return (
    <main className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl rounded-lg border border-fp-line bg-white p-8 shadow-card">
        <p className="text-sm font-extrabold uppercase text-fp-green">Pulse AI</p>
        <h1 className="mt-2 text-3xl font-bold">Editorial assistant</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-fp-muted">
          Pulse AI tools will live here: outlines, content checks, topic ideas, and publishing assistance.
        </p>
      </div>
    </main>
  );
}
