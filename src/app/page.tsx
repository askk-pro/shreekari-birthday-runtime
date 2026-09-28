"use client";

import { useEffect, useMemo, useState } from "react";

type Task = { id:string; group:string; task:string; owner:string; due:string; done:boolean };
type Day = { date:string; label:string; kind:string; items:string[] };
type Catering = { session:string; count:string; status:string };
type Room = { room:string; title:string; use:string };
type Staff = { role:string; owner:string; notes:string };
type Plan = {
  meta: { title:string; subtitle:string; venue:string; actualBirthday:string; mainFunction:string; expectedGuests:number; invitedGuests:number; updatedAt?:string|null };
  days: Day[]; catering:Catering[]; rooms:Room[]; staff:Staff[]; tasks:Task[];
  notes?: string;
};

const tabs = ["Dashboard","Timeline","Tasks","Catering","Rooms & Staff"] as const;
type Tab = typeof tabs[number];
const dateFmt = (v:string) => new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",weekday:"short"}).format(new Date(v+"T12:00:00"));
export default function Home() {
  const [plan,setPlan] = useState<Plan|null>(null);
  const [tab,setTab] = useState<Tab>("Dashboard");
  const [group,setGroup] = useState("All");
  const [saving,setSaving] = useState(false);

  useEffect(()=>{ fetch("/api/state").then(r=>r.json()).then(setPlan); },[]);

  const save = async (next:Plan) => {
    setPlan(next); setSaving(true);
    await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(next)});
    setSaving(false);
  };

  const progress = useMemo(()=>{
    if(!plan) return 0;
    return Math.round(plan.tasks.filter(t=>t.done).length / Math.max(plan.tasks.length,1) * 100);
  },[plan]);

  const groups = useMemo(()=> plan ? ["All",...Array.from(new Set(plan.tasks.map(t=>t.group)))] : ["All"],[plan]);
  const visibleTasks = plan?.tasks.filter(t=>group==="All" || t.group===group) ?? [];

  if(!plan) return <main className="loading">Loading Shreekari Birthday Command Center…</main>;
  const toggleTask = (id:string) => {
    const next = {...plan,tasks:plan.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)};
    void save(next);
  };

  return <main className="shell">
    <header className="topbar">
      <div>
        <div className="eyebrow">{plan.meta.venue} • EVENT PLAN</div>
        <h1>{plan.meta.title}</h1>
        <p>{plan.meta.subtitle} · {plan.meta.venue}</p>
      </div>
      <div className="saveState">{saving ? "Saving…" : "Saved"}</div>
    </header>

    <nav className="tabs">
      {tabs.map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}</button>)}
    </nav>

    {tab==="Dashboard" && <section className="stack">
      <div className="heroGrid">
        <article className="heroCard primary">
          <span>Overall readiness</span>
          <strong>{progress}%</strong>
          <div className="meter"><i style={{width:`${progress}%`}} /></div>
          <small>{plan.tasks.filter(t=>t.done).length} of {plan.tasks.length} tasks complete</small>
        </article>
        <article className="heroCard"><span>Invited</span><strong>{plan.meta.invitedGuests}</strong><small>Expected {plan.meta.expectedGuests}</small></article>
        <article className="heroCard"><span>Actual birthday</span><strong>{dateFmt(plan.meta.actualBirthday)}</strong><small>Primary family celebration</small></article>
        <article className="heroCard"><span>Main function</span><strong>{dateFmt(plan.meta.mainFunction)}</strong><small>{plan.meta.venue}</small></article>
      </div>

      <div className="panel">
        <div className="panelTitle"><div><span className="eyebrow">NEXT MILESTONES</span><h2>Event flow</h2></div></div>
        <div className="dayStrip">
          {plan.days.slice(-4).map(d=><article key={d.date} className={"dayCard "+d.kind}>
            <time>{dateFmt(d.date)}</time><h3>{d.label}</h3>
            <ul>{d.items.slice(0,3).map(x=><li key={x}>{x}</li>)}</ul>
          </article>)}
        </div>
      </div>

      <div className="twoCol">
        <div className="panel">
          <div className="panelTitle"><h2>Open priorities</h2><button onClick={()=>setTab("Tasks")}>View all</button></div>
          <div className="taskList compact">
            {plan.tasks.filter(t=>!t.done).slice(0,8).map(t=><label className="task" key={t.id}>
              <input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)} />
              <span><b>{t.task}</b><small>{t.group} · due {dateFmt(t.due)} · {t.owner}</small></span>
            </label>)}
          </div>
        </div>
        <div className="panel">
          <div className="panelTitle"><h2>Operating notes</h2></div>
          <textarea className="notes" placeholder="Quick notes for family/vendor coordination…" value={plan.notes||""}
            onChange={e=>setPlan({...plan,notes:e.target.value})}
            onBlur={()=>void save(plan)} />
          <p className="hint">Notes save when you leave the field.</p>
        </div>
      </div>
    </section>}

    {tab==="Timeline" && <section className="panel">
      <div className="panelTitle"><div><span className="eyebrow">23 OCT → 1 NOV</span><h2>Master timeline</h2></div></div>
      <div className="timeline">
        {plan.days.map(d=><article className="timelineRow" key={d.date}>
          <div className="dateBadge"><b>{new Date(d.date+"T12:00:00").getDate()}</b><span>{new Intl.DateTimeFormat("en",{month:"short"}).format(new Date(d.date+"T12:00:00"))}</span></div>
          <div className="timelineBody"><div className="rowHead"><h3>{d.label}</h3><span>{dateFmt(d.date)}</span></div>
            <ul>{d.items.map(x=><li key={x}>{x}</li>)}</ul>
          </div>
        </article>)}
      </div>
    </section>}

    {tab==="Tasks" && <section className="panel">
      <div className="panelTitle responsive"><div><span className="eyebrow">ACTION TRACKER</span><h2>{visibleTasks.length} tasks</h2></div>
        <select value={group} onChange={e=>setGroup(e.target.value)}>{groups.map(g=><option key={g}>{g}</option>)}</select>
      </div>
      <div className="taskList">
        {visibleTasks.map(t=><label className={"task "+(t.done?"done":"")} key={t.id}>
          <input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)} />
          <span><b>{t.task}</b><small>{t.group} · Owner: {t.owner} · Due {dateFmt(t.due)}</small></span>
        </label>)}
      </div>
    </section>}

    {tab==="Catering" && <section className="panel">
      <div className="panelTitle"><div><span className="eyebrow">FOOD & HOSPITALITY</span><h2>Catering plan</h2></div></div>
      <div className="tableWrap"><table><thead><tr><th>Session</th><th>Count</th><th>Status</th></tr></thead><tbody>
        {plan.catering.map(c=><tr key={c.session}><td>{c.session}</td><td><b>{c.count}</b></td><td><span className="pill">{c.status}</span></td></tr>)}
      </tbody></table></div>
      <div className="callout">Family rule: no close family member handles cooking, frying, serving or cleanup during the 31 Oct evening. Vendors/helpers own the food operation.</div>
    </section>}

    {tab==="Rooms & Staff" && <section className="stack">
      <div className="panel"><div className="panelTitle"><div><span className="eyebrow">4 AC ROOMS</span><h2>Room allocation</h2></div></div>
        <div className="cards">{plan.rooms.map(r=><article className="infoCard" key={r.room}><span>{r.room}</span><h3>{r.title}</h3><p>{r.use}</p></article>)}</div>
      </div>
      <div className="panel"><div className="panelTitle"><div><span className="eyebrow">PEOPLE PLAN</span><h2>Responsibilities</h2></div></div>
        <div className="cards staff">{plan.staff.map(s=><article className="infoCard" key={s.role}><span>{s.role}</span><h3>{s.owner}</h3><p>{s.notes}</p></article>)}</div>
      </div>
    </section>}

    <footer>Event Command Center · v0.1.0 · KPS managed</footer>
  </main>;
}
