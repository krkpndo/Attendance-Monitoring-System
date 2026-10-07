import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { useAdminCourse, useUpdateCourse } from "../admin.queries";
import { DataState } from "@/components/ui/DataState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type { AdminCourseDetail } from "../admin.schema";

export function AdminCourseDetailPage() {
  const { courseId = "" } = useParams();
  const query = useAdminCourse(courseId);

  return (
    <div className="flex flex-col gap-4">
      <Link to="/admin/courses" className="text-sm text-primary hover:underline">← Back to courses</Link>
      <DataState query={query}>{(course) => <Detail courseId={courseId} course={course} />}</DataState>
    </div>
  );
}

function Detail({ courseId, course }: { courseId: string; course: AdminCourseDetail }) {
  const update = useUpdateCourse(courseId);
  const form = useForm({ defaultValues: { courseName: course.courseName, courseDescription: course.courseDescription ?? "", units: course.units } });
  useEffect(() => { form.reset({ courseName: course.courseName, courseDescription: course.courseDescription ?? "", units: course.units }); }, [course]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = form.handleSubmit((v) => update.mutate({ courseName: v.courseName, courseDescription: v.courseDescription || undefined, units: Number(v.units) }));

  return (
    <>
      <h1 className="text-2xl font-bold text-base-content">
        <span className="font-mono">{course.courseCode}</span> · {course.courseName}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="rounded-box border border-base-300 bg-base-100 p-5">
          <h2 className="mb-3 font-semibold text-base-content">Edit</h2>
          <div className="flex flex-col gap-3">
            <TextField id="ce-name" label="Course name" {...form.register("courseName")} />
            <TextField id="ce-units" label="Units" type="number" {...form.register("units")} />
            <label className="form-control">
              <span className="label-text mb-1">Description</span>
              <textarea className="textarea textarea-bordered" rows={3} {...form.register("courseDescription")} />
            </label>
            <div><Button type="submit" loading={update.isPending}>Save</Button></div>
          </div>
        </form>

        <div className="rounded-box border border-base-300 bg-base-100 p-5">
          <h2 className="mb-3 font-semibold text-base-content">Classes ({course.classes.length})</h2>
          <div className="flex flex-col gap-2">
            {course.classes.length === 0 ? (
              <p className="text-sm text-base-content/50">No classes use this course yet.</p>
            ) : (
              course.classes.map((c) => (
                <Link key={c.id} to={`/admin/classes/${c.id}`} className="flex items-center justify-between rounded-box border border-base-300 p-3 text-sm hover:border-primary">
                  <span>{c.section} · {c.professor?.name ?? "Unassigned"}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-base-content/50">{c._count?.classEnrollments ?? 0} enrolled</span>
                    <Badge>{c.status}</Badge>
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
