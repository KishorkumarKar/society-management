"use client";

import { useState } from "react";
import { ShieldCheck, Check, RotateCcw } from "lucide-react";
import { useData } from "@/context/DataContext";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { AclAction, AclModule } from "@/lib/types";

const MODULES: AclModule[] = [
  "Users",
  "Notices",
  "Events",
  "Collections",
  "Expenses",
  "Societies",
  "ACL",
];

const ACTIONS: AclAction[] = ["view", "create", "edit", "delete"];

/**
 * Renders the permission grid for exactly one module. Only the active tab's
 * instance of this component is mounted at a time — switching tabs unmounts
 * the previous module's table rather than keeping all seven in the DOM.
 */
function AclModuleTable({ moduleName }: { moduleName: AclModule }) {
  const { aclMatrix, toggleAclPermission } = useData();

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
            <th className="px-5 py-3 font-medium">Role</th>
            {ACTIONS.map((action) => (
              <th key={action} className="px-5 py-3 text-center font-medium">
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {aclMatrix.map((entry) => {
            // Any role/module combination missing from the data defaults to
            // an empty permission list — every action starts unchecked.
            const allowed = entry.permissions[moduleName] ?? [];
            return (
              <tr key={entry.role} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-3 font-medium text-ink">{entry.label}</td>
                {ACTIONS.map((action) => {
                  const granted = allowed.includes(action);
                  return (
                    <td key={action} className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleAclPermission(entry.role, moduleName, action)}
                        aria-pressed={granted}
                        aria-label={`${granted ? "Revoke" : "Grant"} ${action} on ${moduleName} for ${entry.label}`}
                        className={`mx-auto flex h-7 w-7 items-center justify-center rounded-sm border transition-colors ${
                          granted
                            ? "border-sage/40 bg-sage/15 text-sage hover:border-rust/40 hover:bg-rust/10 hover:text-rust"
                            : "border-ink/10 text-transparent hover:border-brass/40 hover:bg-brass/10"
                        }`}
                      >
                        <Check size={14} strokeWidth={2.5} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function AclContent() {
  const { resetAcl } = useData();
  const [activeModule, setActiveModule] = useState<AclModule>(MODULES[0]);
  const [confirmingReset, setConfirmingReset] = useState(false);

  function handleReset() {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    resetAcl();
    setConfirmingReset(false);
  }

  function handleTabChange(moduleName: AclModule) {
    setActiveModule(moduleName);
    setConfirmingReset(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Access control"
        description="Click a cell to grant or revoke that action for a role. Switch modules with the tabs below."
        action={
          <Button
            variant="secondary"
            onClick={handleReset}
            className="!border-ink/20 !text-ink hover:!border-rust hover:!text-rust"
          >
            <RotateCcw size={15} strokeWidth={2} />
            {confirmingReset ? "Click again to confirm" : "Reset to defaults"}
          </Button>
        }
      />

      <Card className="flex items-start gap-3 border-brass/30 bg-brass/[0.06] p-5">
        <ShieldCheck size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-brass" />
        <p className="text-sm text-ink/70">
          Toggles here update this browser session only, seeded from{" "}
          <code className="font-mono text-xs">data/acl.json</code>. They aren&apos;t wired to
          actual route access yet — the console still gates pages by role directly via{" "}
          <code className="font-mono text-xs">AdminGuard</code> /{" "}
          <code className="font-mono text-xs">RequireRole</code>. Once the backend ACL endpoint
          is ready, swap the reads/writes here for{" "}
          <code className="font-mono text-xs">GET/PUT /api/acl</code> calls.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2 border-b border-ink/10">
        {MODULES.map((moduleName) => {
          const active = moduleName === activeModule;
          return (
            <button
              key={moduleName}
              type="button"
              onClick={() => handleTabChange(moduleName)}
              aria-pressed={active}
              className={`border-b-2 px-4 py-3 text-sm transition-colors ${
                active
                  ? "border-brass text-brass"
                  : "border-transparent text-ink/50 hover:text-ink"
              }`}
            >
              {moduleName}
            </button>
          );
        })}
      </div>

      <AclModuleTable key={activeModule} moduleName={activeModule} />
    </div>
  );
}

export default function AclPage() {
  return (
    <RequireRole roles={["super-admin"]}>
      <AclContent />
    </RequireRole>
  );
}
