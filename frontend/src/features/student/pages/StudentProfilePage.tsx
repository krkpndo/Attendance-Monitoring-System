import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStudentProfile, useUpdateProfile } from "../student.queries";
import { studentProfileUpdateSchema, type StudentProfileUpdate } from "../student.schema";
import { DataState } from "@/components/ui/DataState";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

/*
 * Profile — read the current profile, and edit the editable bits. The backend
 * requires the current password to save any change (re-auth), and the update is
 * multipart because it can carry a new profile image — so we assemble FormData.
 */
export function StudentProfilePage() {
  const profile = useStudentProfile();
  const update = useUpdateProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageName, setImageName] = useState<string | null>(null);

  const form = useForm<StudentProfileUpdate>({
    resolver: zodResolver(studentProfileUpdateSchema),
    defaultValues: { name: "", email: "", username: "", password: "" },
  });

  // Seed the editable fields once the profile arrives.
  useEffect(() => {
    if (profile.data) {
      form.reset({
        name: profile.data.user.name,
        email: profile.data.user.email,
        username: profile.data.user.username,
        password: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.data]);

  const onSubmit = (data: StudentProfileUpdate) => {
    const fd = new FormData();
    if (data.name) fd.append("name", data.name);
    if (data.email) fd.append("email", data.email);
    if (data.username) fd.append("username", data.username);
    fd.append("password", data.password);
    const file = fileRef.current?.files?.[0];
    if (file) fd.append("profileImage", file);

    update.mutate(fd, {
      onSuccess: () => {
        form.setValue("password", "");
        setImageName(null);
        if (fileRef.current) fileRef.current.value = "";
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-base-content">Profile</h1>

      <DataState query={profile}>
        {(p) => (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Read-only student identity */}
            <div className="rounded-box border border-base-300 bg-base-100 p-5">
              <h2 className="mb-3 font-semibold text-base-content">Student details</h2>
              <dl className="flex flex-col gap-2 text-sm">
                <Row label="Student No." value={p.studentNumber} mono />
                <Row label="Program" value={p.program} />
                <Row label="Year & Section" value={`${p.yearLevel} - ${p.section}`} />
                <Row label="Department" value={p.department ?? "—"} />
              </dl>
            </div>

            {/* Editable account fields */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="md:col-span-2 rounded-box border border-base-300 bg-base-100 p-5">
              <h2 className="mb-3 font-semibold text-base-content">Account</h2>
              <div className="flex flex-col gap-3">
                <TextField id="name" label="Name" error={form.formState.errors.name?.message} {...form.register("name")} />
                <TextField id="email" label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
                <TextField id="username" label="Username" error={form.formState.errors.username?.message} {...form.register("username")} />

                <div className="form-control">
                  <span className="label-text mb-1">Profile photo</span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg"
                    className="file-input file-input-bordered w-full"
                    onChange={(e) => setImageName(e.target.files?.[0]?.name ?? null)}
                  />
                  {imageName && <span className="mt-1 text-xs text-base-content/60">{imageName}</span>}
                </div>

                <div className="divider my-1" />

                <TextField
                  id="password"
                  label="Current password (required to save)"
                  type="password"
                  autoComplete="current-password"
                  error={form.formState.errors.password?.message}
                  {...form.register("password")}
                />

                <div className="mt-1">
                  <Button type="submit" loading={update.isPending}>Save changes</Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </DataState>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-base-content/60">{label}</dt>
      <dd className={mono ? "font-mono" : ""}>{value}</dd>
    </div>
  );
}
