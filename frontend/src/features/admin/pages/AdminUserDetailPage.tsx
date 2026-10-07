import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useForm } from "react-hook-form";
import {
  useAdminUser,
  useDeactivateUser,
  useRevokeRfid,
  useUpdateProfessor,
  useUpdateStudent,
  useUpdateUser,
} from "../admin.queries";
import { DataState } from "@/components/ui/DataState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Modal } from "@/components/ui/Modal";
import type { AdminUserDetail } from "../admin.schema";

/*
 * User detail — edit the account, edit the role profile (student/professor),
 * deactivate, and (for students) revoke the RFID card. Each mutation invalidates
 * this user's cache so the view reflects the change.
 */
export function AdminUserDetailPage() {
  const { userId = "" } = useParams();
  const query = useAdminUser(userId);

  return (
    <div className="flex flex-col gap-4">
      <Link to="/admin/users" className="text-sm text-primary hover:underline">← Back to users</Link>
      <DataState query={query}>{(user) => <Detail user={user} userId={userId} />}</DataState>
    </div>
  );
}

function Detail({ user, userId }: { user: AdminUserDetail; userId: string }) {
  const updateUser = useUpdateUser(userId);
  const deactivate = useDeactivateUser(userId);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const account = useForm<{ name: string; email: string; username: string; password: string }>({
    defaultValues: { name: user.name, email: user.email, username: user.username, password: "" },
  });
  useEffect(() => { account.reset({ name: user.name, email: user.email, username: user.username, password: "" }); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveAccount = account.handleSubmit((v) => {
    const body: Record<string, string> = {};
    if (v.name && v.name !== user.name) body.name = v.name;
    if (v.email && v.email !== user.email) body.email = v.email;
    if (v.username && v.username !== user.username) body.username = v.username;
    if (v.password) body.password = v.password;
    updateUser.mutate(body, { onSuccess: () => account.setValue("password", "") });
  });

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-base-content">{user.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="badge badge-ghost">{user.type}</span>
            <Badge>{user.status}</Badge>
          </div>
        </div>
        {user.status === "ACTIVE" && (
          <Button variant="error" onClick={() => setConfirmDeactivate(true)}>Deactivate</Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account */}
        <form onSubmit={saveAccount} className="rounded-box border border-base-300 bg-base-100 p-5">
          <h2 className="mb-3 font-semibold text-base-content">Account</h2>
          <div className="flex flex-col gap-3">
            <TextField id="au-name" label="Name" {...account.register("name")} />
            <TextField id="au-email" label="Email" type="email" {...account.register("email")} />
            <TextField id="au-username" label="Username" {...account.register("username")} />
            <TextField id="au-password" label="New password (optional)" type="password" autoComplete="new-password" {...account.register("password")} />
            <div><Button type="submit" loading={updateUser.isPending}>Save account</Button></div>
          </div>
        </form>

        {/* Role profile */}
        {user.student && <StudentProfile userId={userId} data={user.student} />}
        {user.professor && <ProfessorProfile userId={userId} data={user.professor} />}
      </div>

      <Modal
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        title="Deactivate user?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeactivate(false)}>Cancel</Button>
            <Button variant="error" loading={deactivate.isPending} onClick={() => deactivate.mutate(undefined, { onSuccess: () => setConfirmDeactivate(false) })}>Deactivate</Button>
          </>
        }
      >
        <p className="text-sm text-base-content/70">They'll be signed out and unable to log in until reactivated.</p>
      </Modal>
    </>
  );
}

function StudentProfile({ userId, data }: { userId: string; data: NonNullable<AdminUserDetail["student"]> }) {
  const update = useUpdateStudent(userId);
  const revoke = useRevokeRfid(userId);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const form = useForm({ defaultValues: { ...data, department: data.department ?? "" } });
  useEffect(() => { form.reset({ ...data, department: data.department ?? "" }); }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = form.handleSubmit((v) =>
    update.mutate({ ...v, yearLevel: Number(v.yearLevel), department: v.department || undefined }),
  );

  return (
    <form onSubmit={save} className="rounded-box border border-base-300 bg-base-100 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-base-content">Student profile</h2>
        <Button size="sm" variant="error" type="button" onClick={() => setConfirmRevoke(true)}>Revoke RFID</Button>
      </div>
      <div className="flex flex-col gap-3">
        <TextField id="as-sn" label="Student number" {...form.register("studentNumber")} />
        <div className="grid grid-cols-2 gap-3">
          <TextField id="as-yl" label="Year level" type="number" {...form.register("yearLevel")} />
          <TextField id="as-sec" label="Section" {...form.register("section")} />
        </div>
        <TextField id="as-prog" label="Program" {...form.register("program")} />
        <TextField id="as-dept" label="Department" {...form.register("department")} />
        <div><Button type="submit" loading={update.isPending}>Save profile</Button></div>
      </div>

      <Modal
        open={confirmRevoke}
        onClose={() => setConfirmRevoke(false)}
        title="Revoke RFID card?"
        actions={
          <>
            <Button variant="ghost" type="button" onClick={() => setConfirmRevoke(false)}>Cancel</Button>
            <Button variant="error" type="button" loading={revoke.isPending} onClick={() => revoke.mutate(undefined, { onSuccess: () => setConfirmRevoke(false) })}>Revoke</Button>
          </>
        }
      >
        <p className="text-sm text-base-content/70">Revocation is permanent — that card number can never be registered again.</p>
      </Modal>
    </form>
  );
}

function ProfessorProfile({ userId, data }: { userId: string; data: NonNullable<AdminUserDetail["professor"]> }) {
  const update = useUpdateProfessor(userId);
  const form = useForm({ defaultValues: data });
  useEffect(() => { form.reset(data); }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = form.handleSubmit((v) => update.mutate(v));

  return (
    <form onSubmit={save} className="rounded-box border border-base-300 bg-base-100 p-5">
      <h2 className="mb-3 font-semibold text-base-content">Professor profile</h2>
      <div className="flex flex-col gap-3">
        <TextField id="ap-emp" label="Employee number" {...form.register("employeeNumber")} />
        <TextField id="ap-dept" label="Department" {...form.register("department")} />
        <TextField id="ap-pos" label="Position" {...form.register("position")} />
        <div><Button type="submit" loading={update.isPending}>Save profile</Button></div>
      </div>
    </form>
  );
}
