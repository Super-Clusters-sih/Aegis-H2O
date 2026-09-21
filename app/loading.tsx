export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
      <span className="text-xs font-semibold text-slate-500">
        Loading Aegis H2O...
      </span>
    </div>
  );
}
