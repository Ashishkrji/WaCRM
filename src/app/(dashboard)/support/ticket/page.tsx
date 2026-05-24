"use client";

import { Ticket, Send, Paperclip, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function SupportTicketPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Ticket className="h-6 w-6 text-primary" />
          Submit a Support Ticket
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Describe your issue below and our support team will get back to you.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Issue Details</CardTitle>
          <CardDescription>
            Please provide as much information as possible to help us resolve your issue faster.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Subject</label>
            <Input 
              placeholder="Brief summary of the issue" 
              className="bg-slate-950 border-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Category</label>
              <select className="flex h-10 w-full items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 outline-none focus:ring-1 focus:ring-primary/50">
                <option>Billing & Subscription</option>
                <option>Technical Issue (Bugs)</option>
                <option>API & Integrations</option>
                <option>WhatsApp Setup</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Priority</label>
              <select className="flex h-10 w-full items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 outline-none focus:ring-1 focus:ring-primary/50">
                <option>Low (General Query)</option>
                <option>Normal</option>
                <option>High (Impacting workflow)</option>
                <option>Urgent (System Down)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Description</label>
            <Textarea 
              placeholder="Please describe what you were trying to do and what went wrong..."
              className="min-h-[150px] bg-slate-950 border-slate-800"
            />
          </div>

          <div className="pt-2">
            <div className="border-2 border-dashed border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-950 hover:bg-slate-900 transition-colors cursor-pointer">
              <Paperclip className="h-8 w-8 text-slate-500 mb-2" />
              <p className="text-sm font-medium text-slate-300">Attach screenshots or logs</p>
              <p className="text-xs text-slate-500 mt-1">Drag and drop files here or click to browse</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-800 pt-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="h-4 w-4" />
            Typical response time: 24-48 hours
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              Submit Ticket
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
