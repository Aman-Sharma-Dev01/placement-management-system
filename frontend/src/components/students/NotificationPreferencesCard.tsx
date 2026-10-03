import React, { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Check, Loader2 } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { toast } from '../../utils/toast';

type MutedCategory = 'jobs' | 'applications' | 'interviews' | 'profile';

interface PreferenceState {
  emailNotificationsEnabled: boolean;
  mutedCategories: MutedCategory[];
}

const DEFAULT_PREFERENCES: PreferenceState = {
  emailNotificationsEnabled: true,
  mutedCategories: [],
};

const CATEGORY_LABELS: Record<MutedCategory, { label: string; description: string }> = {
  jobs: {
    label: 'Placement drives & job profiles',
    description: 'New drives you are eligible for, drive updates and closing-soon reminders.',
  },
  applications: {
    label: 'Application activity',
    description: 'Submission confirmations, shortlists, offers and withdrawal updates.',
  },
  interviews: {
    label: 'Interview rounds',
    description: 'Scheduling confirmations, reminders and reschedule notices.',
  },
  profile: {
    label: 'Profile verification',
    description: 'Approval, rejection and resubmission notices about your profile.',
  },
};

const ALLOWED_CATEGORIES: MutedCategory[] = ['jobs', 'applications', 'interviews', 'profile'];

const asMutedCategories = (value: unknown): MutedCategory[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is MutedCategory => ALLOWED_CATEGORIES.includes(item as MutedCategory));
};

/** The signed-in user is cached in localStorage by AuthPage/App. */
const readCachedPreferences = (): PreferenceState | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const stored = JSON.parse(raw)?.notificationPreferences;
    if (!stored) return null;
    return {
      emailNotificationsEnabled: stored.emailNotificationsEnabled !== false,
      mutedCategories: asMutedCategories(stored.mutedCategories),
    };
  } catch {
    return null;
  }
};

/** Keeps the localStorage cache in step so other views see fresh values. */
const writeCachedPreferences = (preferences: PreferenceState) => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    parsed.notificationPreferences = preferences;
    localStorage.setItem('user', JSON.stringify(parsed));
  } catch {
    /* the server is the source of truth; cache is best effort */
  }
};

/**
 * Lets the user control which notification emails they receive.
 *
 * Two caveats are surfaced in the UI because they are enforced server-side and
 * would otherwise look like bugs:
 *  - In-app notifications are never affected; only the email channel is.
 *  - Security emails (welcome, password reset, password change) always send.
 */
export const NotificationPreferencesCard: React.FC = () => {
  const [preferences, setPreferences] = useState<PreferenceState>(() => readCachedPreferences() || DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);

  // Re-seed once on mount in case the cache is stale but present.
  useEffect(() => {
    const cached = readCachedPreferences();
    if (cached) setPreferences(cached);
  }, []);

  const persist = useCallback(async (next: PreferenceState) => {
    setSaving(true);
    try {
      const response = await authApi.updateNotificationPreferences(next);
      const saved = response?.notificationPreferences;
      const resolved: PreferenceState = {
        emailNotificationsEnabled: saved?.emailNotificationsEnabled !== false,
        mutedCategories: asMutedCategories(saved?.mutedCategories),
      };
      setPreferences(resolved);
      writeCachedPreferences(resolved);
      toast.success('Notification preferences saved');
    } catch (error: any) {
      // Roll the switch back so the UI keeps matching what is stored.
      setPreferences(readCachedPreferences() || DEFAULT_PREFERENCES);
      toast.error(error?.response?.data?.message || 'Could not save preferences');
    } finally {
      setSaving(false);
    }
  }, []);

  const update = (next: PreferenceState) => {
    setPreferences(next);
    // Auto-save keeps the control honest: there is no confirm button to forget.
    void persist(next);
  };

  const toggleCategory = (category: MutedCategory) => {
    const muted = preferences.mutedCategories.includes(category);
    update({
      ...preferences,
      mutedCategories: muted
        ? preferences.mutedCategories.filter((item) => item !== category)
        : [...preferences.mutedCategories, category],
    });
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="m-0 text-[11.5px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
          <Bell size={14} />
          Email Notifications
        </h3>
        <p className="mt-1.5 mb-0 text-[11.5px] text-gray-500">
          Choose what lands in your inbox. In-app notifications always appear regardless of these settings.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-gray-50/60">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-gray-900 flex items-center gap-2">
              {preferences.emailNotificationsEnabled ? (
                <Bell size={14} className="text-emerald-600" />
              ) : (
                <BellOff size={14} className="text-gray-400" />
              )}
              All email notifications
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {preferences.emailNotificationsEnabled
                ? 'Emails are on for every category that is not muted below.'
                : 'Only security emails (password reset, password change) are still sent.'}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.emailNotificationsEnabled}
            aria-label="Toggle all email notifications"
            disabled={saving}
            onClick={() => update({ ...preferences, emailNotificationsEnabled: !preferences.emailNotificationsEnabled })}
            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
              preferences.emailNotificationsEnabled ? 'bg-emerald-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                preferences.emailNotificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {(Object.keys(CATEGORY_LABELS) as MutedCategory[]).map((category) => {
            const muted = preferences.mutedCategories.includes(category);
            return (
              <button
                key={category}
                type="button"
                disabled={saving}
                onClick={() => toggleCategory(category)}
                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <span
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    muted ? 'border-gray-300 bg-white' : 'border-emerald-600 bg-emerald-600'
                  }`}
                >
                  {!muted && <Check size={12} className="text-white" />}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[12.5px] font-medium ${muted ? 'text-gray-500' : 'text-gray-900'}`}>
                    {CATEGORY_LABELS[category].label}
                  </span>
                  <span className="block text-[11px] text-gray-500 mt-0.5">
                    {CATEGORY_LABELS[category].description}
                  </span>
                </span>
                <span className="ml-auto shrink-0 text-[10.5px] font-medium">
                  {muted ? (
                    <span className="text-gray-400">Muted</span>
                  ) : (
                    <span className="text-emerald-700">On</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-[11px] text-gray-500">
          Password reset and password change emails are always sent, even when everything above is off.
        </p>
        {saving && (
          <span className="flex items-center gap-1.5 text-[11px] text-gray-500 shrink-0">
            <Loader2 size={12} className="animate-spin" />
            Saving
          </span>
        )}
      </div>
    </section>
  );
};
