import { useState } from "react";
import { Link } from "react-router";
import { useAdminClasses, useAdminCourses } from "../admin.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { classStatusSchema, semesterSchema } from "@/lib/enums";
import { CreateClassModal } from "../components/CreateClassModal";

/*
 * Classes — the full list across all courses/professors, paginated with a few
 * server-side filters (course, semester, status). Rows link to a detail page
 * where schedule, enrollment, and the attendance report live.
 */
export function AdminClassesPage() {
  const [page, setPage] = useState(1);
  const [courseId, setCourseId] = useState("");
  const [semester, setSemester] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);

  const courses = useAdminCourses();
  const filters = {
    page,
    limit: 15,
    ...(courseId ? { courseId } : {}),
    ...(semester ? { semester } : {}),
    ...(status ? { status } : {}),
  };
  const query = useAdminClasses(filters);

  const onFilter = (fn: () => void) => { fn(); setPage(1); };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base-content">Classes</h1>
        <Button onClick={() => setOpen(true)}>Create class</Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="form-control">
          <span className="label-text mb-1">Course</span>
          <select className="select select-bordered select-sm" value={courseId} onChange={(e) => onFilter(() => setCourseId(e.target.value))}>
            <option value="">All courses</option>
            {courses.data?.map((c) => <option key={c.id} value={c.id}>{c.courseCode}</option>)}
          </select>
        </label>
        <label className="form-control">
          <span className="label-text mb-1">Semester</span>
          <select className="select select-bordered select-sm" value={semester} onChange={(e) => onFilter(() => setSemester(e.target.value))}>
            <option value="">All</option>
            {semesterSchema.options.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="form-control">
          <span className="label-text mb-1">Status</span>
          <select className="select select-bordered select-sm" value={status} onChange={(e) => onFilter(() => setStatus(e.target.value))}>
            <option value="">All</option>
            {classStatusSchema.options.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <DataState query={query} isEmpty={query.data?.items.length === 0} empty={<EmptyState title="No classes" description="No class matches the current filter." action={<Button onClick={() => setOpen(true)}>Create class</Button>} />}>
        {(data) => (
          <>
            <div className="overflow-x-auto rounded-box border border-base-300">
              <table className="table">
                <thead><tr><th>Course</th><th>Section</th><th>Professor</th><th>Term</th><th>Enrolled</th><th>Status</th></tr></thead>
                <tbody>
                  {data.items.map((c) => (
                    <tr key={c.id} className="hover">
                      <td>
                        <Link to={`/admin/classes/${c.id}`} className="font-mono font-medium text-primary hover:underline">{c.course.courseCode}</Link>
                        <div className="text-xs text-base-content/60">{c.course.courseName}</div>
                      </td>
                      <td>{c.section}</td>
                      <td className="text-sm">{c.professor.name}</td>
                      <td className="whitespace-nowrap text-sm">{c.schoolYear} · {c.semester}</td>
                      <td>{c._count?.classEnrollments ?? 0}</td>
                      <td><Badge>{c.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.pagination} onPageChange={setPage} />
          </>
        )}
      </DataState>

      <CreateClassModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
