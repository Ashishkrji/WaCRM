"use client";

import { LifeBuoy, BookOpen, MessageCircle, FileText, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <LifeBuoy className="h-6 w-6 text-primary" />
          Help & Support
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Get help with WaCRM, learn best practices, and contact our support team.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
          <CardHeader>
            <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="h-5 w-5" />
            </div>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Browse our comprehensive guides, API references, and step-by-step tutorials.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/docs" className="w-full">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                Read Docs
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-slate-800 text-slate-300 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Community Support
              </span>
            </div>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>
              You are on the Free plan. You can raise a support ticket, and our team will get back to you within 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/support/ticket" className="w-full">
              <Button className="w-full gap-2">
                Open a Ticket
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-4 mt-8">
        <h2 className="text-lg font-semibold text-slate-200">Recent Support Tickets</h2>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-slate-700 mb-4" />
              <h3 className="text-sm font-medium text-slate-300">No recent tickets</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[250px]">
                When you contact our support team, your active and past tickets will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
