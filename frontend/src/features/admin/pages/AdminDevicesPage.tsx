import { useState } from "react";
import { useAdminDevices, useRegisterDevice, useRevokeDevice } from "../admin.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { formatTimestamp } from "@/lib/format";
import type { RegisteredDevice } from "../admin.schema";

/*
 * Devices — register scanner terminals and revoke them. The plaintext token is
 * returned exactly once on registration (only the hash is stored), so we surface
 * it in a copyable banner and warn it won't be shown again.
 */
export function AdminDevicesPage() {
  const query = useAdminDevices();
  const register = useRegisterDevice();
  const revoke = useRevokeDevice();

  const [registerOpen, setRegisterOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [issued, setIssued] = useState<RegisteredDevice | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const doRegister = () => {
    if (!label.trim()) return;
    register.mutate(label.trim(), {
      onSuccess: (d) => { setIssued(d as RegisteredDevice); setLabel(""); setRegisterOpen(false); },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base-content">Devices</h1>
        <Button onClick={() => setRegisterOpen(true)}>Register device</Button>
      </div>

      {issued && (
        <Banner variant="success" onDismiss={() => setIssued(null)}>
          Device "{issued.label}" registered. Token (shown once):{" "}
          <span className="font-mono break-all">{issued.token}</span>
        </Banner>
      )}

      <DataState query={query} isEmpty={query.data?.length === 0} empty={<EmptyState title="No devices" description="Register a scanner terminal to get started." action={<Button onClick={() => setRegisterOpen(true)}>Register device</Button>} />}>
        {(devices) => (
          <div className="overflow-x-auto rounded-box border border-base-300">
            <table className="table">
              <thead><tr><th>Label</th><th>Status</th><th>Last used</th><th>Last seen</th><th></th></tr></thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id}>
                    <td className="font-medium">{d.label}</td>
                    <td><Badge>{d.status}</Badge></td>
                    <td className="text-sm">{d.lastUsedBy ? `${d.lastUsedBy.name}` : "—"}</td>
                    <td className="text-sm text-base-content/60">{d.lastSeenAt ? formatTimestamp(d.lastSeenAt) : "—"}</td>
                    <td className="text-right">
                      {d.status === "ACTIVE" && (
                        <Button size="sm" variant="error" onClick={() => setRevoking(d.id)}>Revoke</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataState>

      {/* Register modal */}
      <Modal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Register a device"
        actions={
          <>
            <Button variant="ghost" onClick={() => setRegisterOpen(false)}>Cancel</Button>
            <Button loading={register.isPending} disabled={!label.trim()} onClick={doRegister}>Register</Button>
          </>
        }
      >
        <TextField id="deviceLabel" label="Label" placeholder="e.g. Room 301 terminal" value={label} onChange={(e) => setLabel(e.target.value)} />
      </Modal>

      {/* Revoke confirm (destructive → modal, per §2) */}
      <Modal
        open={!!revoking}
        onClose={() => setRevoking(null)}
        title="Revoke device?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setRevoking(null)}>Cancel</Button>
            <Button variant="error" loading={revoke.isPending} onClick={() => revoking && revoke.mutate({ deviceId: revoking }, { onSuccess: () => setRevoking(null) })}>Revoke</Button>
          </>
        }
      >
        <p className="text-sm text-base-content/70">
          Revoking is permanent — the device's token stops working immediately and it can't tap attendance anymore.
        </p>
      </Modal>
    </div>
  );
}
