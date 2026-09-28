"use client";

import { useEffect, useMemo, useState } from "react";

type Task={id:string;group:string;task:string;owner:string;due:string;done:boolean};
type Day={date:string;label:string;kind:string;items:string[]};
type Catering={session:string;count:string;status:string};
type Room={room:string;title:string;use:string};
type Staff={role:string;owner:string;notes:string};
type Guest={id:string;name:string;adults:number;kids:number;status:"Yes"|"No"|"Maybe"|"No Response";stay:string;transport:string;notes:string};
type Vendor={id:string;category:string;vendor:string;contact:string;budget:number;advance:number;status:string;notes:string};
type Plan={meta:{title:string;subtitle:string;venue:string;actualBirthday:string;mainFunction:string;expectedGuests:number;invitedGuests:number;updatedAt?:string|null};days:Day[];catering:Catering[];rooms:Room[];staff:Staff[];tasks:Task[];guests?:Guest[];vendors?:Vendor[];notes?:string};

const tabs=["Dashboard","Timeline","Tasks","Guests","Vendors & Budget","Catering","Rooms & Staff","Printables"] as const;
type Tab=typeof tabs[number];
const df=(v:string)=>new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",weekday:"short"}).format(new Date(v+"T12:00:00"));
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);
const uid=(p:string)=>p+Math.random().toString(36).slice(2,8);

export default function Home(){
 const [plan,setPlan]=useState<Plan|null>(null),[tab,setTab]=useState<Tab>("Dashboard"),[group,setGroup]=useState("All"),[saving,setSaving]=useState(false);
 useEffect(()=>{fetch("/api/state").then(r=>r.json()).then((p:Plan)=>setPlan({...p,guests:p.guests||[],vendors:p.vendors||[]}));},[]);
 const save=async(next:Plan)=>{setPlan(next);setSaving(true);await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(next)});setSaving(false)};
 const progress=useMemo(()=>plan?Math.round(plan.tasks.filter(t=>t.done).length/Math.max(plan.tasks.length,1)*100):0,[plan]);
 const groups=useMemo(()=>plan?["All",...Array.from(new Set(plan.tasks.map(t=>t.group)))]:["All"],[plan]);
 if(!plan)return <main className="loading">Loading Shreekari Birthday Command Center…</main>;
 const guests=plan.guests||[],vendors=plan.vendors||[];
 const confirmed=guests.filter(g=>g.status==="Yes").reduce((s,g)=>s+g.adults+g.kids,0);
 const maybe=guests.filter(g=>g.status==="Maybe").reduce((s,g)=>s+g.adults+g.kids,0);
 const budget=vendors.reduce((s,v)=>s+(Number(v.budget)||0),0),advance=vendors.reduce((s,v)=>s+(Number(v.advance)||0),0);
 const patch=<K extends keyof Plan>(key:K,value:Plan[K])=>void save({...plan,[key]:value});
 const updateGuest=(id:string,k:keyof Guest,v:any)=>patch("guests",guests.map(g=>g.id===id?{...g,[k]:v}:g));
 const updateVendor=(id:string,k:keyof Vendor,v:any)=>patch("vendors",vendors.map(x=>x.id===id?{...x,[k]:v}:x));
 const toggleTask=(id:string)=>patch("tasks",plan.tasks.map(t=>t.id===id?{...t,done:!t.done}:t));

 return <main className="shell">
  <header className="topbar"><div><div className="eyebrow">PERURU • 29–31 OCT 2026</div><h1>{plan.meta.title}</h1><p>{plan.meta.subtitle} · {plan.meta.venue}</p></div><div className="saveState">{saving?"Saving…":"Saved"}</div></header>
  <nav className="tabs">{tabs.map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}</button>)}</nav>

  {tab==="Dashboard"&&<section className="stack">
   <div className="heroGrid">
    <article className="heroCard primary"><span>Overall readiness</span><strong>{progress}%</strong><div className="meter"><i style={{width:`${progress}%`}}/></div><small>{plan.tasks.filter(t=>t.done).length} of {plan.tasks.length} tasks complete</small></article>
    <article className="heroCard"><span>Guest response</span><strong>{confirmed}</strong><small>confirmed · {maybe} maybe · target {plan.meta.expectedGuests}</small></article>
    <article className="heroCard"><span>Actual birthday</span><strong>29 Oct</strong><small>Temples + home cake</small></article>
    <article className="heroCard"><span>Main function</span><strong>31 Oct</strong><small>Satya Farm House</small></article>
   </div>
   <div className="panel"><div className="panelTitle"><div><span className="eyebrow">29 → 31 OCT</span><h2>Event flow</h2></div></div><div className="dayStrip">{plan.days.filter(d=>["2026-10-29","2026-10-30","2026-10-31","2026-11-01"].includes(d.date)).map(d=><article key={d.date} className={"dayCard "+d.kind}><time>{df(d.date)}</time><h3>{d.label}</h3><ul>{d.items.slice(0,4).map(x=><li key={x}>{x}</li>)}</ul></article>)}</div></div>
   <div className="twoCol">
    <div className="panel"><div className="panelTitle"><h2>Open priorities</h2><button onClick={()=>setTab("Tasks")}>View all</button></div><div className="taskList compact">{plan.tasks.filter(t=>!t.done).slice(0,10).map(t=><label className="task" key={t.id}><input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)}/><span><b>{t.task}</b><small>{t.group} · due {df(t.due)} · {t.owner}</small></span></label>)}</div></div>
    <div className="panel"><div className="panelTitle"><h2>Operating notes</h2></div><textarea className="notes" value={plan.notes||""} placeholder="Quick family/vendor coordination notes…" onChange={e=>setPlan({...plan,notes:e.target.value})} onBlur={()=>void save(plan)}/><div className="miniStats"><div><b>{money(budget)}</b><span>planned vendor budget</span></div><div><b>{money(advance)}</b><span>advances paid</span></div></div></div>
   </div>
  </section>}

  {tab==="Timeline"&&<section className="panel"><div className="panelTitle"><div><span className="eyebrow">23 OCT → 1 NOV</span><h2>Master timeline</h2></div></div><div className="timeline">{plan.days.map(d=><article className="timelineRow" key={d.date}><div className="dateBadge"><b>{new Date(d.date+"T12:00:00").getDate()}</b><span>{new Intl.DateTimeFormat("en",{month:"short"}).format(new Date(d.date+"T12:00:00"))}</span></div><div className="timelineBody"><div className="rowHead"><h3>{d.label}</h3><span>{df(d.date)}</span></div><ul>{d.items.map(x=><li key={x}>{x}</li>)}</ul></div></article>)}</div></section>}

  {tab==="Tasks"&&<section className="panel"><div className="panelTitle responsive"><div><span className="eyebrow">ACTION TRACKER</span><h2>{plan.tasks.filter(t=>group==="All"||t.group===group).length} tasks</h2></div><select value={group} onChange={e=>setGroup(e.target.value)}>{groups.map(g=><option key={g}>{g}</option>)}</select></div><div className="taskList">{plan.tasks.filter(t=>group==="All"||t.group===group).map(t=><label className={"task "+(t.done?"done":"")} key={t.id}><input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)}/><span><b>{t.task}</b><small>{t.group} · Owner: {t.owner} · Due {df(t.due)}</small></span></label>)}</div></section>}

  {tab==="Guests"&&<section className="panel"><div className="panelTitle responsive"><div><span className="eyebrow">RSVP & ARRIVAL</span><h2>{confirmed} confirmed people</h2></div><button onClick={()=>patch("guests",[...guests,{id:uid("g"),name:"",adults:2,kids:0,status:"No Response",stay:"",transport:"",notes:""}])}>+ Add family</button></div>
   <div className="guestSummary"><span><b>{guests.length}</b> families listed</span><span><b>{confirmed}</b> confirmed</span><span><b>{maybe}</b> maybe</span><span><b>{guests.filter(g=>g.status==="No Response").length}</b> awaiting reply</span></div>
   <div className="tableWrap"><table><thead><tr><th>Family / guest</th><th>A</th><th>K</th><th>RSVP</th><th>Stay</th><th>Transport</th><th>Notes</th><th></th></tr></thead><tbody>{guests.map(g=><tr key={g.id}><td><input value={g.name} onChange={e=>updateGuest(g.id,"name",e.target.value)}/></td><td><input className="num" type="number" min="0" value={g.adults} onChange={e=>updateGuest(g.id,"adults",+e.target.value)}/></td><td><input className="num" type="number" min="0" value={g.kids} onChange={e=>updateGuest(g.id,"kids",+e.target.value)}/></td><td><select value={g.status} onChange={e=>updateGuest(g.id,"status",e.target.value)}><option>Yes</option><option>No</option><option>Maybe</option><option>No Response</option></select></td><td><input value={g.stay} onChange={e=>updateGuest(g.id,"stay",e.target.value)} placeholder="Home/hotel"/></td><td><input value={g.transport} onChange={e=>updateGuest(g.id,"transport",e.target.value)} placeholder="Pickup/drop"/></td><td><input value={g.notes} onChange={e=>updateGuest(g.id,"notes",e.target.value)}/></td><td><button className="danger" onClick={()=>patch("guests",guests.filter(x=>x.id!==g.id))}>×</button></td></tr>)}</tbody></table></div>
  </section>}

  {tab==="Vendors & Budget"&&<section className="stack"><div className="heroGrid budgetGrid"><article className="heroCard primary"><span>Planned budget</span><strong>{money(budget)}</strong><small>{vendors.length} vendor lines</small></article><article className="heroCard"><span>Advance paid</span><strong>{money(advance)}</strong><small>tracked so far</small></article><article className="heroCard"><span>Balance</span><strong>{money(budget-advance)}</strong><small>before final settlements</small></article></div>
   <div className="panel"><div className="panelTitle responsive"><div><span className="eyebrow">VENDOR CONTROL</span><h2>Bookings & payments</h2></div><button onClick={()=>patch("vendors",[...vendors,{id:uid("v"),category:"",vendor:"",contact:"",budget:0,advance:0,status:"To contact",notes:""}])}>+ Add vendor</button></div><div className="tableWrap"><table><thead><tr><th>Category</th><th>Vendor</th><th>Contact</th><th>Budget</th><th>Advance</th><th>Status</th><th>Notes</th><th></th></tr></thead><tbody>{vendors.map(v=><tr key={v.id}><td><input value={v.category} onChange={e=>updateVendor(v.id,"category",e.target.value)}/></td><td><input value={v.vendor} onChange={e=>updateVendor(v.id,"vendor",e.target.value)}/></td><td><input value={v.contact} onChange={e=>updateVendor(v.id,"contact",e.target.value)}/></td><td><input className="moneyInput" type="number" value={v.budget} onChange={e=>updateVendor(v.id,"budget",+e.target.value)}/></td><td><input className="moneyInput" type="number" value={v.advance} onChange={e=>updateVendor(v.id,"advance",+e.target.value)}/></td><td><select value={v.status} onChange={e=>updateVendor(v.id,"status",e.target.value)}><option>To contact</option><option>Shortlisted</option><option>Booked</option><option>Paid</option><option>Cancelled</option></select></td><td><input value={v.notes} onChange={e=>updateVendor(v.id,"notes",e.target.value)}/></td><td><button className="danger" onClick={()=>patch("vendors",vendors.filter(x=>x.id!==v.id))}>×</button></td></tr>)}</tbody></table></div></div>
  </section>}

  {tab==="Catering"&&<section className="panel"><div className="panelTitle"><div><span className="eyebrow">FOOD & HOSPITALITY</span><h2>Catering plan</h2></div></div><div className="tableWrap"><table><thead><tr><th>Session</th><th>Count</th><th>Status</th></tr></thead><tbody>{plan.catering.map((c,i)=><tr key={c.session}><td>{c.session}</td><td><input value={c.count} onChange={e=>patch("catering",plan.catering.map((x,j)=>j===i?{...x,count:e.target.value}:x))}/></td><td><select value={c.status} onChange={e=>patch("catering",plan.catering.map((x,j)=>j===i?{...x,status:e.target.value}:x))}><option>planned</option><option>confirmed</option><option>done</option></select></td></tr>)}</tbody></table></div><div className="callout">Family rule: no close family member handles cooking, frying, serving or cleanup during the 31 Oct evening. Vendors/helpers own the food operation.</div></section>}

  {tab==="Rooms & Staff"&&<section className="stack"><div className="panel"><div className="panelTitle"><div><span className="eyebrow">4 AC ROOMS</span><h2>Room allocation</h2></div></div><div className="cards">{plan.rooms.map(r=><article className="infoCard" key={r.room}><span>{r.room}</span><h3>{r.title}</h3><p>{r.use}</p></article>)}</div></div><div className="panel"><div className="panelTitle"><div><span className="eyebrow">PEOPLE PLAN</span><h2>Responsibilities</h2></div></div><div className="cards staff">{plan.staff.map(s=><article className="infoCard" key={s.role}><span>{s.role}</span><h3>{s.owner}</h3><p>{s.notes}</p></article>)}</div></div></section>}

  {tab==="Printables"&&<section className="stack printArea"><div className="panel noPrint"><div className="panelTitle"><div><span className="eyebrow">VENUE PRINT PACK</span><h2>Print-ready notices</h2></div><button onClick={()=>window.print()}>Print notices</button></div><p className="hint">Use browser print. Navigation and controls are hidden automatically.</p></div>
   {plan.rooms.map(r=><article className="poster" key={r.room}><span>{r.room}</span><h2>{r.title}</h2><p>{r.use}</p></article>)}
   <article className="poster"><span>GUEST HELP</span><h2>NEED HELP? ASK ME</h2><p>For directions, water, washrooms, charging, first aid, transport or any guest need, please contact the team member wearing the ASK ME badge.</p></article>
   <article className="poster"><span>SAFETY</span><h2>CHILDREN MUST BE SUPERVISED</h2><p>Pond • Well • Kids Pool • Tree House • Zip/Play Areas</p></article>
   <article className="poster"><span>UTILITY</span><h2>MOBILE CHARGING STATION</h2><p>Please keep your phone with you and use the charging rack responsibly.</p></article>
  </section>}
  <footer>Shreekari Birthday Command Center · v0.2.0 · KPS managed</footer>
 </main>
}