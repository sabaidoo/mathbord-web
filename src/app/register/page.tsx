"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InviteData {
  name: string;
  email: string;
  personalNote?: string | null;
}

interface Step1Fields {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

interface Student {
  firstName: string;
  lastName: string;
  grade: string;
  curriculum: string;
  goals: string;
}

type Step1Errors = Partial<Record<keyof Step1Fields, string>>;
type StudentErrors = Partial<Record<keyof Student, string>>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRADE_OPTIONS = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year+",
];

const CURRICULUM_OPTIONS = [
  "Ontario",
  "BC",
  "Alberta",
  "Quebec",
  "Saskatchewan",
  "Manitoba",
  "Nova Scotia",
  "New Brunswick",
  "PEI",
  "Newfoundland",
  "IB",
  "AP",
];

const CONTACT_EMAIL = "support@mathbord.com";

// ---------------------------------------------------------------------------
// Shared style tokens
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  "w-full px-3.5 py-2.5 border-[1.5px] border-gray-200 rounded-btn text-sm outline-none focus:border-teal transition-colors bg-white placeholder-gray-400";

const INPUT_ERROR_CLASS =
  "w-full px-3.5 py-2.5 border-[1.5px] border-red-400 rounded-btn text-sm outline-none focus:border-red-500 transition-colors bg-white placeholder-gray-400";

const LABEL_CLASS = "block text-xs font-semibold text-[#686E77] mb-1.5";

const BTN_PRIMARY =
  "px-6 py-2.5 bg-teal text-white text-sm font-bold rounded-btn hover:bg-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const BTN_SECONDARY =
  "px-6 py-2.5 bg-white border-[1.5px] border-gray-200 text-[#686E77] text-sm font-semibold rounded-btn hover:border-gray-300 hover:text-navy transition-colors";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500 font-medium">{message}</p>;
}

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Guardian" },
    { n: 2, label: "Students" },
    { n: 3, label: "Review" },
  ] as const;

  return (
    <div className="flex items-center justify-center gap-0 mb-7">
      {steps.map((step, i) => {
        const done = currentStep > step.n;
        const active = currentStep === step.n;

        return (
          <div key={step.n} className="flex items-center">
            {/* Connector line (left side, skip first) */}
            {i > 0 && (
              <div
                className={`h-[2px] w-8 transition-colors ${
                  currentStep > i ? "bg-teal" : "bg-gray-200"
                }`}
              />
            )}

            {/* Dot + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done
                    ? "bg-teal text-white"
                    : active
                    ? "bg-teal text-white ring-4 ring-teal/20"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {done ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 7L5.5 10L11.5 4"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step.n
                )}
              </div>
              <span
                className={`text-[10px] font-semibold leading-none ${
                  active ? "text-teal" : done ? "text-navy" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line (right side, skip last) */}
            {i < steps.length - 1 && (
              <div
                className={`h-[2px] w-8 transition-colors ${
                  currentStep > step.n ? "bg-teal" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Eye icon for password toggle
// ---------------------------------------------------------------------------

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
        stroke="#ADADAD"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="#ADADAD" strokeWidth="1.8" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"
        stroke="#ADADAD"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Guardian Information
// ---------------------------------------------------------------------------

function Step1Form({
  fields,
  errors,
  onChange,
}: {
  fields: Step1Fields;
  errors: Step1Errors;
  onChange: (key: keyof Step1Fields, value: string) => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-4">
      {/* First + Last on one row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS}>
            First Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={fields.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            placeholder="Jane"
            autoComplete="given-name"
            className={errors.firstName ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
          <FieldError message={errors.firstName} />
        </div>
        <div>
          <label className={LABEL_CLASS}>
            Last Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={fields.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder="Smith"
            autoComplete="family-name"
            className={errors.lastName ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
          <FieldError message={errors.lastName} />
        </div>
      </div>

      {/* Email — readonly */}
      <div>
        <label className={LABEL_CLASS}>Email</label>
        <input
          type="email"
          value={fields.email}
          readOnly
          className={`${INPUT_CLASS} bg-gray-50 text-gray-500 cursor-not-allowed`}
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Pre-filled from your invitation — cannot be changed.
        </p>
      </div>

      {/* Password */}
      <div>
        <label className={LABEL_CLASS}>
          Password <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={fields.password}
            onChange={(e) => onChange("password", e.target.value)}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            className={`${errors.password ? INPUT_ERROR_CLASS : INPUT_CLASS} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-teal/40"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            <EyeIcon open={showPw} />
          </button>
        </div>
        <FieldError message={errors.password} />
      </div>

      {/* Confirm Password */}
      <div>
        <label className={LABEL_CLASS}>
          Confirm Password <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={fields.confirmPassword}
            onChange={(e) => onChange("confirmPassword", e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            className={`${errors.confirmPassword ? INPUT_ERROR_CLASS : INPUT_CLASS} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-teal/40"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            <EyeIcon open={showConfirm} />
          </button>
        </div>
        <FieldError message={errors.confirmPassword} />
      </div>

      {/* Phone — optional */}
      <div>
        <label className={LABEL_CLASS}>
          Phone <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="tel"
          value={fields.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="+1 (416) 000-0000"
          autoComplete="tel"
          className={INPUT_CLASS}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single student form card
// ---------------------------------------------------------------------------

function StudentCard({
  index,
  student,
  errors,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  student: Student;
  errors: StudentErrors;
  canRemove: boolean;
  onChange: (index: number, key: keyof Student, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="border-[1.5px] border-gray-200 rounded-card p-4 space-y-4 bg-gray-50/60">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-navy uppercase tracking-wider">
          Student {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors text-sm font-bold leading-none focus:outline-none focus:ring-2 focus:ring-red-300"
            aria-label={`Remove student ${index + 1}`}
          >
            &times;
          </button>
        )}
      </div>

      {/* First + Last */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS}>
            First Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={student.firstName}
            onChange={(e) => onChange(index, "firstName", e.target.value)}
            placeholder="Alex"
            className={errors.firstName ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
          <FieldError message={errors.firstName} />
        </div>
        <div>
          <label className={LABEL_CLASS}>
            Last Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={student.lastName}
            onChange={(e) => onChange(index, "lastName", e.target.value)}
            placeholder="Smith"
            className={errors.lastName ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
          <FieldError message={errors.lastName} />
        </div>
      </div>

      {/* Grade + Curriculum */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS}>
            Grade Level <span className="text-red-400">*</span>
          </label>
          <select
            value={student.grade}
            onChange={(e) => onChange(index, "grade", e.target.value)}
            className={`${
              errors.grade ? INPUT_ERROR_CLASS : INPUT_CLASS
            } appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M6 9L12 15L18 9' stroke='%23ADADAD' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center] pr-8 cursor-pointer`}
          >
            <option value="">Select grade…</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <FieldError message={errors.grade} />
        </div>
        <div>
          <label className={LABEL_CLASS}>
            Curriculum <span className="text-red-400">*</span>
          </label>
          <select
            value={student.curriculum}
            onChange={(e) => onChange(index, "curriculum", e.target.value)}
            className={`${
              errors.curriculum ? INPUT_ERROR_CLASS : INPUT_CLASS
            } appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M6 9L12 15L18 9' stroke='%23ADADAD' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center] pr-8 cursor-pointer`}
          >
            <option value="">Select curriculum…</option>
            {CURRICULUM_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <FieldError message={errors.curriculum} />
        </div>
      </div>

      {/* Goals */}
      <div>
        <label className={LABEL_CLASS}>
          Learning Goals{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={student.goals}
          onChange={(e) => onChange(index, "goals", e.target.value)}
          rows={2}
          placeholder="e.g. Improve algebra skills, prepare for exams…"
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Student Details
// ---------------------------------------------------------------------------

function Step2Form({
  students,
  studentErrors,
  onStudentChange,
  onAddStudent,
  onRemoveStudent,
}: {
  students: Student[];
  studentErrors: StudentErrors[];
  onStudentChange: (index: number, key: keyof Student, value: string) => void;
  onAddStudent: () => void;
  onRemoveStudent: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      {students.map((student, i) => (
        <StudentCard
          key={i}
          index={i}
          student={student}
          errors={studentErrors[i] ?? {}}
          canRemove={students.length > 1}
          onChange={onStudentChange}
          onRemove={onRemoveStudent}
        />
      ))}

      <button
        type="button"
        onClick={onAddStudent}
        className="w-full py-2.5 border-[1.5px] border-dashed border-teal text-teal text-sm font-semibold rounded-btn hover:bg-teal/5 transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-base leading-none">+</span>
        Add Another Student
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Review & Confirm
// ---------------------------------------------------------------------------

function Step3Review({
  step1,
  students,
  agreed,
  onAgreeChange,
}: {
  step1: Step1Fields;
  students: Student[];
  agreed: boolean;
  onAgreeChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Account summary */}
      <div className="bg-gray-50 border-[1.5px] border-gray-200 rounded-card p-4 space-y-3">
        <p className="text-xs font-bold text-[#686E77] uppercase tracking-wider">
          Account
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal text-xs font-bold shrink-0">
              {(step1.firstName[0] ?? "?").toUpperCase()}
              {(step1.lastName[0] ?? "").toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">
                {step1.firstName} {step1.lastName}
              </p>
              <p className="text-xs text-gray-500">{step1.email}</p>
            </div>
          </div>
          {step1.phone && (
            <p className="text-xs text-gray-500 pl-10">{step1.phone}</p>
          )}
        </div>
      </div>

      {/* Students summary */}
      <div className="bg-gray-50 border-[1.5px] border-gray-200 rounded-card p-4 space-y-3">
        <p className="text-xs font-bold text-[#686E77] uppercase tracking-wider">
          Students ({students.length})
        </p>
        <ul className="space-y-2">
          {students.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-teal shrink-0 mt-[5px]" />
              <div>
                <span className="text-sm font-semibold text-navy">
                  {s.firstName} {s.lastName}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {s.grade}
                  {s.curriculum ? ` · ${s.curriculum}` : ""}
                </span>
                {s.goals && (
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                    {s.goals}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Terms checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => onAgreeChange(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-[4px] border-[1.5px] transition-colors flex items-center justify-center ${
              agreed
                ? "bg-teal border-teal"
                : "bg-white border-gray-300 group-hover:border-teal"
            }`}
          >
            {agreed && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1.5 5L4 7.5L8.5 2.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm text-gray-600 leading-snug select-none">
          I agree to the{" "}
          <Link
            href="/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal hover:underline font-medium"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal hover:underline font-medium"
          >
            Privacy Policy
          </Link>
        </span>
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success screen
// ---------------------------------------------------------------------------

function SuccessScreen() {
  return (
    <div className="text-center space-y-5 py-4">
      {/* Checkmark circle */}
      <div className="mx-auto w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M6 16L13 23L26 10"
            stroke="#06A5FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="space-y-1.5">
        <h3
          className="text-xl font-bold text-navy"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Account created!
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
          Welcome to Mathbord. Check your email for a confirmation link, then
          sign in to get started.
        </p>
      </div>

      <Link
        href="/login"
        className="inline-block px-6 py-2.5 bg-teal text-white text-sm font-bold rounded-btn hover:bg-teal-dark transition-colors"
      >
        Sign In
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Token-invalid error screen
// ---------------------------------------------------------------------------

function TokenError({ reason }: { reason: string }) {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle cx="14" cy="14" r="12" stroke="#FD4044" strokeWidth="1.8" />
          <path
            d="M14 8v7"
            stroke="#FD4044"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="14" cy="19.5" r="1" fill="#FD4044" />
        </svg>
      </div>
      <div className="space-y-1.5">
        <h3
          className="text-lg font-bold text-navy"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Invitation link invalid
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
          {reason}
        </p>
      </div>
      <p className="text-xs text-gray-400">
        Need a new link? Contact us at{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-teal hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyStudent(): Student {
  return { firstName: "", lastName: "", grade: "", curriculum: "", goals: "" };
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  const lastName = parts.pop() ?? "";
  return { firstName: parts.join(" "), lastName };
}

// ---------------------------------------------------------------------------
// Main inner component (needs useSearchParams so must be inside Suspense)
// ---------------------------------------------------------------------------

function RegisterInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  // Invite validation state
  const [tokenState, setTokenState] = useState<
    "loading" | "valid" | "invalid"
  >("loading");
  const [tokenError, setTokenError] = useState("");

  // Wizard step
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 data
  const [step1, setStep1] = useState<Step1Fields>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});

  // Step 2 data
  const [students, setStudents] = useState<Student[]>([emptyStudent()]);
  const [studentErrors, setStudentErrors] = useState<StudentErrors[]>([{}]);

  // Step 3 data
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenState("invalid");
      setTokenError("No invitation token was found in this link.");
      return;
    }

    fetch(`/api/invites/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data: { valid: boolean; reason?: string; invite?: InviteData }) => {
        if (!data.valid) {
          setTokenState("invalid");
          setTokenError(data.reason ?? "This invitation link is invalid or has expired.");
        } else {
          setTokenState("valid");
          const invite = data.invite!;
          const { firstName, lastName } = splitName(invite.name ?? "");
          setStep1((prev) => ({
            ...prev,
            email: invite.email,
            firstName,
            lastName,
          }));
        }
      })
      .catch(() => {
        setTokenState("invalid");
        setTokenError("Could not verify your invitation. Please check your connection and try again.");
      });
  }, [token]);

  // ---------------------------------------------------------------------------
  // Validation helpers
  // ---------------------------------------------------------------------------

  function validateStep1(): boolean {
    const errs: Step1Errors = {};
    if (!step1.firstName.trim()) errs.firstName = "First name is required.";
    if (!step1.lastName.trim()) errs.lastName = "Last name is required.";
    if (step1.password.length < 8)
      errs.password = "Password must be at least 8 characters.";
    if (step1.confirmPassword !== step1.password)
      errs.confirmPassword = "Passwords do not match.";
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const allErrors: StudentErrors[] = students.map((s) => {
      const e: StudentErrors = {};
      if (!s.firstName.trim()) e.firstName = "Required.";
      if (!s.lastName.trim()) e.lastName = "Required.";
      if (!s.grade) e.grade = "Required.";
      if (!s.curriculum) e.curriculum = "Required.";
      return e;
    });
    setStudentErrors(allErrors);
    return allErrors.every((e) => Object.keys(e).length === 0);
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  function handleNext() {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  }

  function handleBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  // ---------------------------------------------------------------------------
  // Student management
  // ---------------------------------------------------------------------------

  function handleStudentChange(index: number, key: keyof Student, value: string) {
    setStudents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
    // Clear the error for that field on change
    setStudentErrors((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [key]: undefined };
      }
      return next;
    });
  }

  function handleAddStudent() {
    setStudents((prev) => [...prev, emptyStudent()]);
    setStudentErrors((prev) => [...prev, {}]);
  }

  function handleRemoveStudent(index: number) {
    setStudents((prev) => prev.filter((_, i) => i !== index));
    setStudentErrors((prev) => prev.filter((_, i) => i !== index));
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit() {
    if (!agreed) {
      setAgreeError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }
    setAgreeError("");
    setSubmitError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: step1.email,
          password: step1.password,
          firstName: step1.firstName.trim(),
          lastName: step1.lastName.trim(),
          phone: step1.phone.trim() || undefined,
          students: students.map((s) => ({
            firstName: s.firstName.trim(),
            lastName: s.lastName.trim(),
            grade: s.grade,
            curriculum: s.curriculum,
            goals: s.goals.trim() || undefined,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Step meta
  // ---------------------------------------------------------------------------

  const stepMeta: Record<
    1 | 2 | 3,
    { title: string; subtitle: string }
  > = {
    1: {
      title: "Guardian Information",
      subtitle: "Create your parent / guardian account.",
    },
    2: {
      title: "Student Details",
      subtitle: "Tell us about the student(s) you're enrolling.",
    },
    3: {
      title: "Review & Confirm",
      subtitle: "Double-check everything before creating your account.",
    },
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="w-full max-w-lg">
      {/* Logo + tagline */}
      <div className="text-center mb-7">
        <h1
          className="text-3xl text-navy tracking-tight"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}
        >
          Mathbord
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Right Tutor. Right Plan. Visible Progress.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-card border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-8">
        {/* Loading skeleton */}
        {tokenState === "loading" && (
          <div className="space-y-3 py-4">
            <div className="h-3 bg-gray-100 rounded-full w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded-full w-1/2 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded-full w-5/6 animate-pulse" />
          </div>
        )}

        {/* Invalid token */}
        {tokenState === "invalid" && <TokenError reason={tokenError} />}

        {/* Success */}
        {tokenState === "valid" && success && <SuccessScreen />}

        {/* Wizard */}
        {tokenState === "valid" && !success && (
          <>
            {/* Step indicator */}
            <StepIndicator currentStep={step} />

            {/* Step heading */}
            <div className="mb-5">
              <h2
                className="text-lg font-bold text-navy"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {stepMeta[step].title}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {stepMeta[step].subtitle}
              </p>
            </div>

            {/* Step content */}
            {step === 1 && (
              <Step1Form
                fields={step1}
                errors={step1Errors}
                onChange={(key, value) => {
                  setStep1((prev) => ({ ...prev, [key]: value }));
                  setStep1Errors((prev) => ({ ...prev, [key]: undefined }));
                }}
              />
            )}

            {step === 2 && (
              <Step2Form
                students={students}
                studentErrors={studentErrors}
                onStudentChange={handleStudentChange}
                onAddStudent={handleAddStudent}
                onRemoveStudent={handleRemoveStudent}
              />
            )}

            {step === 3 && (
              <>
                <Step3Review
                  step1={step1}
                  students={students}
                  agreed={agreed}
                  onAgreeChange={(v) => {
                    setAgreed(v);
                    if (v) setAgreeError("");
                  }}
                />
                {agreeError && (
                  <p className="mt-2 text-xs text-red-500 font-medium">
                    {agreeError}
                  </p>
                )}
              </>
            )}

            {/* Global submit error */}
            {submitError && (
              <div className="mt-4 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-btn">
                <p className="text-xs text-red-600 font-medium">{submitError}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className={BTN_SECONDARY}
                >
                  Back
                </button>
              ) : (
                <span />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className={BTN_PRIMARY}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={BTN_PRIMARY}
                >
                  {submitting ? "Creating account…" : "Create Account"}
                </button>
              )}
            </div>

            {/* Step counter */}
            <p className="mt-4 text-center text-[11px] text-gray-400">
              Step {step} of 3
            </p>
          </>
        )}
      </div>

      {/* Dev hint */}
      {process.env.NODE_ENV === "development" && (
        <p className="text-center text-xs text-gray-400 mt-4">
          Test invite:{" "}
          <code className="font-mono">?token=dev-test-token</code>
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export — Suspense wrapper required for useSearchParams in Next.js 14
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-lg">
          <div className="text-center mb-7">
            <h1
              className="text-3xl text-navy tracking-tight"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}
            >
              Mathbord
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Right Tutor. Right Plan. Visible Progress.
            </p>
          </div>
          <div className="bg-white rounded-card border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-8">
            <div className="space-y-3 py-4">
              <div className="h-3 bg-gray-100 rounded-full w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-full w-1/2 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-full w-5/6 animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <RegisterInner />
    </Suspense>
  );
}
