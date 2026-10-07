import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  useCancelSession,
  useCloseSession,
  useOpenSession,
  useProfClasses,
  useReport,
  useRoster,
  useSessions,
} from "../professor.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatTime } from "@/lib/format";

type Tab = "sessions" | "roster" | "report";

export function ProfessorClassDetailPage() {
  const { classId = "" } = useParams();
  const [tab, setTab] = useState<Tab>("sessions");
  const classes = useProfClasses();
  const info = classes.data?.find((c) => c.id === classId);

  return (
    <div className="flex flex-col gap-4">
      <Link to="/professor/classes" className="text-sm text-primary hover:underline">← Back to classes</Link>

      <div>
        <h1 className="text-2xl font-bold text-base-content">{info?.course.courseCode ?? "Class"}</h1>
        <p className="text-sm text-base-content/60">
          {info ? `${info.course.courseName} · ${info.section}` : ""}
        </p>
      </div>

      <div role="tablist" className="tabs tabs-box w-fit">
        <button role="tab" className={`tab ${tab === "sessions" ? "tab-active" : ""}`} onClick={() => setTab("sessions")}>Sessions</button>
        <button role="tab" className={`tab ${tab === "roster" ? "tab-active" : ""}`} onClick={() => setTab("roster")}>Roster</button>
        <button role="tab" className={`tab ${tab === "report" ? "tab-active" : ""}`} onClick={() => setTab("report")}>Report</button>
      </div>

      {tab === "sessions" && <SessionsTab classId={classId} />}
      {tab === "roster" && <RosterTab classId={classId} />}
      {tab === "report" && <ReportTab classId={classId} />}
    </div>
  );
}

/* ---------------- Sessions ---------------- */
function SessionsTab({ classId }: { classId: string }) {
  const query = useSessions(classId);
  const close = useCloseSession(classId);
  const cancel = useCancelSession(classId);
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpenModal(true)}>Open session</Button>
      </div>

      <DataState
        query={query}
        isEmpty={query.data?.length === 0}
        empty={<EmptyState title="No sessions yet" description="Open a session to start taking attendance." action={<Button size="sm" onClick={() => setOpenModal(true)}>Open session</Button>} />}
      >
        {(sessions) => (
          <div className="overflow-x-auto rounded-box border border-base-300">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Time</th><th>Records</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="whitespace-nowrap">{formatDate(s.sessionDate)}</td>
                    <td className="whitespace-nowrap text-sm">{formatTime(s.startTime)}–{formatTime(s.endTime)}</td>
                    <td>{s._count?.attendanceRecords ?? 0}</td>
                    <td><Badge>{s.status}</Badge></td>
                    <td className="flex flex-wrap justify-end gap-2">
                      <Link to={`/professor/sessions/${s.id}`} className="btn btn-ghost btn-xs">Attendance</Link>
                      {s.status === "OPEN" && (
                        <Button size="sm" variant="secondary" loading={close.isPending} onClick={() => close.mutate(s.id)}>Close</Button>
                      )}
                      {(s.status === "OPEN" || s.status === "SCHEDULED") && (
                        <Button size="sm" variant="error" loading={cancel.isPending} onClick={() => cancel.mutate(s.id)}>Cancel</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataState>

      <OpenSessionModal classId={classId} sessions={query.data ?? []} open={openModal} onClose={() => setOpenModal(false)} />
    </div>
  );
}

/*
 * Schedule options are derived from existing sessions' scheduleId, because the
 * professor's class payload omits schedule IDs (a backend gap). Works for any
 * class that has run at least one session.
 */
function OpenSessionModal({
  classId,
  sessions,
  open,
  onClose,
}: {
  classId: string;
  sessions: { scheduleId?: string | null; startTime: string; endTime: string }[];
  open: boolean;
  onClose: () => void;
}) {
  const openSession = useOpenSession(classId);
  const options = useMemo(() => {
    const seen = new Map<string, { startTime: string; endTime: string }>();
    for (const s of sessions) if (s.scheduleId && !seen.has(s.scheduleId)) seen.set(s.scheduleId, { startTime: s.startTime, endTime: s.endTime });
    return [...seen.entries()].map(([id, t]) => ({ id, ...t }));
  }, [sessions]);

  const [scheduleId, setScheduleId] = useState("");
  const chosen = scheduleId || options[0]?.id || "";

  const submit = () => {
    if (!chosen) return;
    openSession.mutate({ classId, scheduleId: chosen }, { onSuccess: onClose });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Open attendance session"
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={openSession.isPending} disabled={!chosen}>Open</Button>
        </>
      }
    >
      {options.length === 0 ? (
        <Banner variant="warning">
          No schedule is available to open a session from. (The API only exposes schedule IDs via past sessions, so a
          brand-new class needs its first session created elsewhere.)
        </Banner>
      ) : (
        <label className="form-control">
          <span className="label-text mb-1">Schedule slot</span>
          <select className="select select-bordered" value={chosen} onChange={(e) => setScheduleId(e.target.value)}>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{formatTime(o.startTime)} – {formatTime(o.endTime)}</option>
            ))}
          </select>
        </label>
      )}
    </Modal>
  );
}

/* ---------------- Roster ---------------- */
function RosterTab({ classId }: { classId: string }) {
  const query = useRoster(classId);
  return (
    <DataState query={query} isEmpty={query.data?.length === 0} empty={<EmptyState title="No students enrolled" />}>
      {(roster) => (
        <div className="overflow-x-auto rounded-box border border-base-300">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
            <tbody>
              {roster.map((r) => (
                <tr key={r.student.id}>
                  <td className="font-medium">{r.student.name}</td>
                  <td className="text-sm text-base-content/70">{r.student.email}</td>
                  <td><Badge>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DataState>
  );
}

/* ---------------- Report ---------------- */
function ReportTab({ classId }: { classId: string }) {
  const query = useReport(classId);
  return (
    <DataState query={query}>
      {(report) => (
        <div className="overflow-x-auto rounded-box border border-base-300">
          <table className="table">
            <thead>
              <tr><th>Student</th><th>Present</th><th>Late</th><th>Absent</th><th>Excused</th><th>Total</th></tr>
            </thead>
            <tbody>
              {report.students.map((s) => (
                <tr key={s.studentId}>
                  <td>
                    <div className="font-medium">{s.studentName}</div>
                    <div className="text-xs text-base-content/60">{s.studentNumber}</div>
                  </td>
                  <td className="text-success">{s.present}</td>
                  <td className="text-warning">{s.late}</td>
                  <td className="text-error">{s.absent}</td>
                  <td className="text-info">{s.excused}</td>
                  <td>{s.totalSessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DataState>
  );
}
