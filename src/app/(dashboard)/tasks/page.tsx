"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task, Profile, Contact } from "@/types";
import {
  Plus,
  Search,
  CheckCircle,
  Circle,
  Clock,
  Trash2,
  Calendar,
  AlertTriangle,
  User,
  Tags,
  Link,
  ChevronDown,
  Sparkles,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isAfter, isBefore, startOfDay } from "date-fns";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("pending");

  // Modal / Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    due_date: "",
    assigned_to: "",
    contact_id: "",
    recurring: "",
  });
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const fetchTasksData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const [tasksRes, profilesRes, contactsRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("*, contact:contacts(*)")
          .eq("user_id", user.id)
          .order("due_date", { ascending: true }),
        supabase
          .from("profiles")
          .select("*")
          .order("full_name"),
        supabase
          .from("contacts")
          .select("*")
          .order("name"),
      ]);

      if (tasksRes.data) setTasks(tasksRes.data as Task[]);
      if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
      if (contactsRes.data) setContacts(contactsRes.data as Contact[]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load tasks dashboard data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTasksData();
  }, [fetchTasksData]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      due_date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
      assigned_to: "",
      contact_id: "",
      recurring: "",
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : "",
      assigned_to: task.assigned_to || "",
      contact_id: task.contact_id || "",
      recurring: task.recurring || "",
    });
    setModalOpen(true);
  };

  // Handle Form Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Form (Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        priority: formData.priority,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        assigned_to: formData.assigned_to || null,
        contact_id: formData.contact_id || null,
        recurring: formData.recurring || null,
      };

      let res;
      if (editingTask) {
        res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingTask.id, ...payload }),
        });
      } else {
        res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      toast.success(editingTask ? "Task updated successfully" : "Task created successfully");
      setModalOpen(false);
      fetchTasksData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Task Status (Complete / Pending)
  const toggleStatus = async (task: Task) => {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
      toast.success(nextStatus === "completed" ? "Task completed!" : "Task marked pending");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update task status");
    }
  };

  // Delete Task
  const deleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");

      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success("Task deleted successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete task");
    }
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Search text
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q) || false;
        const matchesContact = t.contact?.name?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesDesc && !matchesContact) return false;
      }
      // 2. Priority
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      // 3. Status
      if (statusFilter !== "all" && t.status !== statusFilter) return false;

      return true;
    });
  }, [tasks, search, priorityFilter, statusFilter]);

  // Group Tasks into columns (Today, Tomorrow, Later, Overdue, Completed)
  const columns = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(new Date());
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = startOfDay(new Date());
    dayAfterTomorrow.setDate(today.getDate() + 2);

    const overdue: Task[] = [];
    const dueToday: Task[] = [];
    const dueTomorrow: Task[] = [];
    const later: Task[] = [];
    const noDueDate: Task[] = [];
    const completed: Task[] = [];

    filteredTasks.forEach((t) => {
      if (t.status === "completed") {
        completed.push(t);
        return;
      }
      if (!t.due_date) {
        noDueDate.push(t);
        return;
      }

      const dueDate = new Date(t.due_date);
      if (isBefore(dueDate, today)) {
        overdue.push(t);
      } else if (isToday(dueDate)) {
        dueToday.push(t);
      } else if (isTomorrow(dueDate)) {
        dueTomorrow.push(t);
      } else {
        later.push(t);
      }
    });

    return [
      { id: "overdue", label: "Overdue", tasks: overdue, color: "text-rose-400 bg-rose-500/10 border-rose-500/25" },
      { id: "today", label: "Due Today", tasks: dueToday, color: "text-amber-400 bg-amber-500/10 border-amber-500/25" },
      { id: "tomorrow", label: "Due Tomorrow", tasks: dueTomorrow, color: "text-sky-400 bg-sky-500/10 border-sky-500/25" },
      { id: "later", label: "Later", tasks: later, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25" },
      { id: "nodue", label: "No Due Date", tasks: noDueDate, color: "text-slate-400 bg-slate-800/20 border-slate-700/20" },
      { id: "completed", label: "Completed", tasks: completed, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
    ];
  }, [filteredTasks]);

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 p-4 sm:p-6 space-y-4 overflow-y-auto">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="h-5.5 w-5.5 text-indigo-400 animate-pulse" />
            CRM Tasks & Reminders
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage customer follow-ups and agent workflows.</p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, descriptions or contacts..."
            className="border-slate-800 bg-slate-950 pl-9 text-xs text-white placeholder-slate-500 focus:border-indigo-500/50"
          />
        </div>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Grid Dashboard Columns */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col space-y-3 bg-slate-900/30 border border-slate-900/90 rounded-2xl p-3 h-[calc(100vh-14.5rem)] overflow-y-auto min-h-[300px]">
              {/* Column Header */}
              <div className={`flex items-center justify-between px-2.5 py-1 rounded-lg border text-xs font-semibold uppercase tracking-wider ${column.color}`}>
                <span>{column.label}</span>
                <span className="font-mono text-[10px] bg-slate-950/40 px-1.5 py-0.2 rounded-full">
                  {column.tasks.length}
                </span>
              </div>

              {/* Column Tasks */}
              <div className="flex-1 space-y-2.5">
                {column.tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-40">
                    <CheckCircle className="h-6 w-6 text-slate-700" />
                    <span className="text-[10px] text-slate-500 mt-1">Clean column</span>
                  </div>
                ) : (
                  column.tasks.map((task) => {
                    const isOverdue = column.id === "overdue";
                    return (
                      <div
                        key={task.id}
                        onClick={() => openEditModal(task)}
                        className={`group relative bg-slate-900 border hover:border-slate-700 rounded-xl p-3.5 space-y-2 cursor-pointer shadow-md transition-all ${
                          task.status === "completed"
                            ? "border-slate-900/40 opacity-70"
                            : isOverdue
                              ? "border-rose-950 hover:border-rose-900"
                              : "border-slate-850"
                        }`}
                      >
                        {/* Checkbox & Title */}
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStatus(task);
                            }}
                            className="mt-0.5 text-slate-500 hover:text-white"
                          >
                            {task.status === "completed" ? (
                              <CheckCircle className="h-4 w-4 text-indigo-400" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                          <span
                            className={`text-xs font-semibold text-white leading-normal truncate block flex-1 ${
                              task.status === "completed" && "line-through text-slate-500"
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className={`text-[10px] leading-relaxed line-clamp-2 ${
                            task.status === "completed" ? "text-slate-600" : "text-slate-400"
                          }`}>
                            {task.description}
                          </p>
                        )}

                        <div className="h-px bg-slate-850/40" />

                        {/* Details Badges */}
                        <div className="flex flex-wrap gap-1 items-center justify-between text-[9px]">
                          {/* Priority */}
                          <span className={`px-1.5 py-0.2 rounded font-semibold uppercase ${
                            task.priority === "high"
                              ? "bg-rose-500/10 text-rose-400"
                              : task.priority === "medium"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-slate-800 text-slate-400"
                          }`}>
                            {task.priority}
                          </span>

                          {/* Due date */}
                          {task.due_date && (
                            <span className={`flex items-center gap-0.5 font-medium ${
                              isOverdue ? "text-rose-400" : "text-slate-400"
                            }`}>
                              <Calendar className="h-2.5 w-2.5" />
                              {format(new Date(task.due_date), "MMM d")}
                            </span>
                          )}
                        </div>

                        {/* Agent / Contact assignments */}
                        {(task.contact || task.assigned_to) && (
                          <div className="flex flex-col gap-0.5 text-[9px] text-slate-500 bg-slate-950/20 p-1.5 rounded-lg border border-slate-900/50">
                            {task.contact && (
                              <div className="flex items-center gap-1">
                                <Link className="h-2.5 w-2.5 text-indigo-400" />
                                <span className="text-slate-400 truncate max-w-[110px]">{task.contact.name || task.contact.phone}</span>
                              </div>
                            )}
                            {task.assigned_to && (
                              <div className="flex items-center gap-1">
                                <User className="h-2.5 w-2.5 text-slate-500" />
                                <span className="truncate max-w-[110px]">
                                  {profiles.find(p => p.user_id === task.assigned_to)?.full_name || "Assigned"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Delete Button (hover visual only) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                          className="absolute right-2 top-2 p-1 text-slate-500 hover:text-rose-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Creation & Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 text-white overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-850 px-5 py-3.5 bg-slate-950/40">
              <span className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5" />
                {editingTask ? "Modify CRM Task" : "Schedule New CRM Task"}
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white focus:outline-none"
              >
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Task Title *</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Call client for proposal follow-up"
                  required
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Description / Instruction</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Details of what needs to be discussed or resolved..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-xl text-white focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Priority Level</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Recurring Period</label>
                  <select
                    name="recurring"
                    value={formData.recurring}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">One-time Task</option>
                    <option value="daily">Daily Recurring</option>
                    <option value="weekly">Weekly Recurring</option>
                    <option value="monthly">Monthly Recurring</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Assign Employee</label>
                  <select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.user_id}>
                        {p.full_name} {p.user_id === currentUserId ? "(me)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Link Contact (Customer)</label>
                <select
                  name="contact_id"
                  value={formData.contact_id}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Do not link contact</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.phone} ({c.company || "No Company"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-px bg-slate-850 pt-2" />

              <div className="flex gap-2.5 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="border-slate-800 bg-slate-950 text-slate-450 hover:text-white text-xs h-9 px-4 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-5 rounded-xl border-0 flex items-center gap-1.5"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-450 border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingTask ? "Save Changes" : "Create Task"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
