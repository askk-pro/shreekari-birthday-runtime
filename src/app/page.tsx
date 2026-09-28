"use client";

import { useEffect, useMemo, useState } from "react";

type Task={id:string;group:string;task:string;owner:string;due:string;done:boolean};
type Day={date:string;label:string;kind:string;items:string[]};
type Catering={session:string;count:string;status:string};
type Room={room:string;title:string;use:string};
type Staff={role:string;owner:string;notes:string};
type Guest={id:string;name:string;phone:string;adults:number;kids:number;status:"Yes"|"No"|"Maybe"|"No Response";stay:string;transport:string;notes:string};
type Vendor={id:string;category:string;vendor:string;contact:string;budget:number;advance:number;finalPaid:number;status:string;notes:string};
type RunItem={id:string;time:string;title:string;owner:string;done:boolean;notes:string};
type Plan={
  meta:{title:string;subtitle:string;venue:string;actualBirthday:string;mainFunction:string;expectedGuests:number;invitedGuests:number;updatedAt?:string|null};
  days:Day[];catering:Catering[];rooms:Room[];staff:Staff[];tasks:Task[];
  guests?:Guest[];vendors?:Vendor[];runSheet?:RunItem[];notes?:string;
};

const tabs=["Today","Dashboard","Timeline","Tasks","Guests","Vendors & Budget","Catering","Rooms & Staff","Printables"] as const;
type Tab=typeof tabs[number];
const df=(v:string)=>new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",weekday:"short"}).format(new Date(v+"T12:00:00"));
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);
const uid=(p:string)=>p+Math.random().toString(36).slice(2,9);
const defaultRunSheet:RunItem[]=[
 {id:"r01",time:"05:30",title:"Vendor access, lighting, sound and breakfast setup",owner:"Event Captain",done:false,notes:""},
 {id:"r02",time:"08:00",title:"Family settles into rooms; breakfast for 30–40",owner:"Family Coordinator",done:false,notes:""},
 {id:"r03",time:"08:30",title:"Live devotional music / bhajans begin",owner:"Music Lead",done:false,notes:""},
 {id:"r04",time:"09:00",title:"Guest arrival, tea/coffee, kids activities",owner:"Guest Coordinator + Anchor",done:false,notes:""},
 {id:"r05",time:"10:15",title:"Shree quiet rest / sleep window begins",owner:"Vaishu + Shree Care",done:false,notes:"Move microphone/games away from Room 1"},
 {id:"r06",time:"11:15",title:"Gopuja with close family",owner:"Priest Coordinator",done:false,notes:""},
 {id:"r07",time:"11:25",title:"Family boards decorated bullock cart",owner:"Procession Lead",done:false,notes:"No crackers/noise while animals are present"},
 {id:"r08",time:"11:30",title:"Bullock-cart arrival + rose-petal welcome",owner:"Nadaswaram + Event Team",done:false,notes:""},
 {id:"r09",time:"11:40",title:"Veda Ashirvachanam and family blessings",owner:"Vedic Scholars",done:false,notes:""},
 {id:"r10",time:"11:48",title:"Shreekari first-year film",owner:"AV Lead",done:false,notes:"Laptop + 2 pen-drive backups ready"},
 {id:"r11",time:"11:52",title:"Vinayaka / Hanuman mantra and Sanskrit chanting",owner:"Priest / Scholars",done:false,notes:""},
 {id:"r12",time:"12:00",title:"Main cake cutting",owner:"Family",done:false,notes:""},
 {id:"r13",time:"12:30",title:"Lunch opens",owner:"Catering Lead",done:false,notes:"Plan 180; stretch capability around 195"},
 {id:"r14",time:"14:00",title:"Main guest departure; Shree rest; venue reset",owner:"Event Team",done:false,notes:""},
 {id:"r15",time:"15:30",title:"Ladies/adult games + prizes + Tambola",owner:"Anchor + Games Team",done:false,notes:"UPI, change bank and disposable pens ready"},
 {id:"r16",time:"17:00",title:"Tea + hot bajji/pakodi",owner:"Snack Cook",done:false,notes:""},
 {id:"r17",time:"18:30",title:"Close-family night: live dosa + veg grill",owner:"Evening Food Team",done:false,notes:"35–45 people"},
 {id:"r18",time:"19:00",title:"Bonfire, karaoke, guitars, songs and dance",owner:"Family + AV Lead",done:false,notes:"Fire-safe zone; kids supervised"},
 {id:"r19",time:"21:30",title:"Wind down + post-event pack-up begins",owner:"Closeout Lead",done:false,notes:"TAKE HOME / RETURN VENDOR / DISCARD zones"}
];

function normalizePhone(raw:string){
 const d=raw.replace(/\D/g,"");
 if(d.length===10)return "91"+d;
 return d;
}
function whatsappUrl(g:Guest){
 const p=normalizePhone(g.phone);
 const text=`Hi ${g.name||"there"}, we’re confirming attendance for Shreekari’s first birthday function at Satya Farm House, Peruru on Saturday, 31 October. Please confirm the number of adults and children attending, and let us know if you need route, stay or pickup/drop assistance. Thank you!`;
 return p?`https://wa.me/${p}?text=${encodeURIComponent(text)}`:"#";
}

export default function Home(){
 const [plan,setPlan]=useState<Plan|null>(null);
 const [tab,setTab]=useState<Tab>("Today");
 const [group,setGroup]=useState("All");
 const [saving,setSaving]=useState(false);
 const [bulkGuests,setBulkGuests]=useState("");
 const [showBulk,setShowBulk]=useState(false);

 useEffect(()=>{fetch("/api/state",{cache:"no-store"}).then(r=>r.json()).then((p:Plan)=>setPlan({
  ...p,
  guests:(p.guests||[]).map(g=>({...g,phone:g.phone??""})),
  vendors:(p.vendors||[]).map(v=>({...v,finalPaid:v.finalPaid??0})),
  runSheet:p.runSheet?.length?p.runSheet:defaultRunSheet
 }));},[]);

 const save=async(next:Plan)=>{
  setPlan(next);setSaving(true);
  try{await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(next)});}
  finally{setSaving(false);}
 };
 const progress=useMemo(()=>plan?Math.round(plan.tasks.filter(t=>t.done).length/Math.max(plan.tasks.length,1)*100):0,[plan]);
 const groups=useMemo(()=>plan?["All",...Array.from(new Set(plan.tasks.map(t=>t.group)))]:["All"],[plan]);
 if(!plan)return <main className="loading">Loading Shreekari Birthday Command Center…</main>;

 const guests=plan.guests||[],vendors=plan.vendors||[],runSheet=plan.runSheet||defaultRunSheet;
 const confirmed=guests.filter(g=>g.status==="Yes").reduce((s,g)=>s+g.adults+g.kids,0);
 const maybe=guests.filter(g=>g.status==="Maybe").reduce((s,g)=>s+g.adults+g.kids,0);
 const budget=vendors.reduce((s,v)=>s+(Number(v.budget)||0),0);
 const paid=vendors.reduce((s,v)=>s+(Number(v.advance)||0)+(Number(v.finalPaid)||0),0);
 const openToday=runSheet.filter(x=>!x.done).length;
 const patch=<K extends keyof Plan>(key:K,value:Plan[K])=>void save({...plan,[key]:value});
 const localPatch=<K extends keyof Plan>(key:K,value:Plan[K])=>setPlan({...plan,[key]:value});
 const toggleTask=(id:string)=>patch("tasks",plan.tasks.map(t=>t.id===id?{...t,done:!t.done}:t));
 const toggleRun=(id:string)=>patch("runSheet",runSheet.map(r=>r.id===id?{...r,done:!r.done}:r));

 const importGuests=()=>{
  const rows=bulkGuests.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const added=rows.map(line=>{
   const [name="",phone="",adults="2",kids="0",status="No Response",stay="",transport="",notes=""]=line.split(/\t|,/).map(x=>x.trim());
   const allowed=["Yes","No","Maybe","No Response"];
   return {id:uid("g"),name,phone,adults:Number(adults)||0,kids:Number(kids)||0,status:(allowed.includes(status)?status:"No Response") as Guest["status"],stay,transport,notes};
  });
  void save({...plan,guests:[...guests,...added]});setBulkGuests("");setShowBulk(false);
 };

 return <main className="shell">
  <header className="topbar">
   <div><div className="eyebrow">PERURU • 29–31 OCT 2026</div><h1>{plan.meta.title}</h1><p>{plan.meta.subtitle} · {plan.meta.venue}</p></div>
   <div className="headerActions"><div className="saveState">{saving?"Saving…":"Saved"}</div><button className="todayBtn" onClick={()=>setTab("Today")}>31 Oct Today View</button></div>
  </header>

  <nav className="tabs">{tabs.map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}</button>)}</nav>

  {tab==="Today"&&<section className="stack">
   <div className="heroGrid todayHero">
    <article className="heroCard primary"><span>31 Oct run sheet</span><strong>{runSheet.length-openToday}/{runSheet.length}</strong><small>moments completed</small></article>
    <article className="heroCard"><span>Confirmed guests</span><strong>{confirmed||"—"}</strong><small>{maybe} maybe · lunch target ~180</small></article>
    <article className="heroCard"><span>Open tasks</span><strong>{plan.tasks.filter(t=>!t.done).length}</strong><small>{progress}% overall readiness</small></article>
    <article className="heroCard"><span>Vendor balance</span><strong>{money(Math.max(0,budget-paid))}</strong><small>{money(paid)} paid/advanced</small></article>
   </div>
   <div className="panel">
    <div className="panelTitle"><div><span className="eyebrow">EVENT-DAY CONTROL</span><h2>31 October run sheet</h2></div><button onClick={()=>patch("runSheet",defaultRunSheet)}>Reset template</button></div>
    <div className="runSheet">{runSheet.map(r=><article className={"runRow "+(r.done?"done":"")} key={r.id}>
     <button className="runCheck" onClick={()=>toggleRun(r.id)}>{r.done?"✓":"○"}</button>
     <time>{r.time}</time><div><h3>{r.title}</h3><p>{r.owner}{r.notes?" · "+r.notes:""}</p></div>
    </article>)}</div>
   </div>
   <div className="twoCol">
    <div className="panel"><div className="panelTitle"><h2>Critical open priorities</h2><button onClick={()=>setTab("Tasks")}>All tasks</button></div><div className="taskList compact">{plan.tasks.filter(t=>!t.done).slice(0,12).map(t=><label className="task" key={t.id}><input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)}/><span><b>{t.task}</b><small>{t.owner} · due {df(t.due)}</small></span></label>)}</div></div>
    <div className="panel"><div className="panelTitle"><h2>Event-day rules</h2></div><ul className="rules"><li>Protect Shree’s 10:15–11:30 quiet/rest window.</li><li>ASK ME helper handles small guest requests—not Aryan.</li><li>Two helpers remain dedicated to kids safety around pond/well/pool/play areas.</li><li>No close family member handles evening cooking/serving/cleanup.</li><li>Post-event closeout team owns pack-up, settlement and venue handover.</li></ul></div>
   </div>
  </section>}

  {tab==="Dashboard"&&<section className="stack">
   <div className="heroGrid">
    <article className="heroCard primary"><span>Overall readiness</span><strong>{progress}%</strong><div className="meter"><i style={{width:`${progress}%`}}/></div><small>{plan.tasks.filter(t=>t.done).length} of {plan.tasks.length} tasks complete</small></article>
    <article className="heroCard"><span>Guest response</span><strong>{confirmed||"—"}</strong><small>confirmed · {maybe} maybe · target {plan.meta.expectedGuests}</small></article>
    <article className="heroCard"><span>Actual birthday</span><strong>29 Oct</strong><small>Temples + intimate home cake</small></article>
    <article className="heroCard"><span>Main function</span><strong>31 Oct</strong><small>Satya Farm House</small></article>
   </div>
   <div className="panel"><div className="panelTitle"><div><span className="eyebrow">29 → 31 OCT</span><h2>Event flow</h2></div></div><div className="dayStrip">{plan.days.filter(d=>["2026-10-29","2026-10-30","2026-10-31","2026-11-01"].includes(d.date)).map(d=><article key={d.date} className={"dayCard "+d.kind}><time>{df(d.date)}</time><h3>{d.label}</h3><ul>{d.items.slice(0,4).map(x=><li key={x}>{x}</li>)}</ul></article>)}</div></div>
   <div className="twoCol">
    <div className="panel"><div className="panelTitle"><h2>Open priorities</h2><button onClick={()=>setTab("Tasks")}>View all</button></div><div className="taskList compact">{plan.tasks.filter(t=>!t.done).slice(0,10).map(t=><label className="task" key={t.id}><input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)}/><span><b>{t.task}</b><small>{t.group} · due {df(t.due)} · {t.owner}</small></span></label>)}</div></div>
    <div className="panel"><div className="panelTitle"><h2>Operating notes</h2></div><textarea className="notes" value={plan.notes||""} placeholder="Quick family/vendor coordination notes…" onChange={e=>localPatch("notes",e.target.value)} onBlur={()=>void save(plan)}/><div className="miniStats"><div><b>{money(budget)}</b><span>planned vendor budget</span></div><div><b>{money(paid)}</b><span>paid / advances</span></div></div></div>
   </div>
  </section>}

  {tab==="Timeline"&&<section className="panel"><div className="panelTitle"><div><span className="eyebrow">23 OCT → 1 NOV</span><h2>Master timeline</h2></div></div><div className="timeline">{plan.days.map(d=><article className="timelineRow" key={d.date}><div className="dateBadge"><b>{new Date(d.date+"T12:00:00").getDate()}</b><span>{new Intl.DateTimeFormat("en",{month:"short"}).format(new Date(d.date+"T12:00:00"))}</span></div><div className="timelineBody"><div className="rowHead"><h3>{d.label}</h3><span>{df(d.date)}</span></div><ul>{d.items.map(x=><li key={x}>{x}</li>)}</ul></div></article>)}</div></section>}

  {tab==="Tasks"&&<section className="panel">
   <div className="panelTitle responsive"><div><span className="eyebrow">ACTION TRACKER</span><h2>{plan.tasks.filter(t=>group==="All"||t.group===group).length} tasks</h2></div><div className="buttonRow"><select value={group} onChange={e=>setGroup(e.target.value)}>{groups.map(g=><option key={g}>{g}</option>)}</select><button onClick={()=>patch("tasks",[...plan.tasks,{id:uid("t"),group:"General",task:"New task",owner:"Assign",due:"2026-10-30",done:false}])}>+ Add task</button></div></div>
   <div className="taskEditList">{plan.tasks.filter(t=>group==="All"||t.group===group).map(t=><article className={"taskEdit "+(t.done?"done":"")} key={t.id}>
    <input className="check" type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)}/>
    <div className="taskFields"><input value={t.task} onChange={e=>localPatch("tasks",plan.tasks.map(x=>x.id===t.id?{...x,task:e.target.value}:x))} onBlur={()=>void save(plan)}/><div className="taskMeta"><input value={t.group} onChange={e=>localPatch("tasks",plan.tasks.map(x=>x.id===t.id?{...x,group:e.target.value}:x))} onBlur={()=>void save(plan)}/><input value={t.owner} onChange={e=>localPatch("tasks",plan.tasks.map(x=>x.id===t.id?{...x,owner:e.target.value}:x))} onBlur={()=>void save(plan)}/><input type="date" value={t.due} onChange={e=>patch("tasks",plan.tasks.map(x=>x.id===t.id?{...x,due:e.target.value}:x))}/></div></div>
    <button className="danger" onClick={()=>patch("tasks",plan.tasks.filter(x=>x.id!==t.id))}>×</button>
   </article>)}</div>
  </section>}

  {tab==="Guests"&&<section className="panel">
   <div className="panelTitle responsive"><div><span className="eyebrow">RSVP & ARRIVAL</span><h2>{confirmed} confirmed people</h2></div><div className="buttonRow"><button onClick={()=>setShowBulk(!showBulk)}>Bulk paste</button><button onClick={()=>patch("guests",[...guests,{id:uid("g"),name:"",phone:"",adults:2,kids:0,status:"No Response",stay:"",transport:"",notes:""}])}>+ Add family</button></div></div>
   {showBulk&&<div className="bulkBox"><p>Paste one family per line: <b>Name, Phone, Adults, Kids, Status, Stay, Transport, Notes</b></p><textarea value={bulkGuests} onChange={e=>setBulkGuests(e.target.value)} placeholder={"Ravi Family, 9876543210, 2, 1, Yes, Amma house, Pickup road center, Arrives 9:30\nKeerthi, 9876543210, 2, 0, Maybe, , , Return gifts"}/><div className="buttonRow"><button onClick={importGuests}>Import rows</button><button className="secondary" onClick={()=>setShowBulk(false)}>Cancel</button></div></div>}
   <div className="guestSummary"><span><b>{guests.length}</b> families listed</span><span><b>{confirmed}</b> confirmed</span><span><b>{maybe}</b> maybe</span><span><b>{guests.filter(g=>g.status==="No Response").length}</b> awaiting reply</span></div>
   <div className="tableWrap"><table><thead><tr><th>Family / guest</th><th>Phone</th><th>A</th><th>K</th><th>RSVP</th><th>Stay</th><th>Transport</th><th>Notes</th><th>WhatsApp</th><th></th></tr></thead><tbody>{guests.map(g=><tr key={g.id}>
    <td><input value={g.name} onChange={e=>localPatch("guests",guests.map(x=>x.id===g.id?{...x,name:e.target.value}:x))} onBlur={()=>void save(plan)}/></td>
    <td><input value={g.phone} onChange={e=>localPatch("guests",guests.map(x=>x.id===g.id?{...x,phone:e.target.value}:x))} onBlur={()=>void save(plan)} placeholder="9876543210"/></td>
    <td><input className="num" type="number" min="0" value={g.adults} onChange={e=>patch("guests",guests.map(x=>x.id===g.id?{...x,adults:+e.target.value}:x))}/></td>
    <td><input className="num" type="number" min="0" value={g.kids} onChange={e=>patch("guests",guests.map(x=>x.id===g.id?{...x,kids:+e.target.value}:x))}/></td>
    <td><select value={g.status} onChange={e=>patch("guests",guests.map(x=>x.id===g.id?{...x,status:e.target.value as Guest["status"]}:x))}><option>Yes</option><option>No</option><option>Maybe</option><option>No Response</option></select></td>
    <td><input value={g.stay} onChange={e=>localPatch("guests",guests.map(x=>x.id===g.id?{...x,stay:e.target.value}:x))} onBlur={()=>void save(plan)} placeholder="Home/hotel"/></td>
    <td><input value={g.transport} onChange={e=>localPatch("guests",guests.map(x=>x.id===g.id?{...x,transport:e.target.value}:x))} onBlur={()=>void save(plan)} placeholder="Pickup/drop"/></td>
    <td><input value={g.notes} onChange={e=>localPatch("guests",guests.map(x=>x.id===g.id?{...x,notes:e.target.value}:x))} onBlur={()=>void save(plan)}/></td>
    <td>{g.phone?<a className="waBtn" href={whatsappUrl(g)} target="_blank" rel="noreferrer">Message</a>:<span className="muted">Add phone</span>}</td>
    <td><button className="danger" onClick={()=>patch("guests",guests.filter(x=>x.id!==g.id))}>×</button></td>
   </tr>)}</tbody></table></div>
  </section>}

  {tab==="Vendors & Budget"&&<section className="stack">
   <div className="heroGrid budgetGrid"><article className="heroCard primary"><span>Planned budget</span><strong>{money(budget)}</strong><small>{vendors.length} vendor lines</small></article><article className="heroCard"><span>Paid / advances</span><strong>{money(paid)}</strong><small>tracked so far</small></article><article className="heroCard"><span>Balance</span><strong>{money(Math.max(0,budget-paid))}</strong><small>before final settlements</small></article></div>
   <div className="panel"><div className="panelTitle responsive"><div><span className="eyebrow">VENDOR CONTROL</span><h2>Bookings, payments & settlement</h2></div><button onClick={()=>patch("vendors",[...vendors,{id:uid("v"),category:"",vendor:"",contact:"",budget:0,advance:0,finalPaid:0,status:"To contact",notes:""}])}>+ Add vendor</button></div>
    <div className="tableWrap"><table><thead><tr><th>Category</th><th>Vendor</th><th>Contact</th><th>Budget</th><th>Advance</th><th>Final paid</th><th>Balance</th><th>Status</th><th>Notes</th><th></th></tr></thead><tbody>{vendors.map(v=>{const bal=Math.max(0,(v.budget||0)-(v.advance||0)-(v.finalPaid||0));return <tr key={v.id}>
     <td><input value={v.category} onChange={e=>localPatch("vendors",vendors.map(x=>x.id===v.id?{...x,category:e.target.value}:x))} onBlur={()=>void save(plan)}/></td>
     <td><input value={v.vendor} onChange={e=>localPatch("vendors",vendors.map(x=>x.id===v.id?{...x,vendor:e.target.value}:x))} onBlur={()=>void save(plan)}/></td>
     <td><input value={v.contact} onChange={e=>localPatch("vendors",vendors.map(x=>x.id===v.id?{...x,contact:e.target.value}:x))} onBlur={()=>void save(plan)}/></td>
     <td><input className="moneyInput" type="number" value={v.budget} onChange={e=>patch("vendors",vendors.map(x=>x.id===v.id?{...x,budget:+e.target.value}:x))}/></td>
     <td><input className="moneyInput" type="number" value={v.advance} onChange={e=>patch("vendors",vendors.map(x=>x.id===v.id?{...x,advance:+e.target.value}:x))}/></td>
     <td><input className="moneyInput" type="number" value={v.finalPaid} onChange={e=>patch("vendors",vendors.map(x=>x.id===v.id?{...x,finalPaid:+e.target.value}:x))}/></td>
     <td><b>{money(bal)}</b>{bal>0&&<button className="settleBtn" onClick={()=>patch("vendors",vendors.map(x=>x.id===v.id?{...x,finalPaid:(x.finalPaid||0)+bal,status:"Settled"}:x))}>Settle</button>}</td>
     <td><select value={v.status} onChange={e=>patch("vendors",vendors.map(x=>x.id===v.id?{...x,status:e.target.value}:x))}><option>To contact</option><option>Shortlisted</option><option>Booked</option><option>Part paid</option><option>Settled</option><option>Cancelled</option></select></td>
     <td><input value={v.notes} onChange={e=>localPatch("vendors",vendors.map(x=>x.id===v.id?{...x,notes:e.target.value}:x))} onBlur={()=>void save(plan)}/></td>
     <td><button className="danger" onClick={()=>patch("vendors",vendors.filter(x=>x.id!==v.id))}>×</button></td>
    </tr>})}</tbody></table></div>
   </div>
  </section>}

  {tab==="Catering"&&<section className="panel"><div className="panelTitle"><div><span className="eyebrow">FOOD & HOSPITALITY</span><h2>Catering plan</h2></div></div><div className="tableWrap"><table><thead><tr><th>Session</th><th>Count</th><th>Status</th></tr></thead><tbody>{plan.catering.map((c,i)=><tr key={c.session}><td>{c.session}</td><td><input value={c.count} onChange={e=>localPatch("catering",plan.catering.map((x,j)=>j===i?{...x,count:e.target.value}:x))} onBlur={()=>void save(plan)}/></td><td><select value={c.status} onChange={e=>patch("catering",plan.catering.map((x,j)=>j===i?{...x,status:e.target.value}:x))}><option>planned</option><option>confirmed</option><option>done</option></select></td></tr>)}</tbody></table></div><div className="callout">Family rule: no close family member handles cooking, frying, serving or cleanup during the 31 Oct evening. Vendors/helpers own the food operation.</div></section>}

  {tab==="Rooms & Staff"&&<section className="stack">
   <div className="panel"><div className="panelTitle"><div><span className="eyebrow">4 AC ROOMS</span><h2>Room allocation</h2></div></div><div className="cards">{plan.rooms.map(r=><article className="infoCard" key={r.room}><span>{r.room}</span><h3>{r.title}</h3><p>{r.use}</p></article>)}</div></div>
   <div className="panel"><div className="panelTitle"><div><span className="eyebrow">PEOPLE PLAN</span><h2>Responsibilities</h2></div></div><div className="cards staff">{plan.staff.map(s=><article className="infoCard" key={s.role}><span>{s.role}</span><h3>{s.owner}</h3><p>{s.notes}</p></article>)}</div></div>
  </section>}

  {tab==="Printables"&&<section className="stack printArea">
   <div className="panel noPrint"><div className="panelTitle"><div><span className="eyebrow">VENUE PRINT PACK</span><h2>Print-ready notices</h2></div><button onClick={()=>window.print()}>Print notices</button></div><p className="hint">Use browser print. Navigation and controls are hidden automatically.</p></div>
   {plan.rooms.map(r=><article className="poster" key={r.room}><span>{r.room}</span><h2>{r.title}</h2><p>{r.use}</p></article>)}
   <article className="poster"><span>GUEST HELP</span><h2>NEED HELP? ASK ME</h2><p>For directions, water, washrooms, charging, first aid, transport or any guest need, please contact the team member wearing the ASK ME badge.</p></article>
   <article className="poster"><span>SAFETY</span><h2>CHILDREN MUST BE SUPERVISED</h2><p>Pond • Well • Kids Pool • Tree House • Zip/Play Areas</p></article>
   <article className="poster"><span>UTILITY</span><h2>MOBILE CHARGING STATION</h2><p>Please keep your phone with you and use the charging rack responsibly.</p></article>
   <article className="poster"><span>COMFORT</span><h2>GUEST COMFORT CORNER</h2><p>Odomos • Tissues • Sanitizer • Shawls • Basic essentials available</p></article>
  </section>}

  <footer>Shreekari Birthday Command Center · v0.3.0 · KPS managed</footer>
 </main>;
}
