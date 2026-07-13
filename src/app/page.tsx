import UploadPanel from "@/components/UploadPanel";

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-[var(--foreground)]">Portfolio Risk Analysis</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Upload your lending policy document and customer portfolio to generate an
        executive risk dashboard. All processing happens in your browser — no files
        are sent to a server.
      </p>
      <div className="mt-6">
        <UploadPanel />
      </div>
    </div>
  );
}
