import '../styles/pawaCoach.css';
import { store } from '../utils/store.js';
import { buildCoachReply, analyzePawaCoach } from '../data/pawaCoach.js';
import { icons } from '../utils/icons.js';

export function PawaCoach() {
 const root=document.createElement('section'); root.className='pawa-coach-card';
 let messages=[];
 const context=store.getCoachContext ? store.getCoachContext() : {...store.get(), analytics:store.getPawaAnalytics()};
 const analysis=analyzePawaCoach(context);
 root.innerHTML=`<div class="pawa-coach-head"><div><span class="pawa-coach-status">● OFFLINE</span><h2>Pawa Coach</h2><p>Coach personnel basé sur tes données locales.</p></div><div class="pawa-coach-orb">${icons.mind||'🧠'}</div></div><div class="pawa-coach-snapshot"><b>Priorité : ${analysis.knowledge.title}</b><span>${analysis.reason}</span><div class="pawa-coach-metrics"><span>XP aujourd’hui <b>${analysis.todayXp}</b></span><span>Preuves <b>${analysis.evidenceCount}</b></span></div></div><div class="pawa-coach-messages" aria-live="polite"></div><div class="pawa-coach-actions"><button data-q="Résume ma journée">Journée</button><button data-q="Sur quoi progresser ?">Priorité</button><button data-q="Donne-moi une mission">Mission</button><button data-q="Comment rester calme face à une provocation ?">Calme</button></div><form class="pawa-coach-form"><input class="form-input" placeholder="Parle au Coach…"/><button class="btn-primary" type="submit">${icons.chevronRight}</button></form>`;
 const box=root.querySelector('.pawa-coach-messages');
 const escapeHtml=(value)=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
 const render=()=>{box.innerHTML=messages.map(m=>`<div class="pawa-msg pawa-msg--${m.role}">${escapeHtml(m.text).replace(/\n/g,'<br>')}</div>`).join(''); box.scrollTop=box.scrollHeight;};
 const send=(q)=>{if(!q.trim())return; messages.push({role:'user',text:q}); messages.push({role:'coach',text:buildCoachReply(q,store.getCoachContext ? store.getCoachContext() : {...store.get(), analytics:store.getPawaAnalytics()})}); render();};
 root.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>send(b.dataset.q)));
 root.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const i=root.querySelector('input');send(i.value);i.value='';});
 return root;
}
