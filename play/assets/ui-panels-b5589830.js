function p(o){return`./${o.startsWith("/")?o.slice(1):o}`}const u={common:"#cad5e5",uncommon:"#54d28c",rare:"#5c8fff",epic:"#cc78f0",legendary:"#f6bc49"};function v(o){return Object.entries(o).filter(n=>typeof n[1]=="number"&&n[1]!==0).map(([n,a])=>`${n} +${a}`).join(" • ")||"No modifiers"}function m(o,n,a){o.innerHTML="";const i=document.createElement("div");i.className="inventory-shell";const s=document.createElement("div");s.className="inventory-column",s.innerHTML=`
    <div class="panel-title"><img src="${p("squarelogo.PNG")}" alt="Inventory" /> Inventory</div>
    <div class="inventory-grid"></div>
  `;const c=s.querySelector(".inventory-grid");n.items.forEach(e=>{const t=document.createElement("button");t.type="button",t.className="inventory-card",t.style.borderColor=u[e.rarity]??u.common;const d=e.type==="consumable"?"Use":e.type==="weapon"||e.type==="armor"||e.type==="relic"?"Equip":"Inspect";t.innerHTML=`
      <div class="inventory-card__name">${e.name}</div>
      <div class="inventory-card__meta">${e.type} • ${e.rarity}</div>
      <div class="inventory-card__stats">${v(e.stats)}</div>
      <div class="inventory-card__desc">${e.description}</div>
      <span class="inventory-card__action">${d}</span>
    `,e.type==="consumable"?t.addEventListener("click",()=>a.onConsume(e.id)):(e.type==="weapon"||e.type==="armor"||e.type==="relic")&&t.addEventListener("click",()=>a.onEquip(e.id)),c.appendChild(t)}),n.items.length===0&&(c.innerHTML='<div class="inventory-empty">No items carried.</div>');const r=document.createElement("div");r.className="inventory-column inventory-column--narrow",r.innerHTML=`
    <div class="panel-title"><img src="${p("logo.PNG")}" alt="Loadout" /> Loadout</div>
    <div class="equipment-list"></div>
    <div class="panel-title panel-title--spaced">Stats</div>
    <div class="stats-card">
      <div>Attack <strong>${n.stats.attack}</strong></div>
      <div>Defense <strong>${n.stats.defense}</strong></div>
      <div>Max Health <strong>${n.stats.maxHealth}</strong></div>
      <div>Max Mana <strong>${n.stats.maxMana}</strong></div>
      <div>Speed <strong>${n.stats.speed}</strong></div>
    </div>
  `;const l=r.querySelector(".equipment-list");n.equipment.forEach(e=>{var d;const t=document.createElement("button");t.type="button",t.className="equipment-row",t.innerHTML=`
      <span class="equipment-row__slot">${e.slot}</span>
      <span class="equipment-row__item">${((d=e.item)==null?void 0:d.name)??"Empty"}</span>
    `,e.item?t.addEventListener("click",()=>a.onUnequip(e.slot)):t.disabled=!0,l.appendChild(t)}),i.appendChild(s),i.appendChild(r),o.appendChild(i)}const g=Object.freeze(Object.defineProperty({__proto__:null,renderInventoryPanel:m},Symbol.toStringTag,{value:"Module"}));function y(o,n,a,i){o.innerHTML="";const s=document.createElement("div");s.className="dialogue-shell";const c=n.options.length>0?n.options:[{id:"__close__",text:"Continue"}];s.innerHTML=`
    <div class="dialogue-header">
      <img src="${p("squarelogo.PNG")}" alt="Dialogue" />
      <span>${n.name}</span>
      <button type="button" class="dialogue-close">Close</button>
    </div>
    <div class="dialogue-body">${n.text}</div>
    <div class="dialogue-options"></div>
  `;const r=s.querySelector(".dialogue-options");c.forEach(l=>{const e=document.createElement("button");e.type="button",e.className="dialogue-option",e.textContent=l.text,e.addEventListener("click",()=>{if(l.id==="__close__"){i();return}a(l.id)}),r.appendChild(e)}),s.querySelector(".dialogue-close").addEventListener("click",i),o.appendChild(s)}const _=Object.freeze(Object.defineProperty({__proto__:null,renderDialoguePanel:y},Symbol.toStringTag,{value:"Module"}));export{p as a,_ as b,g as r};
