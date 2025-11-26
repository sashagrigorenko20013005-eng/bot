import { router } from './router.js';
import * as UI from './components.js';

/* Simple mock DB using localStorage for demo */
const DB = {
  seed() {
    if (!localStorage.getItem('spa_seed')) {
      const services = [
        {id:'svc-1', name:'Мужская стрижка', desc:'Классическая стрижка', duration:45, price:20.00, parallel_group:1},
        {id:'svc-2', name:'Окрашивание', desc:'Полное окрашивание волос', duration:120, price:80.00, parallel_group:1},
        {id:'svc-3', name:'Маникюр классический', desc:'Маникюр + покрытие', duration:60, price:35.00, parallel_group:3},
        {id:'svc-4', name:'Педикюр', desc:'Педикюр', duration:60, price:40.00, parallel_group:3},
        {id:'svc-5', name:'Шугаринг (ноги)', desc:'Депиляция', duration:45, price:30.00, parallel_group:4}
      ];
      const masters = [
        {id:'m-1', name:'Алексей', bio:'Мастер с 10-летним стажем', rating:4.8},
        {id:'m-2', name:'Мария', bio:'Ногтевой сервис', rating:4.6},
        {id:'m-3', name:'Ольга', bio:'Колорист', rating:4.9}
      ];
      const templates = [
        {id:'t-1', master_id:'m-1', weekday:1, start:'10:00', end:'18:00', slot_interval:30},
        {id:'t-2', master_id:'m-2', weekday:1, start:'09:00', end:'17:00', slot_interval:30},
        {id:'t-3', master_id:'m-3', weekday:1, start:'11:00', end:'19:00', slot_interval:30}
      ];
      const users = [{id:'u-1', name:'Елена', telegram_id:null, cancel_count:0}];
      localStorage.setItem('services', JSON.stringify(services));
      localStorage.setItem('masters', JSON.stringify(masters));
      localStorage.setItem('work_templates', JSON.stringify(templates));
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('appointments', JSON.stringify([]));
      localStorage.setItem('messages', JSON.stringify([]));
      localStorage.setItem('spa_seed', '1');
    }
  },
  get(k){ return JSON.parse(localStorage.getItem(k) || '[]')},
  put(k,v){ localStorage.setItem(k, JSON.stringify(v))}
};

/* Application state */
const state = { userId:'u-1', selectedService:null, selectedMaster:null, selectedDate:null, selectedSlot:null };

/* Utils */
function el(id){ return document.getElementById(id) }
function navigate(path){ router.navigate(path) }

/* Screens */
function Home() {
  const view = document.getElementById('view');
  view.innerHTML = `
    <div class="card"><h1>Онлайн-запись</h1><p class="muted">Выбирайте услугу и удобное время</p></div>
    <div id="servicesList"></div>
  `;
  const services = DB.get('services');
  const tpl = document.getElementById('tpl-service-card');
  const list = view.querySelector('#servicesList');
  services.forEach(s=>{
    const item = tpl.content.cloneNode(true);
    item.querySelector('.service-name').textContent = s.name;
    item.querySelector('.service-desc').textContent = s.desc;
    item.querySelector('.service-price').textContent = s.price + '€';
    const btn = item.querySelector('.choose');
    btn.addEventListener('click', ()=>{ state.selectedService = s; navigate('#/service/'+s.id) });
    list.appendChild(item);
  });
}

function ServiceDetails(params){
  const id = params.id;
  const service = DB.get('services').find(s=>s.id===id);
  const view = el('view');
  view.innerHTML = `
    <div class="card"><h2>${service.name}</h2><p class="muted">${service.desc}</p>
      <div class="row" style="margin-top:12px">
        <div class="col"><div class="muted">Длительность</div><div>${service.duration} мин</div></div>
        <div class="col right"><div class="muted">Цена</div><div class="service-price">${service.price}€</div></div>
      </div>
    </div>
    <div class="card"><h3>Выберите мастера</h3><div id="masterList"></div></div>
  `;
  const masters = DB.get('masters');
  const list = document.getElementById('masterList');
  masters.forEach(m=>{
    const node = document.createElement('div');
    node.className = 'card';
    node.innerHTML = `<div class="row"><div class="col"><strong>${m.name}</strong><div class="muted">${m.bio}</div></div><div class="col right"><div>${m.rating}★</div><button class="btn small">Выбрать</button></div></div>`;
    node.querySelector('.btn').addEventListener('click', ()=>{ state.selectedMaster = m; navigate('#/calendar') });
    list.appendChild(node);
  });
}

function CalendarScreen(){
  const view = el('view');
  view.innerHTML = `<div class="card"><h2>Выберите дату</h2><div id="dateList" class="slots"></div></div><div id="slotsWrap"></div>`;
  const dl = document.getElementById('dateList');
  for(let i=0;i<14;i++){
    const d = new Date(); d.setDate(d.getDate()+i);
    const btn = document.createElement('button'); btn.className='slot'; btn.textContent = d.toLocaleDateString(); btn.dataset.iso = d.toISOString();
    btn.addEventListener('click', ()=>{ state.selectedDate = btn.dataset.iso; renderSlots(); });
    dl.appendChild(btn);
  }
  function renderSlots(){
    const wrap = document.getElementById('slotsWrap');
    wrap.innerHTML = `<div class="card"><h3>Слоты для ${new Date(state.selectedDate).toLocaleDateString()}</h3><div id="slots" class="slots"></div></div>`;
    const slots = document.getElementById('slots');
    // find template for master weekday
    const tpl = DB.get('work_templates').find(t=> t.master_id===state.selectedMaster.id && t.weekday=== (new Date(state.selectedDate).getDay()===0?7:new Date(state.selectedDate).getDay()));
    if(!tpl){ slots.innerHTML = '<div class="muted">Мастер не работает в этот день</div>'; return; }
    const [h1,m1] = tpl.start.split(':').map(Number); const [h2,m2] = tpl.end.split(':').map(Number);
    const start = new Date(state.selectedDate); start.setHours(h1,m1,0,0); const end = new Date(state.selectedDate); end.setHours(h2,m2,0,0);
    const interval = tpl.slot_interval;
    const appointments = DB.get('appointments');
    for(let t = start.getTime(); t + state.selectedService.duration*60000 <= end.getTime(); t += interval*60000){
      const s = new Date(t);
      const overlapping = appointments.find(a=> a.master_id===state.selectedMaster.id && a.status==='active' && ((new Date(a.start_datetime).getTime() < s.getTime() + state.selectedService.duration*60000) && (new Date(a.end_datetime).getTime() > s.getTime())));
      const b = document.createElement('button'); b.className='slot' + (overlapping? ' disabled':'');
      b.textContent = s.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      if(!overlapping){ b.addEventListener('click', ()=>{ state.selectedSlot = s.toISOString(); confirmBooking(); }); }
      slots.appendChild(b);
    }
  }
}

function confirmBooking(){
  const appointments = DB.get('appointments');
  const sStart = new Date(state.selectedSlot).getTime();
  const sEnd = sStart + state.selectedService.duration*60000;
  const conflict = appointments.find(a=> a.master_id===state.selectedMaster.id && a.status==='active' && ((new Date(a.start_datetime).getTime() < sEnd) && (new Date(a.end_datetime).getTime() > sStart)));
  if(conflict){ alert('Слот уже занят'); return; }
  const newA = { id: 'a-' + Date.now(), user_id: state.userId, master_id: state.selectedMaster.id, service_id: state.selectedService.id, start_datetime: new Date(state.selectedSlot).toISOString(), end_datetime: new Date(sEnd).toISOString(), status:'active', created_at:new Date().toISOString() };
  appointments.push(newA); DB.put('appointments', appointments);
  alert('Запись создана');
  router.navigate('#/bookings');
}

function BookingsScreen(){
  const view = el('view');
  view.innerHTML = '<div class="card"><h2>Мои записи</h2><div id="bookList"></div></div>';
  const list = document.getElementById('bookList');
  const apps = DB.get('appointments').filter(a=> a.user_id===state.userId);
  if(apps.length===0) return list.innerHTML = '<div class="muted">У вас нет записей</div>';
  apps.forEach(a=>{
    const svc = DB.get('services').find(s=>s.id===a.service_id);
    const m = DB.get('masters').find(x=>x.id===a.master_id);
    const elCard = document.createElement('div'); elCard.className='card';
    elCard.innerHTML = `<div class="row"><div class="col"><strong>${svc.name}</strong><div class="muted">${new Date(a.start_datetime).toLocaleString()} • ${m.name}</div></div><div class="col right"><button class="btn small ghost" data-id="${a.id}">Отменить</button></div></div>`;
    list.appendChild(elCard);
  });
  document.querySelectorAll('.ghost').forEach(b=> b.addEventListener('click', (e)=>{ const id=e.target.dataset.id; cancelBooking(id); }));
}

function cancelBooking(id){
  const apps = DB.get('appointments');
  const idx = apps.findIndex(a=>a.id===id); if(idx===-1) return;
  apps[idx].status='cancelled'; DB.put('appointments', apps);
  // increase cancel count
  const users = DB.get('users'); const u = users.find(x=>x.id===state.userId); u.cancel_count = (u.cancel_count||0)+1; DB.put('users', users);
  alert('Запись отменена');
  BookingsScreen();
}

function ChatScreen(){
  const view = el('view');
  view.innerHTML = '<div class="card"><h2>Чат с админом</h2><p class="muted">Чат открыт в боте (демо)</p></div>';
}

/* Router registration */
router.on('#/', Home);
router.on('#/service/:id', ServiceDetails);
router.on('#/calendar', CalendarScreen);
router.on('#/bookings', BookingsScreen);
router.on('#/chat', ChatScreen);

/* Nav handlers */
document.addEventListener('click', (e)=>{
  const nb = e.target.closest('[data-route]');
  if(nb){ e.preventDefault(); const route = nb.dataset.route; document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active')); nb.classList.add('active'); router.navigate(route); }
});

// profile/back buttons
document.getElementById('btnProfile').addEventListener('click', ()=> router.navigate('#/bookings'));
document.getElementById('btnBack').addEventListener('click', ()=> history.back());

/* Init */
DB.seed();
router.start();

// simple exposure for debugging
window.__DB = DB;
