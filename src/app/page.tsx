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
type IconName="today"|"overview"|"timeline"|"tasks"|"guests"|"vendors"|"catering"|"rooms"|"print"|"menu"|"close"|"logout";

const navGroups=[
  {label:"Command Center",items:[["Today","today"],["Dashboard","overview"],["Timeline","timeline"]]},
  {label:"Operations",items:[["Tasks","tasks"],["Guests","guests"],["Vendors & Budget","vendors"],["Catering","catering"]]},
  {label:"Planning",items:[["Rooms & Staff","rooms"],["Printables","print"]]},
] as const;

const pageMeta:Record<Tab,{title:string;description:string}>={
  Today:{title:"Event Day Control",description:"31 October live run sheet, priorities and operational checks."},
  Dashboard:{title:"Overview",description:"Readiness, guest response, event milestones and working notes."},
  Timeline:{title:"Master Timeline",description:"Preparation and celebration flow from arrival through closeout."},
  Tasks:{title:"Task Management",description:"Assign, track and close every preparation item before the function."},
  Guests:{title:"Guest & RSVP",description:"Attendance, stay, transport and communication management."},
  "Vendors & Budget":{title:"Vendors & Budget",description:"Bookings, advances, balances and final settlement control."},
  Catering:{title:"Catering & Hospitality",description:"Meal sessions, headcounts and service readiness."},
  "Rooms & Staff":{title:"Rooms & Team",description:"Venue room allocation and operational responsibility matrix."},
  Printables:{title:"Venue Print Pack",description:"Operational signs and notices ready for printing."},
};

function Icon({name}:{name:IconName}){
  const common={width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  const paths:Record<IconName,React.ReactNode>={
    today:<><path d="M4 5.5h16v14H4z"/><path d="M8 3v5M16 3v5M4 9.5h16"/><path d="M8 13h3M8 16h6"/></>,
    overview:<><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    timeline:<><path d="M7 4v16"/><circle cx="7" cy="7" r="2"/><circle cx="7" cy="16" r="2"/><path d="M11 7h8M11 16h8"/></>,
    tasks:<><path d="M9 6h11M9 12h11M9 18h11"/><path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></>,
    guests:<><circle cx="9" cy="8" r="3"/><path d="M3 20c.7-4 2.8-6 6-6s5.3 2 6 6"/><circle cx="17" cy="9" r="2"/><path d="M15 15c3.2-.2 5.2 1.5 6 5"/></>,
    vendors:<><path d="M4 7h16v12H4z"/><path d="M7 7V5h10v2"/><path d="M4 11h16"/><path d="M9 15h6"/></>,
    catering:<><path d="M6 3v8M9 3v8M6 7h3M7.5 11v10"/><path d="M15 3v18M15 3c3 2 4 5 4 8h-4"/></>,
    rooms:<><path d="M3 10.5 12 4l9 6.5V20H3z"/><path d="M9 20v-6h6v6"/></>,
    print:<><path d="M7 8V4h10v4"/><path d="M6 18H4v-7h16v7h-2"/><path d="M7 15h10v5H7z"/></>,
    menu:<><path d="M4 6h16M4 12h16M4 18h16"/></>,
    close:<><path d="m6 6 12 12M18 6 6 18"/></>,
    logout:<><path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4M18 12H9"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

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
 const [mobileNav,setMobileNav]=useState(false);
 const [taskSearch,setTaskSearch]=useState("");
 const [taskStatus,setTaskStatus]=useState<"All"|"Open"|"Done">("Open");

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
 const openTasks=plan.tasks.filter(t=>!t.done).length;

 const patch=<K extends keyof Plan>(key:K,value:Plan[K])=>void save({...plan,[key]:value});
 const localPatch=<K extends keyof Plan>(key:K,value:Plan[K])=>setPlan({...plan,[key]:value});
 const toggleTask=(id:string)=>patch("tasks",plan.tasks.map(t=>t.id===id?{...t,done:!t.done}:t));
 const toggleRun=(id:string)=>patch("runSheet",runSheet.map(r=>r.id===id?{...r,done:!r.done}:r));

 const filteredTasks=plan.tasks.filter(t=>{
  const groupOk=group==="All"||t.group===group;
  const statusOk=taskStatus==="All"||(taskStatus==="Open"?!t.done:t.done);
  const q=taskSearch.trim().toLowerCase();
  const searchOk=!q||[t.task,t.group,t.owner].some(v=>v.toLowerCase().includes(q));
  return groupOk&&statusOk&&searchOk;
 });

 const selectTab=(next:Tab)=>{setTab(next);setMobileNav(false);window.scrollTo({top:0,behavior:"smooth"});};

 const logout=async()=>{
  await fetch("/api/auth/logout",{method:"POST"});
  window.location.href="/login";
 };

 const importGuests=()=>{
  const rows=bulkGuests.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const added=rows.map(line=>{
   const [name="",phone="",adults="2",kids="0",status="No Response",stay="",transport="",notes=""]=line.split(/\t|,/).map(x=>x.trim());
   const allowed=["Yes","No","Maybe","No Response"];
   return {id:uid("g"),name,phone,adults:Number(adults)||0,kids:Number(kids)||0,status:(allowed.includes(status)?status:"No Response") as Guest["status"],stay,transport,notes};
  });
  void save({...plan,guests:[...guests,...added]});setBulkGuests("");setShowBulk(false);
 };

 return <div className="appFrame">
  <aside className={"sidebar "+(mobileNav?"mobileOpen":"")}>
   <div className="sidebarBrand">
    <div className="brandMark">శ్రీ</div>
    <div><b>Shreekari</b><span>Birthday Command Center</span></div>
    <button className="sidebarClose" onClick={()=>setMobileNav(false)} aria-label="Close navigation"><Icon name="close"/></button>
   </div>

   <div className="eventBadge">
    <span>MAIN FUNCTION</span>
    <b>31 October 2026</b>
    <small>Satya Farm House · Peruru</small>
   </div>

   <nav className="sideNav">
    {navGroups.map(section=><div className="navSection" key={section.label}>
      <span className="navLabel">{section.label}</span>
      {section.items.map(([item,icon])=><button key={item} className={tab===item?"active":""} onClick={()=>selectTab(item as Tab)}>
        <Icon name={icon as IconName}/><span>{item==="Dashboard"?"Overview":item}</span>
        {item==="Tasks"&&openTasks>0?<em>{openTasks}</em>:null}
      </button>)}
    </div>)}
   </nav>

   <div className="sidebarFooter">
    <div className="sidebarStatus"><i/><span>Private family workspace</span></div>
    <button className="sideLogout" onClick={logout}><Icon name="logout"/>Sign out</button>
   </div>
  </aside>

  {mobileNav&&<button className="navBackdrop" onClick={()=>setMobileNav(false)} aria-label="Close navigation"/>}

  <div className="mainArea">
   <header className="appHeader">
    <div className="headerLeft">
      <button className="mobileMenu" onClick={()=>setMobileNav(true)} aria-label="Open navigation"><Icon name="menu"/></button>
      <div>
       <span className="headerEyebrow">SHREEKARI · ONE BEAUTIFUL YEAR</span>
       <h1>{pageMeta[tab].title}</h1>
       <p>{pageMeta[tab].description}</p>
      </div>
    </div>
    <div className="headerRight">
      <div className={"syncState "+(saving?"busy":"")}><i/>{saving?"Saving changes":"All changes saved"}</div>
      <div className="headerDate"><span>ACTUAL BIRTHDAY</span><b>29 Oct</b></div>
      <div className="headerDate emphasis"><span>MAIN FUNCTION</span><b>31 Oct</b></div>
    </div>
   </header>

   <main className="contentArea">
    {tab==="Today"&&<section className="pageStack">
     <div className="metricGrid">
      <article className="metricCard accent"><span>Event run sheet</span><strong>{runSheet.length-openToday}<small>/ {runSheet.length}</small></strong><p>{openToday} checkpoints remaining</p><div className="metricProgress"><i style={{width:`${Math.round((runSheet.length-openToday)/Math.max(runSheet.length,1)*100)}%`}}/></div></article>
      <article className="metricCard"><span>Guest response</span><strong>{confirmed||"—"}</strong><p>{maybe} maybe · lunch planning ~180</p></article>
      <article className="metricCard"><span>Preparation</span><strong>{progress}%</strong><p>{openTasks} open of {plan.tasks.length} tasks</p></article>
      <article className="metricCard"><span>Vendor exposure</span><strong>{money(Math.max(0,budget-paid))}</strong><p>{money(paid)} paid / advanced</p></article>
     </div>

     <div className="todayLayout">
      <section className="surface">
       <div className="surfaceHeader">
        <div><span className="sectionKicker">31 OCTOBER · LIVE OPERATIONS</span><h2>Event run sheet</h2></div>
        <div className="surfaceActions"><span className="statusPill">{runSheet.length-openToday} completed</span><button className="ghostButton" onClick={()=>patch("runSheet",defaultRunSheet)}>Reset</button></div>
       </div>
       <div className="runSheet professional">{runSheet.map(r=><article className={"runRow "+(r.done?"done":"")} key={r.id}>
        <button className="runCheck" onClick={()=>toggleRun(r.id)} aria-label={r.done?"Mark incomplete":"Mark complete"}>{r.done?"✓":""}</button>
        <time>{r.time}</time>
        <div className="runContent"><h3>{r.title}</h3><div className="runMeta"><span>{r.owner}</span>{r.notes?<span>{r.notes}</span>:null}</div></div>
       </article>)}</div>
      </section>

      <aside className="todayRail">
       <section className="surface compactSurface">
        <div className="surfaceHeader"><div><span className="sectionKicker">ATTENTION</span><h2>Open priorities</h2></div><button className="textButton" onClick={()=>selectTab("Tasks")}>View all</button></div>
        <div className="priorityList">{plan.tasks.filter(t=>!t.done).slice(0,8).map(t=><label key={t.id}>
          <input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)}/>
          <span><b>{t.task}</b><small>{t.owner} · {df(t.due)}</small></span>
        </label>)}</div>
       </section>

       <section className="surface compactSurface controlRules">
        <div className="surfaceHeader"><div><span className="sectionKicker">OPERATING RULES</span><h2>Event controls</h2></div></div>
        <ol><li><b>Protect Shree’s rest window</b><span>10:15–11:30 · keep sound/games away from Room 1.</span></li><li><b>Use the ASK ME helper</b><span>Small guest requests should not reach Aryan.</span></li><li><b>Kids safety stays staffed</b><span>Pond, well, pool and play areas remain supervised.</span></li><li><b>Family stays out of service work</b><span>Cooking, serving, cleanup and closeout stay delegated.</span></li></ol>
       </section>
      </aside>
     </div>
    </section>}

    {tab==="Dashboard"&&<section className="pageStack">
     <div className="metricGrid">
      <article className="metricCard accent"><span>Overall readiness</span><strong>{progress}%</strong><p>{plan.tasks.filter(t=>t.done).length} of {plan.tasks.length} tasks complete</p><div className="metricProgress"><i style={{width:`${progress}%`}}/></div></article>
      <article className="metricCard"><span>Invited</span><strong>{plan.meta.invitedGuests}</strong><p>{confirmed||0} confirmed so far</p></article>
      <article className="metricCard"><span>Expected attendance</span><strong>{plan.meta.expectedGuests}</strong><p>Main lunch planning: 180</p></article>
      <article className="metricCard"><span>Budget tracked</span><strong>{money(budget)}</strong><p>{money(Math.max(0,budget-paid))} outstanding</p></article>
     </div>

     <section className="surface">
      <div className="surfaceHeader"><div><span className="sectionKicker">EVENT STRUCTURE</span><h2>Key dates & milestones</h2></div></div>
      <div className="milestoneGrid">{plan.days.filter(d=>["2026-10-29","2026-10-30","2026-10-31","2026-11-01"].includes(d.date)).map((d,index)=><article className="milestoneCard" key={d.date}>
       <div className="milestoneTop"><span>{String(index+1).padStart(2,"0")}</span><time>{df(d.date)}</time></div>
       <h3>{d.label}</h3><ul>{d.items.slice(0,4).map(x=><li key={x}>{x}</li>)}</ul>
      </article>)}</div>
     </section>

     <div className="dashboardGrid">
      <section className="surface compactSurface">
       <div className="surfaceHeader"><div><span className="sectionKicker">NEXT ACTIONS</span><h2>Priority task queue</h2></div><button className="textButton" onClick={()=>selectTab("Tasks")}>Manage tasks</button></div>
       <div className="priorityList">{plan.tasks.filter(t=>!t.done).slice(0,10).map(t=><label key={t.id}><input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)}/><span><b>{t.task}</b><small>{t.group} · {t.owner} · {df(t.due)}</small></span></label>)}</div>
      </section>
      <section className="surface compactSurface">
       <div className="surfaceHeader"><div><span className="sectionKicker">WORKING NOTES</span><h2>Coordinator notes</h2></div></div>
       <textarea className="professionalNotes" value={plan.notes||""} placeholder="Capture family, vendor or coordination notes here…" onChange={e=>localPatch("notes",e.target.value)} onBlur={()=>void save(plan)}/>
       <p className="fieldHint">Notes save automatically when you leave this field.</p>
      </section>
     </div>
    </section>}

    {tab==="Timeline"&&<section className="surface">
     <div className="surfaceHeader"><div><span className="sectionKicker">23 OCTOBER → 1 NOVEMBER</span><h2>Master preparation timeline</h2></div></div>
     <div className="timeline professional">{plan.days.map((d,index)=><article className="timelineRow" key={d.date}>
      <div className="timelineRail"><span>{String(index+1).padStart(2,"0")}</span><i/></div>
      <div className="timelineBody"><div className="timelineHeading"><div><time>{df(d.date)}</time><h3>{d.label}</h3></div><span className={"timelineKind "+d.kind}>{d.kind}</span></div><ul>{d.items.map(x=><li key={x}>{x}</li>)}</ul></div>
     </article>)}</div>
    </section>}

    {tab==="Tasks"&&<section className="surface">
     <div className="surfaceHeader responsiveHeader">
      <div><span className="sectionKicker">ACTION TRACKER</span><h2>{filteredTasks.length} tasks shown</h2></div>
      <button className="primaryButton" onClick={()=>patch("tasks",[...plan.tasks,{id:uid("t"),group:"General",task:"New task",owner:"Assign",due:"2026-10-30",done:false}])}>+ Add task</button>
     </div>
     <div className="filterBar">
      <input className="searchInput" value={taskSearch} onChange={e=>setTaskSearch(e.target.value)} placeholder="Search task, owner or group…"/>
      <select value={group} onChange={e=>setGroup(e.target.value)}>{groups.map(g=><option key={g}>{g}</option>)}</select>
      <div className="segmented">{(["Open","All","Done"] as const).map(s=><button key={s} className={taskStatus===s?"active":""} onClick={()=>setTaskStatus(s)}>{s}</button>)}</div>
     </div>
     <div className="taskTableHeader"><span>Status</span><span>Task</span><span>Group</span><span>Owner</span><span>Due</span><span/></div>
     <div className="taskEditList professional">{filteredTasks.map(t=><article className={"taskEdit "+(t.done?"done":"")} key={t.id}>
      <div className="statusCell"><input className="check" type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)}/></div>
      <input className="taskNameInput" value={t.task} onChange={e=>localPatch("tasks",plan.tasks.map(x=>x.id===t.id?{...x,task:e.target.value}:x))} onBlur={()=>void save(plan)}/>
      <input value={t.group} onChange={e=>localPatch("tasks",plan.tasks.map(x=>x.id===t.id?{...x,group:e.target.value}:x))} onBlur={()=>void save(plan)}/>
      <input value={t.owner} onChange={e=>localPatch("tasks",plan.tasks.map(x=>x.id===t.id?{...x,owner:e.target.value}:x))} onBlur={()=>void save(plan)}/>
      <input type="date" value={t.due} onChange={e=>patch("tasks",plan.tasks.map(x=>x.id===t.id?{...x,due:e.target.value}:x))}/>
      <button className="iconDanger" onClick={()=>patch("tasks",plan.tasks.filter(x=>x.id!==t.id))}>×</button>
     </article>)}</div>
    </section>}

    {tab==="Guests"&&<section className="pageStack">
     <div className="metricGrid guestMetrics">
      <article className="metricCard accent"><span>Confirmed people</span><strong>{confirmed}</strong><p>Against expected {plan.meta.expectedGuests}</p></article>
      <article className="metricCard"><span>Families listed</span><strong>{guests.length}</strong><p>{guests.filter(g=>g.status==="No Response").length} awaiting response</p></article>
      <article className="metricCard"><span>Maybe</span><strong>{maybe}</strong><p>People pending decision</p></article>
      <article className="metricCard"><span>Response rate</span><strong>{guests.length?Math.round(guests.filter(g=>g.status!=="No Response").length/guests.length*100):0}%</strong><p>Based on listed family rows</p></article>
     </div>
     <section className="surface">
      <div className="surfaceHeader responsiveHeader"><div><span className="sectionKicker">RSVP & ARRIVAL</span><h2>Guest register</h2></div><div className="surfaceActions"><button className="ghostButton" onClick={()=>setShowBulk(!showBulk)}>Bulk paste</button><button className="primaryButton" onClick={()=>patch("guests",[...guests,{id:uid("g"),name:"",phone:"",adults:2,kids:0,status:"No Response",stay:"",transport:"",notes:""}])}>+ Add family</button></div></div>
      {showBulk&&<div className="bulkPanel"><div><b>Bulk guest import</b><p>One family per line: Name, Phone, Adults, Kids, Status, Stay, Transport, Notes</p></div><textarea value={bulkGuests} onChange={e=>setBulkGuests(e.target.value)} placeholder={"Ravi Family, 9876543210, 2, 1, Yes, Amma house, Pickup road center, Arrives 9:30\nKeerthi, 9876543210, 2, 0, Maybe, , , Return gifts"}/><div className="surfaceActions"><button className="primaryButton" onClick={importGuests}>Import rows</button><button className="ghostButton" onClick={()=>setShowBulk(false)}>Cancel</button></div></div>}
      <div className="dataTableWrap"><table className="proTable"><thead><tr><th>Family / Guest</th><th>Phone</th><th>Adults</th><th>Kids</th><th>RSVP</th><th>Stay</th><th>Transport</th><th>Notes</th><th>Contact</th><th></th></tr></thead><tbody>{guests.map(g=><tr key={g.id}>
       <td><input value={g.name} onChange={e=>localPatch("guests",guests.map(x=>x.id===g.id?{...x,name:e.target.value}:x))} onBlur={()=>void save(plan)} placeholder="Family name"/></td>
       <td><input value={g.phone} onChange={e=>localPatch("guests",guests.map(x=>x.id===g.id?{...x,phone:e.target.value}:x))} onBlur={()=>void save(plan)} placeholder="9876543210"/></td>
       <td><input className="num" type="number" min="0" value={g.adults} onChange={e=>patch("guests",guests.map(x=>x.id===g.id?{...x,adults:+e.target.value}:x))}/></td>
       <td><input className="num" type="number" min="0" value={g.kids} onChange={e=>patch("guests",guests.map(x=>x.id===g.id?{...x,kids:+e.target.value}:x))}/></td>
       <td><select value={g.status} onChange={e=>patch("guests",guests.map(x=>x.id===g.id?{...x,status:e.target.value as Guest["status"]}:x))}><option>Yes</option><option>No</option><option>Maybe</option><option>No Response</option></select></td>
       <td><input value={g.stay} onChange={e=>localPatch("guests",guests.map(x=>x.id===g.id?{...x,stay:e.target.value}:x))} onBlur={()=>void save(plan)} placeholder="Home / hotel"/></td>
       <td><input value={g.transport} onChange={e=>localPatch("guests",guests.map(x=>x.id===g.id?{...x,transport:e.target.value}:x))} onBlur={()=>void save(plan)} placeholder="Pickup / drop"/></td>
       <td><input value={g.notes} onChange={e=>localPatch("guests",guests.map(x=>x.id===g.id?{...x,notes:e.target.value}:x))} onBlur={()=>void save(plan)}/></td>
       <td>{g.phone?<a className="contactButton" href={whatsappUrl(g)} target="_blank" rel="noreferrer">WhatsApp</a>:<span className="emptyText">Add phone</span>}</td>
       <td><button className="iconDanger" onClick={()=>patch("guests",guests.filter(x=>x.id!==g.id))}>×</button></td>
      </tr>)}</tbody></table></div>
     </section>
    </section>}

    {tab==="Vendors & Budget"&&<section className="pageStack">
     <div className="metricGrid budgetMetrics">
      <article className="metricCard accent"><span>Planned budget</span><strong>{money(budget)}</strong><p>{vendors.length} vendor categories tracked</p></article>
      <article className="metricCard"><span>Paid / advanced</span><strong>{money(paid)}</strong><p>Committed so far</p></article>
      <article className="metricCard"><span>Outstanding</span><strong>{money(Math.max(0,budget-paid))}</strong><p>Balance before closeout</p></article>
      <article className="metricCard"><span>Booked / settled</span><strong>{vendors.filter(v=>["Booked","Part paid","Settled"].includes(v.status)).length}</strong><p>Of {vendors.length} vendor lines</p></article>
     </div>
     <section className="surface">
      <div className="surfaceHeader responsiveHeader"><div><span className="sectionKicker">COMMERCIAL CONTROL</span><h2>Vendor register & settlements</h2></div><button className="primaryButton" onClick={()=>patch("vendors",[...vendors,{id:uid("v"),category:"",vendor:"",contact:"",budget:0,advance:0,finalPaid:0,status:"To contact",notes:""}])}>+ Add vendor</button></div>
      <div className="dataTableWrap"><table className="proTable"><thead><tr><th>Category</th><th>Vendor</th><th>Contact</th><th>Budget</th><th>Advance</th><th>Final Paid</th><th>Balance</th><th>Status</th><th>Notes</th><th></th></tr></thead><tbody>{vendors.map(v=>{const bal=Math.max(0,(v.budget||0)-(v.advance||0)-(v.finalPaid||0));return <tr key={v.id}>
       <td><input value={v.category} onChange={e=>localPatch("vendors",vendors.map(x=>x.id===v.id?{...x,category:e.target.value}:x))} onBlur={()=>void save(plan)}/></td>
       <td><input value={v.vendor} onChange={e=>localPatch("vendors",vendors.map(x=>x.id===v.id?{...x,vendor:e.target.value}:x))} onBlur={()=>void save(plan)} placeholder="Vendor name"/></td>
       <td><input value={v.contact} onChange={e=>localPatch("vendors",vendors.map(x=>x.id===v.id?{...x,contact:e.target.value}:x))} onBlur={()=>void save(plan)} placeholder="Phone"/></td>
       <td><input className="moneyField" type="number" value={v.budget} onChange={e=>patch("vendors",vendors.map(x=>x.id===v.id?{...x,budget:+e.target.value}:x))}/></td>
       <td><input className="moneyField" type="number" value={v.advance} onChange={e=>patch("vendors",vendors.map(x=>x.id===v.id?{...x,advance:+e.target.value}:x))}/></td>
       <td><input className="moneyField" type="number" value={v.finalPaid} onChange={e=>patch("vendors",vendors.map(x=>x.id===v.id?{...x,finalPaid:+e.target.value}:x))}/></td>
       <td><div className="balanceCell"><b>{money(bal)}</b>{bal>0?<button onClick={()=>patch("vendors",vendors.map(x=>x.id===v.id?{...x,finalPaid:(x.finalPaid||0)+bal,status:"Settled"}:x))}>Settle</button>:<span>Settled</span>}</div></td>
       <td><select value={v.status} onChange={e=>patch("vendors",vendors.map(x=>x.id===v.id?{...x,status:e.target.value}:x))}><option>To contact</option><option>Shortlisted</option><option>Booked</option><option>Part paid</option><option>Settled</option><option>Cancelled</option></select></td>
       <td><input value={v.notes} onChange={e=>localPatch("vendors",vendors.map(x=>x.id===v.id?{...x,notes:e.target.value}:x))} onBlur={()=>void save(plan)}/></td>
       <td><button className="iconDanger" onClick={()=>patch("vendors",vendors.filter(x=>x.id!==v.id))}>×</button></td>
      </tr>})}</tbody></table></div>
     </section>
    </section>}

    {tab==="Catering"&&<section className="surface">
     <div className="surfaceHeader"><div><span className="sectionKicker">FOOD & HOSPITALITY</span><h2>Service plan</h2></div></div>
     <div className="cateringGrid">{plan.catering.map((c,i)=><article className="cateringCard" key={c.session}>
      <div><span>SESSION</span><h3>{c.session}</h3></div>
      <label><span>Headcount</span><input value={c.count} onChange={e=>localPatch("catering",plan.catering.map((x,j)=>j===i?{...x,count:e.target.value}:x))} onBlur={()=>void save(plan)}/></label>
      <label><span>Status</span><select value={c.status} onChange={e=>patch("catering",plan.catering.map((x,j)=>j===i?{...x,status:e.target.value}:x))}><option>planned</option><option>confirmed</option><option>done</option></select></label>
     </article>)}</div>
     <div className="noticeBar"><b>Service principle</b><span>No close family member handles cooking, frying, serving or cleanup during the 31 Oct evening. Vendors and helpers own the food operation.</span></div>
    </section>}

    {tab==="Rooms & Staff"&&<section className="pageStack">
     <section className="surface">
      <div className="surfaceHeader"><div><span className="sectionKicker">VENUE ZONING</span><h2>Room allocation</h2></div><span className="statusPill">4 AC rooms</span></div>
      <div className="roomGrid">{plan.rooms.map(r=><article className="roomCard" key={r.room}><span>{r.room}</span><h3>{r.title}</h3><p>{r.use}</p></article>)}</div>
     </section>
     <section className="surface">
      <div className="surfaceHeader"><div><span className="sectionKicker">RESPONSIBILITY MATRIX</span><h2>People & operational roles</h2></div></div>
      <div className="staffGrid">{plan.staff.map(s=><article className="staffCard" key={s.role}><span>{s.role}</span><h3>{s.owner}</h3><p>{s.notes}</p></article>)}</div>
     </section>
    </section>}

    {tab==="Printables"&&<section className="pageStack printArea">
     <section className="surface noPrint">
      <div className="surfaceHeader responsiveHeader"><div><span className="sectionKicker">VENUE PRINT PACK</span><h2>Operational notices</h2><p>Print only the pages you need and place them at the relevant venue points.</p></div><button className="primaryButton" onClick={()=>window.print()}>Print pack</button></div>
     </section>
     {plan.rooms.map(r=><article className="poster professionalPoster" key={r.room}><div className="posterMark">శ్రీ</div><span>{r.room}</span><h2>{r.title}</h2><p>{r.use}</p></article>)}
     <article className="poster professionalPoster"><div className="posterMark">శ్రీ</div><span>GUEST SUPPORT</span><h2>NEED HELP? ASK ME</h2><p>For directions, water, washrooms, charging, first aid, transport or any guest need, please contact the team member wearing the ASK ME badge.</p></article>
     <article className="poster professionalPoster"><div className="posterMark">శ్రీ</div><span>SAFETY NOTICE</span><h2>CHILDREN MUST BE SUPERVISED</h2><p>Pond • Well • Kids Pool • Tree House • Zip / Play Areas</p></article>
     <article className="poster professionalPoster"><div className="posterMark">శ్రీ</div><span>GUEST UTILITY</span><h2>MOBILE CHARGING STATION</h2><p>Please keep your phone with you and use the charging rack responsibly.</p></article>
     <article className="poster professionalPoster"><div className="posterMark">శ్రీ</div><span>GUEST COMFORT</span><h2>COMFORT CORNER</h2><p>Odomos • Tissues • Sanitizer • Shawls • Basic essentials available</p></article>
    </section>}
   </main>
  </div>
 </div>;
}
