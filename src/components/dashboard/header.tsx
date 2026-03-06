interface HeaderProps {
  userName: string;
  role: string;
  avatarInitials: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  tutor: "Tutor",
  client: "Parent / Guardian",
  student: "Student",
};

export function Header({ userName, role, avatarInitials }: HeaderProps) {
  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <header className="h-[64px] bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400 font-medium">{roleLabel}</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-semibold">Dashboard</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Book Session button */}
        <a
          href="/dashboard/book"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded-btn transition-colors"
        >
          <span>＋</span>
          <span>Book Session</span>
        </a>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-white text-sm font-bold select-none shrink-0"
          title={userName}
        >
          {avatarInitials}
        </div>
      </div>
    </header>
  );
}
