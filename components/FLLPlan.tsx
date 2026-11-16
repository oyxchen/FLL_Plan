"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { defaultState, judgeQuestions, type CodeItem, type Contact, type EventItem, type Resource, type SiteState, type Task } from "@/lib/types";

type Tab = "resources" | "presentation" | "robot" | "innovation" | "core";
const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "resources", label: "Resources", icon: "▤" },
  { id: "presentation", label: "Presentation", icon: "▱" },
  { id: "robot", label: "Robot Game", icon: "◈" },
  { id: "innovation", label: "Innovation Project", icon: "✳" },
  { id: "core", label: "Core Values", icon: "♡" },
];
const presentationLinks = [
  { title: "Innovation project presentation", url: "https://docs.google.com/presentation/d/1q9BCc8UirwSRVjzf0yAbOWxcT-ter69Vawi6d0bxJ1U/edit", icon: "▱" },
  { title: "Robot design presentation", url: "https://docs.google.com/presentation/d/1WkPcp_XjT6LEO8El30pWQAxwk4kJKVMxFiApRph-LsE/edit", icon: "▱" },
];
const rulebookUrl = "https://firstinspires.blob.core.windows.net/fll/challenge/2026-27/fll-challenge-bioglow-rgr.pdf";
const bioglowLogo = "https://www.firstinspires.org/hs-fs/hubfs/web/brand/season/2027/first_bioglow_logo_fll_lockup_background-card-1280x850v2.webp?height=418&name=first_bioglow_logo_fll_lockup_background-card-1280x850v2.webp&width=630";
const missionNames = ["Drone Survey", "Exploding Seeds", "Flip the Rock", "Lucky Leaves", "Reaching Roots", "Leafcutter Frenzy", "Humongous Fungus", "Tangled", "Research Platform", "Fragile Microhabitats", "Window to the Past", "Forest Elder", "Keystone Species", "Seeds of Renewal", "Biocentric Architecture"];

function mergeState(value: unknown): SiteState {
  if (!value || typeof value !== "object") return structuredClone(defaultState);
  return { ...structuredClone(defaultState), ...(value as Partial<SiteState>), tasks: { ...defaultState.tasks, ...((value as Partial<SiteState>).tasks || {}) } };
}

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function googleId(url: string) { return url.match(/\/d\/([\w-]+)/)?.[1] || new URL(url).searchParams.get("id") || ""; }
function googleEmbed(resource: Resource) {
  try {
    const id = googleId(resource.driveUrl || "");
    if (!id) return resource.driveUrl || "";
    if (resource.kind === "folder") return `https://drive.google.com/embeddedfolderview?id=${id}#list`;
    const url = new URL(resource.driveUrl || "");
    if (url.hostname === "docs.google.com") return `${url.origin}${url.pathname.replace(/\/(edit|view)(\/.*)?$/, "/edit")}?rm=minimal`;
    return `https://drive.google.com/file/d/${id}/preview`;
  } catch { return resource.driveUrl || ""; }
}
function resourceIcon(resource: Resource) {
  if (resource.kind === "folder") return "📁";
  if (resource.kind === "slide") return "▱";
  if (resource.mime.includes("pdf")) return "PDF";
  if (resource.mime.startsWith("image/")) return "▧";
  if (resource.mime.includes("sheet") || resource.mime.includes("spreadsheet")) return "▦";
  return "▤";
}

function LogoMark() {
  return <div className="plan-logo" aria-label="FLL Plan"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 8h25v7H13v7h14v7H13v12H5z" fill="#2d7657"/><path d="M23 8h8c8 0 13 4 13 11 0 5-3 9-8 10l9 12H35l-8-11h-4v-7h8c4 0 6-1 6-4s-2-4-6-4h-8z" fill="#8fba78"/><path d="M17 15v26h6V15z" fill="#d9edcf"/></svg><span><b>FLL</b><small>PLAN</small></span></div>;
}

function ProgressChecklist({ title, tasks, onAdd, onPatch, onRemove }: {
  title: string; tasks: Task[]; onAdd: (text: string) => void; onPatch: (id: string, patch: Partial<Task>) => void; onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const done = tasks.filter(task => task.done).length;
  const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  function submit(e: FormEvent) { e.preventDefault(); if (draft.trim()) { onAdd(draft.trim()); setDraft(""); } }
  return <section className="panel checklist-panel">
    <div className="section-head"><div><p className="eyebrow">TEAM CHECKLIST</p><h2>{title}</h2></div><span className="progress-number">{percent}<small>%</small></span></div>
    <div className="progress-track" role="progressbar" aria-label={`${title} completion`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }}/></div>
    <div className="progress-caption"><span>{done} of {tasks.length} complete</span><span>{percent === 100 && tasks.length ? "All done! ✨" : "Every step counts"}</span></div>
    <div className="task-list">{tasks.map((task, i) => <div className={`task-row ${task.done ? "is-done" : ""}`} key={task.id}>
      <button className="check-button" aria-label={task.done ? "Mark incomplete" : "Mark complete"} onClick={() => onPatch(task.id, { done: !task.done })}>{task.done ? "✓" : ""}</button>
      <span className="task-index">{String(i + 1).padStart(2, "0")}</span>
      <input aria-label="Checklist task" spellCheck={false} value={task.text} placeholder="Write a task…" onChange={e => onPatch(task.id, { text: e.target.value })}/>
      <button className="icon-button quiet remove-task" title="Delete task" onClick={() => onRemove(task.id)}>×</button>
    </div>)}
      <form className="add-task-row" onSubmit={submit}><span className="add-task-plus">＋</span><input spellCheck={false} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add a checklist task…"/><button className="text-button" type="submit">Add task</button></form>
    </div>
  </section>;
}

function Dialog({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}><header className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close">×</button></header>{children}</section></div>;
}

export default function FLLPlan() {
  const [activeTab, setActiveTab] = useState<Tab>("resources");
  const [state, setState] = useState<SiteState>(structuredClone(defaultState));
  const [unlocked, setUnlocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [cloud, setCloud] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [storageError, setStorageError] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resourceDialog, setResourceDialog] = useState(false);
  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  const [newKind, setNewKind] = useState<Resource["kind"]>("file");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resourceError, setResourceError] = useState("");
  const [eventDialog, setEventDialog] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventError, setEventError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeRun, setCodeRun] = useState("");
  const [codeMissions, setCodeMissions] = useState("");
  const [tipDraft, setTipDraft] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactDescription, setContactDescription] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [reminder, setReminder] = useState("");
  const [today] = useState(() => new Date());
  const dirty = useRef(false);
  const stateRef = useRef(state);
  const remindedEvents = useRef(new Set<string>());
  const fileInput = useRef<HTMLInputElement>(null);
  stateRef.current = state;

  useEffect(() => {
    if ("Notification" in window) setNotificationPermission(Notification.permission);
    fetch("/api/state", { cache: "no-store" }).then(async response => {
      if (response.status === 401) return;
      if (response.status === 503) { setStorageError("Shared storage is not connected. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then run the Supabase SQL in README.md."); return; }
      if (!response.ok) throw new Error("Could not connect to the shared team database.");
      const payload = await response.json();
      if (!payload.configured) { setStorageError("Shared storage is not connected. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then run the Supabase SQL in README.md."); return; }
      setCloud(true);
      if (payload.state) setState(mergeState(payload.state));
      setUnlocked(true);
    }).catch(() => setStorageError("Could not connect to the shared team database. Check the Vercel and Supabase settings.")).finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!unlocked || !hydrated) return;
    if (!cloud) return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state }) });
        if (!response.ok) throw new Error("Cloud save failed; local backup is still saved.");
        dirty.current = false;
        setSyncMessage("");
      } catch (error) { setSyncMessage(error instanceof Error ? error.message : "Could not save changes to the team database."); }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [state, unlocked, hydrated, cloud]);

  useEffect(() => {
    if (!cloud || !unlocked) return;
    const timer = window.setInterval(async () => {
      if (dirty.current) return;
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (payload.state && JSON.stringify(payload.state) !== JSON.stringify(stateRef.current)) setState(mergeState(payload.state));
      } catch { /* Keep the current view available while offline. */ }
    }, 8000);
    return () => window.clearInterval(timer);
  }, [cloud, unlocked]);

  const mutate = useCallback((change: (current: SiteState) => SiteState) => {
    dirty.current = true;
    setState(current => change(current));
  }, []);

  const tabProgress = useMemo(() => {
    const lists = Object.values(state.tasks);
    const all = lists.flat();
    return all.length ? Math.round(all.filter(task => task.done).length / all.length * 100) : 0;
  }, [state.tasks]);

  useEffect(() => {
    if (!unlocked) return;
    const check = () => {
      const date = new Date().toLocaleDateString("en-CA");
      const todays = stateRef.current.events.filter(item => item.date === date);
      if (!todays.length) return;
      setReminder(`${todays.length} team ${todays.length === 1 ? "event" : "events"} today: ${todays.map(item => item.title).join(", ")}`);
      if ("Notification" in window && Notification.permission === "granted") {
        todays.filter(item => !remindedEvents.current.has(`${date}:${item.id}`)).forEach(item => {
          new Notification(item.title, { body: item.description || "A team event is happening today.", icon: "/icon.svg" });
          remindedEvents.current.add(`${date}:${item.id}`);
        });
      }
    };
    check();
    const timer = window.setInterval(check, 60_000);
    return () => window.clearInterval(timer);
  }, [unlocked]);

  async function login(e: FormEvent) {
    e.preventDefault(); setBusy(true); setLoginError("");
    try {
      const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: passcode }) });
      if (!response.ok) throw new Error("That passcode didn’t match. Try again.");
      const cloudResponse = await fetch("/api/state", { cache: "no-store" });
      if (cloudResponse.status === 503) throw new Error("Shared storage is not connected. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then run the Supabase SQL in README.md.");
      if (!cloudResponse.ok) throw new Error("Could not connect to the shared team database.");
      const payload = await cloudResponse.json();
      if (!payload.configured) throw new Error("Shared storage is not connected. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then run the Supabase SQL in README.md.");
      setCloud(true); setStorageError("");
      if (payload.state) setState(mergeState(payload.state));
      setUnlocked(true); setPasscode("");
    } catch (error) { setLoginError(error instanceof Error ? error.message : "Couldn’t sign in."); }
    finally { setBusy(false); }
  }

  async function logout() { await fetch("/api/logout", { method: "POST" }).catch(() => {}); setUnlocked(false); setCloud(false); }

  function tasksFor(key: string) { return state.tasks[key] || []; }
  function addTask(key: string, text: string) { mutate(current => ({ ...current, tasks: { ...current.tasks, [key]: [...(current.tasks[key] || []), { id: uid(), text, done: false }] } })); }
  function patchTask(key: string, id: string, patch: Partial<Task>) { mutate(current => ({ ...current, tasks: { ...current.tasks, [key]: (current.tasks[key] || []).map(task => task.id === id ? { ...task, ...patch } : task) } })); }
  function removeTask(key: string, id: string) { mutate(current => ({ ...current, tasks: { ...current.tasks, [key]: (current.tasks[key] || []).filter(task => task.id !== id) } })); }

  function clearResourceForm() { setNewTitle(""); setNewDescription(""); setDriveUrl(""); setSelectedFile(null); setResourceError(""); if (fileInput.current) fileInput.current.value = ""; }
  async function saveResource(e: FormEvent) {
    e.preventDefault(); setResourceError("");
    if (!newTitle.trim()) { setResourceError("Add a title for this resource."); return; }
    try {
      if (!cloud) throw new Error("Shared server storage is not connected. Resource changes were not saved.");
      let resource: Resource;
      if (selectedFile) {
        if (selectedFile.size > 25 * 1024 * 1024) throw new Error("Files must be 25 MB or smaller.");
        const form = new FormData(); form.append("file", selectedFile);
        const upload = await fetch("/api/upload", { method: "POST", body: form });
        const result = await upload.json();
        if (!upload.ok) throw new Error(result.error || "Could not upload that file.");
        resource = { id: uid(), title: newTitle.trim(), description: newDescription.trim(), kind: newKind, name: result.name, mime: result.mime, size: result.size, filePath: result.path };
      } else {
        if (!driveUrl.trim()) throw new Error("Choose a file to upload or paste a Google Drive link.");
        const parsed = new URL(driveUrl.trim());
        if (!/^(docs|drive)\.google\.com$/.test(parsed.hostname)) throw new Error("Paste a Google Drive, Docs, Slides, or Sheets link.");
        const mime = parsed.pathname.includes("presentation") ? "application/vnd.google-apps.presentation" : parsed.pathname.includes("spreadsheets") ? "application/vnd.google-apps.spreadsheet" : parsed.pathname.includes("document") ? "application/vnd.google-apps.document" : "application/vnd.google-apps.folder";
        resource = { id: uid(), title: newTitle.trim(), description: newDescription.trim(), kind: newKind === "file" ? (mime.includes("presentation") ? "slide" : mime.includes("folder") ? "folder" : "document") : newKind, name: newTitle.trim(), mime, driveUrl: parsed.toString() };
      }
      mutate(current => ({ ...current, resources: [...current.resources, resource] }));
      setResourceDialog(false); clearResourceForm();
    } catch (error) { setResourceError(error instanceof Error ? error.message : "Could not add that resource."); }
  }

  async function deleteResource(resource: Resource) {
    if (resource.filePath) await fetch("/api/delete-file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: resource.filePath }) }).catch(() => {});
    mutate(current => ({ ...current, resources: current.resources.filter(item => item.id !== resource.id) })); setActiveResource(null);
  }

  async function addCode(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; setCodeError("");
    if (!cloud) { setCodeError("Shared server storage is not connected. Code was not saved."); e.target.value = ""; return; }
    const run = Number(codeRun);
    const missionNumbers = codeMissions.split(/[\s,]+/).filter(Boolean).map(Number);
    if (!file.name.toLowerCase().endsWith(".py")) { setCodeError("Only .py Python files can be added."); e.target.value = ""; return; }
    if (!Number.isInteger(run) || run < 1 || run > 8) { setCodeError("Choose a run number from 1 to 8."); e.target.value = ""; return; }
    if (!missionNumbers.length || missionNumbers.some(n => !Number.isInteger(n) || n < 1 || n > 15)) { setCodeError("Enter one or more mission numbers from 1 to 15, separated by commas."); e.target.value = ""; return; }
    if (file.size > 25 * 1024 * 1024) { setCodeError("Code files must be 25 MB or smaller."); e.target.value = ""; return; }
    const uniqueMissions = [...new Set(missionNumbers)].sort((a, b) => a - b);
    const missionLabel = uniqueMissions.join(", ");
    const title = `run ${run}, mission${uniqueMissions.length > 1 ? "s" : ""} ${missionLabel}`;
    const name = `${title}.py`;
    try {
      const renamedFile = new File([file], name, { type: file.type || "text/x-python" });
      const form = new FormData(); form.append("file", renamedFile);
      const response = await fetch("/api/upload", { method: "POST", body: form }); const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      const item: CodeItem = { id: uid(), title, name, mime: file.type || "text/x-python", size: file.size, filePath: result.path };
      mutate(current => ({ ...current, code: [...current.code, item] }));
      setCodeRun(""); setCodeMissions("");
    } catch (error) { setCodeError(error instanceof Error ? error.message : "Could not add that code file."); }
    e.target.value = "";
  }

  async function removeCode(item: CodeItem) {
    if (item.filePath) await fetch("/api/delete-file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: item.filePath }) }).catch(() => {});
    mutate(current => ({ ...current, code: current.code.filter(code => code.id !== item.id) }));
  }

  function addEvent(e: FormEvent) {
    e.preventDefault(); setEventError("");
    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate) { setEventError("Add a title, description, and date for every event."); return; }
    const item: EventItem = { id: uid(), title: eventTitle.trim(), description: eventDescription.trim(), date: eventDate };
    mutate(current => ({ ...current, events: [...current.events, item] }));
    setEventDialog(false); setEventTitle(""); setEventDescription(""); setEventDate("");
  }

  function addContact(e: FormEvent) {
    e.preventDefault(); if (!contactEmail.trim()) return;
    const item: Contact = { id: uid(), email: contactEmail.trim(), description: contactDescription.trim() };
    mutate(current => ({ ...current, contacts: [...current.contacts, item] })); setContactEmail(""); setContactDescription("");
  }

  async function openPicker() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY, clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, appId = process.env.NEXT_PUBLIC_GOOGLE_APP_ID;
    if (!apiKey || !clientId || !appId) { setResourceError("Google Picker isn’t configured yet. Paste a Drive link below or configure the Google credentials in the setup guide."); return; }
    try {
      const loadScript = (src: string) => new Promise<void>((resolve, reject) => { if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; } const script = document.createElement("script"); script.src = src; script.onload = () => resolve(); script.onerror = () => reject(new Error("Could not load Google Drive Picker.")); document.head.appendChild(script); });
      await loadScript("https://accounts.google.com/gsi/client"); await loadScript("https://apis.google.com/js/api.js");
      const w = window as any;
      w.gapi.load("picker", { callback: () => {
        const client = w.google.accounts.oauth2.initTokenClient({ client_id: clientId, scope: "https://www.googleapis.com/auth/drive.readonly", callback: (token: any) => {
          const picker = new w.google.picker.PickerBuilder().addView(w.google.picker.ViewId.DOCS).addView(w.google.picker.ViewId.FOLDERS).setOAuthToken(token.access_token).setDeveloperKey(apiKey).setAppId(appId).setCallback((data: any) => {
            if (data.action !== w.google.picker.Action.PICKED) return;
            const doc = data.docs?.[0]; if (!doc) return;
            const mime = doc.mimeType || ""; const kind: Resource["kind"] = mime.includes("folder") ? "folder" : mime.includes("presentation") ? "slide" : "document";
            const url = doc.url || (kind === "slide" ? `https://docs.google.com/presentation/d/${doc.id}/edit` : kind === "folder" ? `https://drive.google.com/drive/folders/${doc.id}` : `https://docs.google.com/document/d/${doc.id}/edit`);
            setNewKind(kind); setNewTitle(doc.name || ""); setDriveUrl(url); setSelectedFile(null); setResourceError("");
          }).build(); picker.setVisible(true);
        } }); client.requestAccessToken();
      }});
    } catch (error) { setResourceError(error instanceof Error ? error.message : "Could not open Google Picker."); }
  }

  async function requestNotifications() {
    if (!("Notification" in window)) { setNotificationPermission("unsupported"); return; }
    const permission = await Notification.requestPermission(); setNotificationPermission(permission);
  }

  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const calendarDays = Array.from({ length: 28 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; });
  const scores = Array.from({ length: 3 }, (_, run) => 20 + state.missionScores.reduce((sum, row) => sum + (Number(row?.[run]) || 0), 0));
  const playedScores = scores.filter((_, run) => Boolean(state.times[run]) || state.missionScores.some(row => Number(row?.[run]) > 0));
  const average = playedScores.length ? (playedScores.reduce((sum, score) => sum + score, 0) / playedScores.length).toFixed(1) : "—";

  if (!hydrated) return <div className="screen-loader"><div className="loading-mark">F</div><span>Warming up the team hub…</span></div>;

  if (!unlocked) return <main className="login-screen"><div className="login-orbit orbit-one"/><div className="login-orbit orbit-two"/><section className="login-card"><img className="login-bio" src={bioglowLogo} alt="FIRST LEGO League BIOGLOW"/><LogoMark/><p className="eyebrow">TEAM 75798 · SHARKBYTES</p><h1>A little progress<br/><em>adds up.</em></h1><p className="login-copy">Your team workspace is ready when you are.</p><form onSubmit={login}><label htmlFor="team-passcode">Team passcode</label><input id="team-passcode" type="password" inputMode="numeric" value={passcode} onChange={e => setPasscode(e.target.value)} placeholder="Enter your passcode" autoComplete="current-password" required/><button className="primary-button full-button" disabled={busy}>{busy ? "Opening your workspace…" : "Enter FLL Plan ↗"}</button></form>{(loginError || storageError) && <p className="form-error">{loginError || storageError}</p>}<p className="login-foot">One shared space for big ideas and small wins.</p></section></main>;

  return <div className="app-shell">
    <header className="topbar">
      <div className="topbar-brand"><img className="bioglow-logo" src={bioglowLogo} alt="FIRST LEGO League BIOGLOW"/><div className="brand-divider"/><div><span className="brand-kicker">TEAM 75798</span><span className="brand-team">SharkBytes</span></div></div>
      <div className="topbar-actions"><button className="notification-button" onClick={requestNotifications} title="Enable event day notifications">{notificationPermission === "granted" ? "♧ Notifications on" : "♧ Enable reminders"}</button></div>
    </header>
    <div className="workspace-layout">
      <aside className="left-rail"><div className="rail-label">YOUR WORKSPACE</div><nav className="side-nav" aria-label="Team sections">{tabs.map(tab => <button key={tab.id} className={`nav-item ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}><span className="nav-icon">{tab.icon}</span><span>{tab.label}</span>{tab.id === "innovation" && state.events.some(event => event.date === new Date().toLocaleDateString("en-CA")) && <i className="nav-dot"/>}</button>)}</nav><div className="rail-spacer"/><div className="rail-progress"><div className="rail-progress-top"><span>TEAM MOMENTUM</span><b>{tabProgress}%</b></div><div className="progress-track small"><span style={{ width: `${tabProgress}%` }}/></div><p>Keep the good work growing.</p></div><div className="season-tag"><span>✳</span><div><b>BIOGLOW</b><small>2026 · 2027 season</small></div></div></aside>
      <main className="main-panel"><div className="mobile-tabs">{tabs.map(tab => <button className={activeTab === tab.id ? "active" : ""} key={tab.id} onClick={() => setActiveTab(tab.id)}><span>{tab.icon}</span>{tab.label}</button>)}</div>
        <div className="content-wrap">
          <div className="page-heading"><div><div className="breadcrumb"><span>TEAM WORKSPACE</span><b>·</b><strong>{tabs.find(tab => tab.id === activeTab)?.label}</strong></div><h1>{activeTab === "resources" ? "Everything in one place." : activeTab === "presentation" ? "Tell the story." : activeTab === "robot" ? "Make every run count." : activeTab === "innovation" ? "Ideas into impact." : "Better, together."}</h1><p>{activeTab === "resources" ? "The notes, files, and inspiration behind your next big idea." : activeTab === "presentation" ? "Shape your story, one checklist item at a time." : activeTab === "robot" ? "Track your runs, tune your code, celebrate each point." : activeTab === "innovation" ? "Give your next great idea a little room to grow." : "The best teams make space for every voice."}</p></div><div className="heading-sparkle" aria-hidden="true">✳</div></div>
          {reminder && <div className="reminder-banner"><span>☀</span><div><b>Today on the team calendar</b><small>{reminder}</small></div><button className="icon-button" onClick={() => setReminder("")}>×</button></div>}
          {syncMessage && <div className="storage-warning" role="status">{syncMessage}</div>}

          {activeTab === "resources" && <section className="tab-content">
            <div className="section-heading-row"><div><p className="eyebrow">TEAM LIBRARY</p><h2>Resource shelf <span className="count-chip">{state.resources.length}</span></h2></div></div>
            <div className="resource-grid">{state.resources.map(resource => <button className="resource-card" key={resource.id} onClick={() => setActiveResource(resource)}><div className="resource-card-top"><div className={`file-icon ${resource.kind}`}>{resource.mime.startsWith("image/") && resource.dataUrl ? <img src={resource.dataUrl} alt=""/> : resourceIcon(resource)}</div><span className="resource-more">···</span></div><h3>{resource.title}</h3>{resource.description ? <p>{resource.description}</p> : <div className="resource-mini-preview">{resource.driveUrl ? <iframe title={`${resource.title} preview`} src={googleEmbed(resource)} /> : resource.mime.startsWith("image/") && resource.dataUrl ? <img src={resource.dataUrl} alt=""/> : resource.mime === "application/pdf" && (resource.dataUrl || resource.filePath) ? <iframe title={`${resource.title} preview`} src={resource.dataUrl || `/api/file?path=${encodeURIComponent(resource.filePath || "")}`} /> : <div className="preview-placeholder"><span>{resourceIcon(resource)}</span><small>{resource.name}</small></div>}</div>}<div className="resource-card-foot"><span>{resource.kind === "folder" ? "FOLDER" : resource.kind === "slide" ? "SLIDES" : resource.mime.includes("pdf") ? "PDF FILE" : resource.driveUrl ? "GOOGLE DRIVE" : "FILE"}</span><span>Open resource ↗</span></div></button>)}<button className="add-resource-card" onClick={() => { clearResourceForm(); setResourceDialog(true); }}><span className="add-resource-circle">＋</span><b>Add to your shelf</b><small>Drive links, files, docs & slides</small></button></div>
          </section>}

          {activeTab === "presentation" && <section className="tab-content stack-lg"><ProgressChecklist title="Presentation checklist" tasks={tasksFor("presentation")} onAdd={text => addTask("presentation", text)} onPatch={(id, patch) => patchTask("presentation", id, patch)} onRemove={id => removeTask("presentation", id)}/><div className="section-heading-row presentation-heading"><div><p className="eyebrow">YOUR PRESENTATIONS</p><h2>Ready to share <span className="count-chip">2</span></h2></div><span className="subtle-label">EDIT IN THE EMBEDDED GOOGLE EDITOR</span></div><div className="presentation-grid">{presentationLinks.map((presentation, index) => <button className="presentation-card" key={presentation.url} onClick={() => setActiveResource({ id: `presentation-${index}`, title: presentation.title, description: "", kind: "slide", name: presentation.title, mime: "application/vnd.google-apps.presentation", driveUrl: presentation.url })}><div className={`presentation-art art-${index + 1}`}><span className="art-sun"/><span className="art-leaf leaf-a"/><span className="art-leaf leaf-b"/><b>{index === 0 ? "INNOVATION\nPROJECT" : "ROBOT\nDESIGN"}</b></div><div className="presentation-card-info"><span className="file-type-pill">GOOGLE SLIDES</span><h3>{presentation.title}</h3><span>Open presentation ↗</span></div></button>)}</div><div className="judge-heading"><div><p className="eyebrow">PRACTICE OUT LOUD</p><h2>Judge Questions</h2><p>Capture your answer ideas below each question.</p></div><span className="question-count">{judgeQuestions.length} prompts</span></div><div className="question-list">{judgeQuestions.map((question, i) => <article className="question-card" key={question}><span className="question-number">{String(i + 1).padStart(2, "0")}</span><div className="question-body"><h3>{question}</h3><textarea spellCheck={false} value={state.answers[question] || ""} onChange={e => mutate(current => ({ ...current, answers: { ...current.answers, [question]: e.target.value } }))} placeholder="Jot down your answer…" rows={2}/></div></article>)}</div></section>}

          {activeTab === "robot" && <section className="tab-content stack-lg"><section className="panel code-panel"><div className="section-head"><div><p className="eyebrow">READY TO RUN</p><h2>Robot code files</h2><p className="section-description">Keep your latest mission programs easy to find.</p></div><label className="primary-button upload-code-button">＋ Upload .py code<input type="file" accept=".py,text/x-python" onChange={addCode} hidden/></label></div><div className="code-template"><label>run <select aria-label="Run number" value={codeRun} onChange={e => setCodeRun(e.target.value)}><option value="">—</option>{Array.from({length: 8}, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label><label>mission{codeMissions.split(/[\s,]+/).filter(Boolean).length > 1 ? "s" : ""} <input aria-label="Mission numbers" value={codeMissions} onChange={e => setCodeMissions(e.target.value.replace(/[^0-9,\s]/g, "").replace(/,{2,}/g, ","))} placeholder="1–15, separated by commas" inputMode="numeric"/></label><small>The saved filename is created from these selections.</small></div>{codeError && <p className="form-error inline-error">{codeError}</p>}<div className="code-list">{state.code.map(item => <div className="code-row" key={item.id}><div className="code-file-icon">PY</div><div className="code-file-main"><b>{item.title}</b><small>{item.name} · {(item.size / 1024).toFixed(item.size > 1024 ? 0 : 1)} KB</small></div><a className="download-button" href={item.dataUrl || (item.filePath ? `/api/file?path=${encodeURIComponent(item.filePath)}` : "#")} download={item.name}>↓ Download</a><button className="icon-button delete-code" title="Delete code file" onClick={() => removeCode(item)}>×</button></div>)}{!state.code.length && <div className="empty-inline"><span>⌘</span><b>No programs yet</b><small>Upload your first mission file to get started.</small></div>}</div></section>
            <section className="panel score-panel"><div className="section-head score-head"><div><p className="eyebrow">PRACTICE SCORES</p><h2>Robot game score tracker</h2><p className="section-description">Record points earned for each mission in up to three runs.</p></div><span className="run-count-chip">3 PRACTICE RUNS</span></div><div className="score-table-wrap"><table className="score-table"><thead><tr><th>MISSION</th><th>MISSION NAME</th><th>RUN 1</th><th>RUN 2</th><th>RUN 3</th></tr></thead><tbody>{missionNames.map((mission, index) => <tr key={index}><td className="mission-num">{String(index + 1).padStart(2, "0")}</td><td>{mission}</td>{[0, 1, 2].map(run => <td key={run}><input className="score-input" aria-label={`${mission}, run ${run + 1} points`} type="number" min="0" value={state.missionScores[index]?.[run] ?? 0} onChange={e => { const value = Math.max(0, Number(e.target.value) || 0); mutate(current => ({ ...current, missionScores: current.missionScores.map((row, rowIndex) => rowIndex === index ? row.map((cell, col) => col === run ? value : cell) : row) })); }}/></td>)}</tr>)}<tr className="score-bonus-row"><td className="mission-num">＋</td><td>Equipment inspection bonus</td>{[0, 1, 2].map(run => <td key={run}><b>20</b></td>)}</tr><tr className="score-total-row"><td/><td>RUN SCORE <small>mission points + inspection bonus</small></td>{scores.map((score, run) => <td key={run}><b>{score}</b></td>)}</tr><tr className="time-row"><td/><td>TIME <small>seconds · not part of score total</small></td>{[0, 1, 2].map(run => <td key={run}><input type="number" min="0" placeholder="—" aria-label={`Run ${run + 1} time in seconds`} value={state.times[run] || ""} onChange={e => mutate(current => ({ ...current, times: current.times.map((value, i) => i === run ? e.target.value : value) }))}/></td>)}</tr></tbody></table></div><div className="score-footnote"><span>◎</span><p>Each run includes 20 equipment inspection points plus the mission points above. Time stays separate and does not affect the score.</p></div><div className="average-summary"><div><b>Average score</b><small>Across runs with entered points or a recorded time</small></div><strong>{average}<span> pts</span></strong></div></section>
            <section className="panel rulebook-panel"><div className="section-head rulebook-head"><div><p className="eyebrow">OFFICIAL SEASON GUIDE</p><h2>BIOGLOW Robot Game Rulebook</h2><p className="section-description">Reference copy · view only</p></div><a className="secondary-button" href={rulebookUrl} target="_blank" rel="noreferrer">Open PDF ↗</a></div><div className="rulebook-viewer"><iframe src={rulebookUrl} title="BIOGLOW Robot Game Rulebook — view only" loading="lazy"/></div><div className="view-only-note"><span>◉</span> Read-only reference. Open the PDF in a new tab to use your browser’s PDF controls.</div></section></section>}

          {activeTab === "innovation" && <section className="tab-content stack-lg"><section className="panel calendar-panel"><div className="section-head"><div><p className="eyebrow">PLAN THE NEXT STEPS</p><h2>Team calendar <span className="count-chip">4 WEEKS</span></h2><p className="section-description">A little planning makes room for a lot of progress.</p></div><button className="primary-button" onClick={() => { setEventDate(new Date().toLocaleDateString("en-CA")); setEventDialog(true); }}>＋ Add event</button></div><div className="calendar-grid">{calendarDays.map((date, index) => { const iso = date.toLocaleDateString("en-CA"); const entries = state.events.filter(event => event.date === iso); return <button className={`calendar-day ${index === 0 ? "today" : ""} ${entries.length ? "has-events" : ""}`} key={iso} onClick={() => { setEventDate(iso); setEventDialog(true); }}><span className="calendar-weekday">{date.toLocaleDateString("en-US", { weekday: "short" })}</span><b>{date.getDate()}</b>{entries.slice(0, 2).map(event => <span className="calendar-event-dot" key={event.id} title={event.title}>{event.title}</span>)}</button>; })}</div>{state.events.length > 0 && <div className="event-list"><div className="event-list-heading"><b>UPCOMING EVENTS</b><small>Reminders appear on the event day</small></div>{[...state.events].sort((a, b) => a.date.localeCompare(b.date)).map(event => <div className="event-row" key={event.id}><div className="event-date-badge"><b>{new Date(`${event.date}T12:00:00`).getDate()}</b><small>{new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", { month: "short" })}</small></div><div className="event-copy"><b>{event.title}</b><p>{event.description}</p></div><button className="icon-button" title="Delete event" onClick={() => mutate(current => ({ ...current, events: current.events.filter(item => item.id !== event.id) }))}>×</button></div>)}</div>}<div className="calendar-reminder-note"><span>☀</span><div><b>Gentle nudges, right on time</b><small>Enable browser reminders in the top bar. Keep FLL Plan open on the event day to receive the notification.</small></div>{notificationPermission === "denied" && <span className="permission-denied">Browser notifications are blocked in settings.</span>}</div></section><ProgressChecklist title="Innovation project checklist" tasks={tasksFor("innovation")} onAdd={text => addTask("innovation", text)} onPatch={(id, patch) => patchTask("innovation", id, patch)} onRemove={id => removeTask("innovation", id)}/><section className="panel contacts-panel"><div className="section-head"><div><p className="eyebrow">PEOPLE WHO CAN HELP</p><h2>Contact information</h2><p className="section-description">Keep your project contacts close at hand.</p></div><span className="contacts-icon">✉</span></div><form className="contact-form" onSubmit={addContact}><label>Email<input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="name@example.com" spellCheck={false} required/></label><label>Description<input value={contactDescription} onChange={e => setContactDescription(e.target.value)} placeholder="What can this person help with?" spellCheck={false}/></label><button className="primary-button">Add contact</button></form>{state.contacts.map(contact => <div className="contact-row" key={contact.id}><span className="contact-avatar">{contact.email.charAt(0).toUpperCase()}</span><div><a href={`mailto:${contact.email}`}>{contact.email}</a><small>{contact.description || "Team contact"}</small></div><button className="icon-button" onClick={() => mutate(current => ({ ...current, contacts: current.contacts.filter(item => item.id !== contact.id) }))}>×</button></div>)}</section></section>}

          {activeTab === "core" && <section className="tab-content stack-lg"><ProgressChecklist title="Core values checklist" tasks={tasksFor("core")} onAdd={text => addTask("core", text)} onPatch={(id, patch) => patchTask("core", id, patch)} onRemove={id => removeTask("core", id)}/><section className="panel tips-panel"><div className="section-head"><div><p className="eyebrow">A LITTLE TEAM WISDOM</p><h2>TIPS</h2><p className="section-description">Save the reminders that help your team shine.</p></div><span className="tips-spark">✦</span></div><form className="tip-form" onSubmit={e => { e.preventDefault(); if (!tipDraft.trim()) return; mutate(current => ({ ...current, tips: [...current.tips, tipDraft.trim()] })); setTipDraft(""); }}><span>•</span><input spellCheck={false} value={tipDraft} onChange={e => setTipDraft(e.target.value)} placeholder="Add a team tip…"/><button className="primary-button">Add tip</button></form><ul className="tips-list">{state.tips.map((tip, index) => <li key={`${index}-${tip}`}><span>✦</span><input spellCheck={false} value={tip} onChange={e => mutate(current => ({ ...current, tips: current.tips.map((item, i) => i === index ? e.target.value : item) }))}/><button className="icon-button" onClick={() => mutate(current => ({ ...current, tips: current.tips.filter((_, i) => i !== index) }))}>×</button></li>)}</ul>{!state.tips.length && <div className="tip-empty"><span>✦</span><p>Your team’s best advice will live here.</p></div>}</section><section className="values-strip"><div><span className="value-bubble bubble-green">✳</span><b>Discovery</b><small>We explore new skills and ideas.</small></div><div><span className="value-bubble bubble-gold">♡</span><b>Teamwork</b><small>We are stronger when we work together.</small></div><div><span className="value-bubble bubble-pink">✦</span><b>Impact</b><small>We use what we learn to help others.</small></div><div><span className="value-bubble bubble-blue">☺</span><b>Fun</b><small>We enjoy and celebrate our work.</small></div><div><span className="value-bubble bubble-green">✧</span><b>Innovation</b><small>We try new ideas and learn by doing.</small></div><div><span className="value-bubble bubble-blue">◉</span><b>Inclusion</b><small>We make sure everyone belongs and can contribute.</small></div></section></section>}

          <footer className="page-footer"><span>Made for the way your team grows.</span><span>FLL PLAN <b>·</b> BIOGLOW 2026–27</span></footer>
        </div>
      </main>

      {resourceDialog && <Dialog title="Add a resource" onClose={() => setResourceDialog(false)}><form className="modal-form" onSubmit={saveResource}><p className="modal-intro">Choose a file or add a link to a resource already in Drive.</p><div className="resource-kind-picker">{(["file", "document", "slide", "folder"] as Resource["kind"][]).map(kind => <button type="button" className={newKind === kind ? "selected" : ""} key={kind} onClick={() => setNewKind(kind)}><span>{kind === "folder" ? "📁" : kind === "slide" ? "▱" : kind === "document" ? "▤" : "↥"}</span>{kind === "file" ? "Upload" : kind === "document" ? "Document" : kind === "slide" ? "Slides" : "Folder"}</button>)}</div><div className="form-field"><label htmlFor="resource-title">Title <span>*</span></label><input id="resource-title" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Give this resource a name" required/></div><div className="form-field"><label htmlFor="resource-description">Description <small>OPTIONAL</small></label><textarea id="resource-description" value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="What should the team know about it?" rows={2}/></div>{newKind === "file" ? <div className="file-drop"><input ref={fileInput} type="file" onChange={e => setSelectedFile(e.target.files?.[0] || null)}/><span>↥</span><b>{selectedFile ? selectedFile.name : "Choose a file to upload"}</b><small>{selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : "PDF, images, documents, slides and more"}</small></div> : <><button type="button" className="drive-picker-button" onClick={openPicker}>▣ Choose from Google Drive</button><div className="form-field"><label htmlFor="drive-link">Or paste a Drive link</label><input id="drive-link" type="url" value={driveUrl} onChange={e => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/…"/></div></>}{resourceError && <p className="form-error">{resourceError}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setResourceDialog(false)}>Cancel</button><button className="primary-button">Add to resources</button></div></form></Dialog>}

      {activeResource && <Dialog title="Resource details" onClose={() => setActiveResource(null)} wide><div className="resource-view"><div className="resource-edit-fields"><label>Title<input value={activeResource.title} onChange={e => setActiveResource({ ...activeResource, title: e.target.value })}/></label><label>Description<textarea value={activeResource.description} onChange={e => setActiveResource({ ...activeResource, description: e.target.value })} rows={2} placeholder="Add a description…"/></label><div className="resource-view-actions"><button className="primary-button" onClick={() => { mutate(current => ({ ...current, resources: current.resources.map(item => item.id === activeResource.id ? activeResource : item) })); setActiveResource(null); }}>Save details</button>{activeResource.driveUrl && <a className="secondary-button" href={activeResource.driveUrl} target="_blank" rel="noreferrer">Open in Google ↗</a>}{(activeResource.filePath || activeResource.dataUrl) && <a className="secondary-button" href={activeResource.filePath ? `/api/file?path=${encodeURIComponent(activeResource.filePath)}` : activeResource.dataUrl} download={activeResource.name}>Download file ↓</a>}<button className="danger-button" onClick={() => deleteResource(activeResource)}>Delete resource</button></div></div><div className="resource-viewer">{activeResource.driveUrl ? <iframe title={activeResource.title} src={googleEmbed(activeResource)} allow="clipboard-read; clipboard-write"/> : activeResource.textContent !== undefined ? <textarea className="text-resource-editor" spellCheck={false} value={activeResource.textContent} onChange={e => setActiveResource({ ...activeResource, textContent: e.target.value })}/> : activeResource.mime.startsWith("image/") ? <img src={activeResource.dataUrl || (activeResource.filePath ? `/api/file?path=${encodeURIComponent(activeResource.filePath)}` : "")} alt={activeResource.title}/> : activeResource.mime === "application/pdf" ? <iframe title={activeResource.title} src={activeResource.dataUrl || (activeResource.filePath ? `/api/file?path=${encodeURIComponent(activeResource.filePath)}` : "")}/> : <div className="resource-file-placeholder"><span>{resourceIcon(activeResource)}</span><b>{activeResource.name}</b><p>This file is available to view or download. Google documents open in the embedded editor when sharing settings permit it.</p></div>}</div></div></Dialog>}

      {eventDialog && <Dialog title="Add a team event" onClose={() => setEventDialog(false)}><form className="modal-form" onSubmit={addEvent}><p className="modal-intro">Every event gets a gentle reminder on the day.</p><div className="form-field"><label htmlFor="event-title">Event title <span>*</span></label><input id="event-title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Team build session" required/></div><div className="form-field"><label htmlFor="event-date">Date <span>*</span></label><input id="event-date" type="date" min={new Date().toLocaleDateString("en-CA")} value={eventDate} onChange={e => setEventDate(e.target.value)} required/></div><div className="form-field"><label htmlFor="event-description">Description <span>*</span></label><textarea id="event-description" value={eventDescription} onChange={e => setEventDescription(e.target.value)} rows={3} placeholder="What are we working on?" required/></div>{eventError && <p className="form-error">{eventError}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setEventDialog(false)}>Cancel</button><button className="primary-button">Save event</button></div></form></Dialog>}

    </div>
  </div>;
}
