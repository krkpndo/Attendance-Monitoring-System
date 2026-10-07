import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProfProfile, useUpdateProfProfile } from "../professor.queries";
import { DataState } from "@/components/ui/DataState";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

/*
 * Professor profile. Same re-auth-to-save pattern as the student one, but the
 * shared updateProfile endpoint also supports an optional newPassword, so we
 * expose a "new password" field.
 */
const schema = z.object({
  name: z.string().min(1).max(50).optional().or(z.literal("")),
  email: z.string().email("Invalid email").max(50).optional().or(z.literal("")),
  username: z.string().min(3, "At least 3 characters").max(50).optional().or(z.literal("")),
  newPassword: z.string().min(8, "At least 8 characters").optional().or(z.literal("")),
  password: z.string().min(1, "Current password is required to save changes"),
});
type Form = z.infer<typeof schema>;

export function ProfessorProfilePage() {
  const profile = useProfProfile();
  const update = useUpdateProfProfile();
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", username: "", newPassword: "", password: "" },
  });

  useEffect(() => {
    if (profile.data) {
      form.reset({ name: profile.data.user.name, email: profile.data.user.email, username: profile.data.user.username, newPassword: "", password: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.data]);

  const onSubmit = (data: Form) => {
    const fd = new FormData();
    if (data.name) fd.append("name", data.name);
    if (data.email) fd.append("email", data.email);
    if (data.username) fd.append("username", data.username);
    if (data.newPassword) fd.append("newPassword", data.newPassword);
    fd.append("password", data.password);
    const file = fileRef.current?.files?.[0];
    if (file) fd.append("profileImage", file);
    update.mutate(fd, { onSuccess: () => { form.setValue("password", ""); form.setValue("newPassword", ""); if (fileRef.current) fileRef.current.value = ""; } });
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-base-content">Profile</h1>
      <DataState query={profile}>
        {(p) => (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-box border border-base-300 bg-base-100 p-5">
              <h2 className="mb-3 font-semibold text-base-content">Faculty details</h2>
              <dl className="flex flex-col gap-2 text-sm">
                <Row label="Employee No." value={p.employeeNumber} mono />
                <Row label="Department" value={p.department} />
                <Row label="Position" value={p.position} />
              </dl>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="md:col-span-2 rounded-box border border-base-300 bg-base-100 p-5">
              <h2 className="mb-3 font-semibold text-base-content">Account</h2>
              <div className="flex flex-col gap-3">
                <TextField id="name" label="Name" error={form.formState.errors.name?.message} {...form.register("name")} />
                <TextField id="email" label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
                <TextField id="username" label="Username" error={form.formState.errors.username?.message} {...form.register("username")} />
                <div className="form-control">
                  <span className="label-text mb-1">Profile photo</span>
                  <input ref={fileRef} type="file" accept="image/jpeg" className="file-input file-input-bordered w-full" />
                </div>
                <div className="divider my-1" />
                <TextField id="newPassword" label="New password (optional)" type="password" autoComplete="new-password" error={form.formState.errors.newPassword?.message} {...form.register("newPassword")} />
                <TextField id="password" label="Current password (required to save)" type="password" autoComplete="current-password" error={form.formState.errors.password?.message} {...form.register("password")} />
                <div className="mt-1"><Button type="submit" loading={update.isPending}>Save changes</Button></div>
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
