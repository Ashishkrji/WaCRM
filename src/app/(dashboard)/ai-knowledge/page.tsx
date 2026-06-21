"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { 
  BookOpen, 
  UploadCloud, 
  Globe, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Layers
} from "lucide-react";
import { toast } from "sonner";

interface KnowledgeDoc {
  id: string;
  title: string;
  doc_type: string;
  status: "pending" | "processing" | "ready" | "failed";
  chunk_count: number;
  error_message?: string;
  created_at: string;
}

export default function AiKnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteTitle, setWebsiteTitle] = useState("");

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll status of processing documents
  useEffect(() => {
    const hasActiveDocs = documents.some(
      doc => doc.status === "pending" || doc.status === "processing"
    );
    if (!hasActiveDocs) return;

    const interval = setInterval(() => {
      silentFetchDocuments();
    }, 4000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  async function fetchDocuments() {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/knowledge");
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch knowledge base documents");
    } finally {
      setLoading(false);
    }
  }

  async function silentFetchDocuments() {
    try {
      const res = await fetch("/api/ai/knowledge");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Silent refresh error:", err);
    }
  }

  // Handle URL Ingestion
  async function handleAddUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!websiteUrl.trim()) return;

    setFetching(true);
    try {
      const urlText = websiteUrl.trim();
      const titleText = websiteTitle.trim() || new URL(urlText).hostname || "Website";

      const res = await fetch("/api/ai/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleText,
          doc_type: "website",
          source_url: urlText,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add website url");
      }

      toast.success("Website URL added! Ingesting content in the background...");
      setWebsiteUrl("");
      setWebsiteTitle("");
      fetchDocuments();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setFetching(false);
    }
  }

  // Handle File Upload
  async function handleFileUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/ai/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload document");
      }

      toast.success(`${selectedFile.name} uploaded successfully! Indexing...`);
      setSelectedFile(null);
      // Reset input element
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      fetchDocuments();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  // Handle Delete Document
  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"? This will delete all its vector embeddings.`)) return;

    try {
      const res = await fetch(`/api/ai/knowledge?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete document");
      }

      toast.success("Document deleted");
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    }
  }

  function getStatusBadge(status: KnowledgeDoc["status"]) {
    switch (status) {
      case "ready":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            Ready
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 flex items-center gap-1 w-fit">
            <Loader2 className="h-3 w-3 animate-spin" />
            Indexing
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 flex items-center gap-1 w-fit">
            <AlertTriangle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/10 flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <Link href="/ai-router" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mb-2 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to AI Settings
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            RAG Knowledge Base
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Feed document uploads or website links into the AI Agent. They will be chunked, embedded, and searched for context during WhatsApp auto-replies.
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={fetchDocuments}
          disabled={loading}
          className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading && "animate-spin"}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Import Forms */}
        <div className="lg:col-span-1 space-y-6">
          {/* File Upload card */}
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <UploadCloud className="h-4.5 w-4.5 text-indigo-400" />
                Upload Documents
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Upload local files containing text context. PDF, DOCX, or plain TXT files.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="space-y-2">
                  <div className="border border-dashed border-slate-700/80 rounded-lg p-5 flex flex-col items-center justify-center bg-slate-950/20 hover:bg-slate-950/40 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      id="file-upload"
                      accept=".txt,.pdf,.docx"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileText className="h-8 w-8 text-slate-500 mb-2" />
                    <span className="text-xs text-slate-300 text-center font-medium block">
                      {selectedFile ? selectedFile.name : "Choose TXT, PDF, or DOCX"}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "Max size 10MB"}
                    </span>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={!selectedFile || uploading} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
                      Uploading & Indexing...
                    </>
                  ) : (
                    "Upload & Index File"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Website Link Crawler card */}
          <Card className="bg-slate-900/40 border-slate-800">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Globe className="h-4.5 w-4.5 text-indigo-400" />
                Scrape Website URL
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Fetch and parse the readable text content of any public web page.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <form onSubmit={handleAddUrl} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="web-title" className="text-xs text-slate-300">Document Label</Label>
                  <Input
                    id="web-title"
                    placeholder="e.g. FAQ or Pricing Page"
                    value={websiteTitle}
                    onChange={(e) => setWebsiteTitle(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="web-url" className="text-xs text-slate-300">URL</Label>
                  <Input
                    id="web-url"
                    type="url"
                    placeholder="https://example.com/pricing"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white text-xs font-mono"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={!websiteUrl || fetching}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  {fetching ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
                      Scraping & Indexing...
                    </>
                  ) : (
                    "Crawl & Index URL"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Documents Table */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/40 border-slate-800 h-full">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-indigo-400" />
                  Ingested Documents
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  A list of files and URLs indexed in your vector database.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-slate-950 border-slate-800 text-slate-400 font-semibold px-2.5 py-0.5 text-xs">
                {documents.length} Total
              </Badge>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
                  <span className="text-xs">Loading files...</span>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-850 rounded-xl bg-slate-950/10 text-slate-500">
                  <BookOpen className="h-10 w-10 text-slate-700 mb-3" />
                  <span className="text-sm font-semibold text-slate-400">No documents ingested</span>
                  <span className="text-xs text-slate-500 mt-1 max-w-xs text-center leading-relaxed">
                    Upload your first document or scrape a URL to build your AI's custom context.
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20 shadow-inner">
                  <table className="w-full text-left text-slate-300 text-xs">
                    <thead>
                      <tr className="border-b border-slate-850 bg-slate-950/30 text-slate-400 font-medium">
                        <th className="px-4 py-3">Title / Source</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Chunks</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="px-4 py-3.5 max-w-[200px] truncate">
                            <span className="font-semibold text-slate-200 block truncate">{doc.title}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Added {new Date(doc.created_at).toLocaleDateString()}
                            </span>
                            {doc.status === "failed" && doc.error_message && (
                              <span className="text-[10px] text-rose-400/90 block mt-1 leading-normal max-w-[200px] whitespace-pre-wrap">
                                Error: {doc.error_message}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-medium uppercase text-slate-400 text-[10px]">
                            {doc.doc_type}
                          </td>
                          <td className="px-4 py-3.5">
                            {getStatusBadge(doc.status)}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-400">
                            {doc.status === "ready" ? doc.chunk_count : "-"}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(doc.id, doc.title)}
                              className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 h-7 w-7 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
