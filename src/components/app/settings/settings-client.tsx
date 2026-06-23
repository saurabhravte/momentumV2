"use client";

import { useState } from "react";
import { Check, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { api } from "@/trpc/react";

/**
 * Settings — edit profile details (name, owned by Better Auth) and customise
 * the app (greeting tone, list density, accent colour, notifications). Profile
 * goes through authClient.updateUser; everything else is api.preferences.
 */
export function SettingsClient({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const utils = api.useUtils();
  const prefs = api.preferences.get.useQuery();
  const updatePrefs = api.preferences.update.useMutation({
    onSuccess: () => utils.preferences.get.invalidate(),
  });

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await authClient.updateUser({ name });
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 2000);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>

      {/* Profile */}
      <section className="bg-card mb-6 rounded-xl border p-5">
        <div className="mb-4 flex items-center gap-2">
          <User className="text-muted-foreground size-4" />
          <h2 className="text-sm font-medium">Profile</h2>
        </div>
        <label className="text-muted-foreground mb-1 block text-xs">
          Display name
        </label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <label className="text-muted-foreground mb-1 mt-4 block text-xs">
          Email
        </label>
        <Input value={email} disabled className="opacity-60" />
        <p className="text-muted-foreground mt-1 text-xs">
          Email is managed by your Google sign-in.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Button
            size="sm"
            onClick={saveProfile}
            disabled={savingProfile || name.trim() === initialName.trim()}
          >
            {savingProfile ? "Saving…" : "Save profile"}
          </Button>
          {savedProfile && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="mr-1 inline size-3.5" />
              Saved
            </span>
          )}
        </div>
      </section>

      {/* Customisation */}
      <section className="bg-card rounded-xl border p-5">
        <h2 className="mb-4 text-sm font-medium">Customisation</h2>

        <Choice
          label="Greeting"
          hint="How the dashboard welcomes you."
          value={prefs.data?.greetingStyle ?? "auto"}
          options={[
            { value: "auto", label: "Time of day" },
            { value: "morning", label: "Always upbeat" },
            { value: "neutral", label: "Minimal" },
          ]}
          onChange={(v) => updatePrefs.mutate({ greetingStyle: v as never })}
        />

        <Choice
          label="Density"
          hint="Spacing of lists and cards."
          value={prefs.data?.density ?? "comfortable"}
          options={[
            { value: "comfortable", label: "Comfortable" },
            { value: "compact", label: "Compact" },
          ]}
          onChange={(v) => updatePrefs.mutate({ density: v as never })}
        />

        <Choice
          label="Accent source"
          hint="Which connector colour leads the UI."
          value={prefs.data?.accentSource ?? "gmail"}
          options={[
            { value: "gmail", label: "Gmail" },
            { value: "calendar", label: "Calendar" },
            { value: "slack", label: "Slack" },
            { value: "github", label: "GitHub" },
          ]}
          onChange={(v) => updatePrefs.mutate({ accentSource: v as never })}
        />

        <Choice
          label="Notifications"
          hint="The top-right bell."
          value={prefs.data?.notificationsEnabled ?? "on"}
          options={[
            { value: "on", label: "On" },
            { value: "off", label: "Off" },
          ]}
          onChange={(v) =>
            updatePrefs.mutate({ notificationsEnabled: v as never })
          }
        />
      </section>
    </div>
  );
}

function Choice({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-0">
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              value === o.value
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
