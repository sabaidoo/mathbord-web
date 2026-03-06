export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center py-12 px-4">
      {children}
    </div>
  );
}
