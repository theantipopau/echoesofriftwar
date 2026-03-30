function v(i){return`./${i.startsWith("/")?i.slice(1):i}`}const u={common:"#cad5e5",uncommon:"#54d28c",rare:"#5c8fff",epic:"#cc78f0",legendary:"#f6bc49"};function m(i){return Object.entries(i).filter(t=>typeof t[1]=="number"&&t[1]!==0).map(([t,o])=>`${t} +${o}`).join(" • ")||"No modifiers"}function g(i,t,o){i.innerHTML="";const r=document.createElement("div");r.className="inventory-shell";const a=document.createElement("div");a.className="inventory-column",a.innerHTML=`
    <div class="panel-title"><img src="${v("squarelogo.PNG")}" alt="Inventory" /> Inventory</div>
    <div class="inventory-grid"></div>
  `;const c=a.querySelector(".inventory-grid");t.items.forEach(e=>{const n=document.createElement("button");n.type="button",n.className="inventory-card",n.style.borderColor=u[e.rarity]??u.common;const l=e.type==="consumable"?"Use":e.type==="weapon"||e.type==="armor"||e.type==="relic"?"Equip":"Inspect";n.innerHTML=`
      <div class="inventory-card__name">${e.name}</div>
      <div class="inventory-card__meta">${e.type} • ${e.rarity}</div>
      <div class="inventory-card__stats">${m(e.stats)}</div>
      <div class="inventory-card__desc">${e.description}</div>
      <span class="inventory-card__action">${l}</span>
    `,e.type==="consumable"?n.addEventListener("click",()=>o.onConsume(e.id)):(e.type==="weapon"||e.type==="armor"||e.type==="relic")&&n.addEventListener("click",()=>o.onEquip(e.id)),c.appendChild(n)}),t.items.length===0&&(c.innerHTML='<div class="inventory-empty">No items carried.</div>');const s=document.createElement("div");s.className="inventory-column inventory-column--narrow",s.innerHTML=`
    <div class="panel-title"><img src="${v("logo.PNG")}" alt="Loadout" /> Loadout</div>
    <div class="equipment-list"></div>
    <div class="panel-title panel-title--spaced">Stats</div>
    <div class="stats-card">
      <div>Attack <strong>${t.stats.attack}</strong></div>
      <div>Defense <strong>${t.stats.defense}</strong></div>
      <div>Max Health <strong>${t.stats.maxHealth}</strong></div>
      <div>Max Mana <strong>${t.stats.maxMana}</strong></div>
      <div>Speed <strong>${t.stats.speed}</strong></div>
    </div>
  `;const d=s.querySelector(".equipment-list");t.equipment.forEach(e=>{var l;const n=document.createElement("button");n.type="button",n.className="equipment-row",n.innerHTML=`
      <span class="equipment-row__slot">${e.slot}</span>
      <span class="equipment-row__item">${((l=e.item)==null?void 0:l.name)??"Empty"}</span>
    `,e.item?n.addEventListener("click",()=>o.onUnequip(e.slot)):n.disabled=!0,d.appendChild(n)}),r.appendChild(a),r.appendChild(s),i.appendChild(r)}const f=Object.freeze(Object.defineProperty({__proto__:null,renderInventoryPanel:g},Symbol.toStringTag,{value:"Module"})),p={portraits_guard:"art/portraits/warriorknight_npc.PNG",portraits_generic:"art/portraits/female_npc.PNG",portraits_mage:"art/portraits/elf_mage_npc.PNG",portraits_thief:"art/portraits/hoodedthief_npc.PNG",portraits_elder:"art/portraits/oldman_reading_npc.PNG",portraits_goblin:"art/portraits/golbin_npc.PNG"};function _(i){const t=i?p[i]??p.portraits_generic:p.portraits_generic;return v(t)}function y(i,t,o,r){i.innerHTML="";const a=document.createElement("div");a.className="dialogue-shell";const c=t.options.length>0?t.options:[{id:"__close__",text:"Continue"}],s=_(t.portraitKey);a.innerHTML=`
    <div class="dialogue-header">
      <div class="dialogue-portrait-frame">
        <img class="dialogue-portrait" src="${s}" alt="${t.name}" />
      </div>
      <div class="dialogue-header-info">
        <div class="dialogue-npc-name">${t.name}</div>
        <div class="dialogue-npc-title">Resident of the Riftwar</div>
      </div>
      <button type="button" class="dialogue-close" aria-label="Close dialogue">✕</button>
    </div>
    <div class="dialogue-body">${t.text}</div>
    <div class="dialogue-options"></div>
  `;const d=a.querySelector(".dialogue-options");c.forEach(e=>{const n=document.createElement("button");n.type="button",n.className="dialogue-option",n.textContent=e.text,n.addEventListener("click",()=>{if(e.id==="__close__"){r();return}o(e.id)}),d.appendChild(n)}),a.querySelector(".dialogue-close").addEventListener("click",r),i.appendChild(a)}const b=Object.freeze(Object.defineProperty({__proto__:null,renderDialoguePanel:y},Symbol.toStringTag,{value:"Module"}));export{v as a,b,f as r};
