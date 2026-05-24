"use client";

import { Users, UserPlus, Shield, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TEAM_MEMBERS = [
  { id: 1, name: "Admin User", email: "admin@wacrm.tech", role: "Admin", status: "Active" },
  { id: 2, name: "Sales Agent", email: "agent@wacrm.tech", role: "Agent", status: "Active" },
  { id: 3, name: "Support Rep", email: "support@wacrm.tech", role: "Agent", status: "Pending" },
];

export function TeamManager() {
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl">Team Management</CardTitle>
          <CardDescription>Manage agents and control their access permissions.</CardDescription>
        </div>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Agent
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-slate-800">
          <div className="grid grid-cols-12 gap-4 border-b border-slate-800 p-4 text-sm font-medium text-slate-400">
            <div className="col-span-6">Member</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1"></div>
          </div>
          <div className="divide-y divide-slate-800">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.id} className="grid grid-cols-12 items-center gap-4 p-4">
                <div className="col-span-6 flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  {member.role === "Admin" ? (
                    <Shield className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Users className="h-4 w-4 text-slate-400" />
                  )}
                  <span className="text-sm text-slate-300">{member.role}</span>
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    member.status === 'Active' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {member.status}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
