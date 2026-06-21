'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Settings } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { WhatsAppConfig } from '@/components/settings/whatsapp-config';
import { ProfileForm } from '@/components/settings/profile-form';
import { PasswordForm } from '@/components/settings/password-form';
import { SessionsCard } from '@/components/settings/sessions-card';

const TAB_VALUES = [
  'profile',
  'whatsapp',
] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(v: string | null): v is TabValue {
  return !!v && (TAB_VALUES as readonly string[]).includes(v);
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryTab = searchParams.get('tab');
  const tab: TabValue = isTabValue(queryTab) ? queryTab : 'profile';

  useEffect(() => {
    if (queryTab === 'workspace') {
      router.replace('/workspace');
    } else if (queryTab === 'templates') {
      router.replace('/templates');
    } else if (queryTab === 'tags') {
      router.replace('/tags');
    } else if (queryTab === 'pipelines') {
      router.replace('/pipeline-manager');
    } else if (queryTab === 'integrations') {
      router.replace('/integrations');
    } else if (queryTab === 'appearance') {
      router.replace('/appearance');
    } else if (queryTab === 'team') {
      router.replace('/team');
    }
  }, [queryTab, router]);

  const onChange = (next: TabValue) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.replace(`/settings?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your account profile details and WhatsApp® configurations.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => onChange(v as TabValue)}>
        <TabsList className="bg-slate-900 border border-slate-700">
          <TabsTrigger
            value="profile"
            className="data-active:bg-slate-800 data-active:text-primary text-slate-400"
          >
            <User className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="whatsapp"
            className="data-active:bg-slate-800 data-active:text-primary text-slate-400"
          >
            <Settings className="size-4" />
            WhatsApp Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileForm />
          <PasswordForm />
          <SessionsCard />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
