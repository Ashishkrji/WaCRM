"use client";

import { CreditCard, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export function BillingPanel() {
  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Current Plan: Growth
          </CardTitle>
          <CardDescription>
            You are currently on the Growth plan. Next billing date is October 1, 2026.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Agents (3/Unlimited)</span>
                <span className="text-slate-200">∞</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Contacts (4,250/Unlimited)</span>
                <span className="text-slate-200">∞</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
          
          <div className="rounded-lg bg-slate-800/50 border border-slate-800 p-4">
            <h4 className="text-sm font-medium text-slate-200 mb-3">Included in Growth:</h4>
            <ul className="grid sm:grid-cols-2 gap-2">
              {['Unlimited Agents', 'Broadcast Campaigns', 'Automation Workflows', 'Analytics Dashboard', 'Priority Support'].map(feature => (
                <li key={feature} className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-800 pt-6">
          <Button variant="outline" className="border-slate-700 text-slate-300">
            Manage Payment Methods
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0">
            <Zap className="h-4 w-4" />
            Upgrade to Enterprise
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-lg">Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-400 py-4 text-center border-2 border-dashed border-slate-800 rounded-lg">
            No past invoices found.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
