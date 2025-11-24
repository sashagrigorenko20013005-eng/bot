/* MiniApp client prototype (no backend) */
/* Data is stored in localStorage as mock DB. Code structured for later backend integration. */

const DB = {
  seed() {
    if (!localStorage.getItem('miniapp_seed')) {
      // basic seed data
      const services = [
        {id: uuid(), name: 'Мужская стрижка', desc: 'Классическая стрижка', duration: 45, price: 20.00, parallel_group:1, category:'hair'},
        {id: uuid(), name: 'Окрашивание', desc: 'Полное окрашивание волос', duration: 120, price: 80.00, parallel_group:1, category:'hair'},
        {id: uuid(), name: 'Маникюр классический', desc: 'Маникюр + покрытие', duration: 60, price: 35.00, parallel_group:3, category:'nails'},
        {id: uuid(), name: 'Педикюр', desc: 'Педикюр', duration: 60, price: 40.00, parallel_group:3, category:'nails'},
        {id: uuid(), name: 'Шугаринг (ноги)', desc: 'Депиляция', duration: 45, price: 30.00, parallel_group:4, category:'beauty'}
      ];

      const masters = [
        {id: uuid(), name: 'Алексей', bio: 'Мастер с 10-летним опытом', rating_avg:4.8, rating_count:45, is_active:true, telegram_id:null},
        {id: uuid(), name: 'Мария', bio: 'Ногтевой сервис, покрытие', rating_avg:4.6, rating_count:30, is_active:true, telegram_id:null},
        {id: uuid(), name: 'Ольга', bio: 'Опытный колорист', rating_avg:4.9, rating_count:80, is_active:true, telegram_id:null}
      ];

      const master_services = [
        {id: uuid(), master_id: masters[0].id, service_id: services[0].id, price:18.00, duration:45},
        {id: uuid(), master_id: masters[2].id, service_id: services[1].id, price:85.00, duration:130},
        {id: uuid(), master_id: masters[1].id, service_id: services[2].id, price:35.00, duration:60},
        {id: uuid(), master_id: masters[1].id, service_id: services[3].id, price:40.00, duration:60}
      ];

      const promotions = [
        {id: uuid(), name:'Весенняя скидка на маникюр', start: daysFromNow(-2), end: daysFromNow(10), is_active:true, services: [services[2].id], promo_price:25.00}
      ];

      const work_templates = [
        {id: uuid(), master_id: masters[0].id, weekday:1, start:'10:00', end:'18:00', slot_interval:30},
        {id: uuid(), master_id: masters[0].id, weekday:2, start:'10:00', end:'18:00', slot_interval:30},
        {id: uuid(), master_id: masters[0].id, weekday:3, start:'10:00', end:'18:00', slot_interval:30},
        {id: uuid(), master_id: masters[1].id, weekday:1, start:'09:00', end:'17:00', slot_interval:30},
        {id: uuid(), master_id: masters[2].id, weekday:1, start:'11:00', end:'19:00', slot_interval:30},
      ];

      const users = [
        {id: uuid(), telegram_id: null, name:'Елена', phone:'+371...', email:null, visit_status:null, cancel_count:0}
      ];

      const appointments = []; // empty initially
      const messages = [];

      localStorage.setItem('services', JSON.stringify(services));
      localStorage.setItem('masters', JSON.stringify(masters));
      localStorage.setItem('master_services', JSON.stringify(master_services));
      localStorage.setItem('promotions', JSON.stringify(promotions));
      localStorage.setItem('work_templates', JSON.stringify(work_templates));
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('appointments', JSON.stringify(appointments));
      localStorage.setItem('messages', JSON.stringify(messages));

      localStorage.setItem('miniapp_seed', '1');
    }
  },

  get(key){ return JSON.parse(localStorage.getItem(key) || '[]')},
  put(key, val){ localStorage.setItem(key, JSON.stringify(val))}
}

/* Utilities */
function uuid(){ return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c=>{let r=Math.random()*16|0,v=c=='x'?r:(r&0x3|0x8);return v.toString(16)});}
function daysFromNow(n){ const d = new Date(); d.setDate(d.getDate()+n); d.setHours(0,0,0,0); return d.toISOString(); }

const state = { selectedService:null, selectedMaster:null, selectedDate:null, selectedSlot:null, currentUserId:null }

document.addEventListener('DOMContentLoaded', ()=>{ DB.seed(); initDemoUser(); renderServices(); renderPromotions(); renderMyBookings(); bindSearch(); document.getElementById('profileBtn').addEventListener('click', openProfileModal); });
function initDemoUser(){ const users = DB.get('users'); state.currentUserId = users[0].id; }
function renderServices(filter=''){ const services = DB.get('services'); const container = document.getElementById('servicesList'); container.innerHTML = ''; services.filter(s=> (s.name+ ' ' + (s.description||'')).toLowerCase().includes(filter.toLowerCase())).forEach(s=>{ const el = document.createElement('div'); el.className = 'services-list-item'; el.innerHTML = `<div><div class="service-title">${s.name}</div><div class="service-meta">${s.duration} min · ${s.price ? s.price+'€' : ''}</div></div><div><button data-id="${s.id}" class="btn-choose">Выбрать</button></div>`; container.appendChild(el); }); document.querySelectorAll('.btn-choose').forEach(b=>b.addEventListener('click', onChooseService)); }
function renderPromotions(){ const promos = DB.get('promotions'); const container = document.getElementById('promoList'); container.innerHTML=''; promos.forEach(p=>{ const el = document.createElement('div'); el.className = 'promo-item'; el.innerHTML = `<strong>${p.name}</strong><div class="muted">Действует до ${new Date(p.end).toLocaleDateString()}</div>`; container.appendChild(el); }); }
function bindSearch(){ const input = document.getElementById('searchInput'); input.addEventListener('input', ()=> renderServices(input.value)); }
function onChooseService(e){ const id = e.target.dataset.id; const services = DB.get('services'); state.selectedService = services.find(s=>s.id===id); openBookingPanel(); }
function openBookingPanel(){ const panel = document.getElementById('panelContent'); panel.innerHTML = ''; const s = state.selectedService; const html = `
    <h3>${s.name}</h3>
    <p class="muted">${s.desc || ''}</p>
    <div class="muted">Длительность: ${s.duration} мин • Базовая цена: ${s.price}€</div>
    <div class="master-list" id="masterList"></div>
    <div id="datePicker" style="margin-top:12px"></div>
    <div id="slotsContainer"></div>
    <div style="margin-top:12px"><button id="confirmBtn" class="primary" disabled>Подтвердить запись</button></div>
  `; panel.insertAdjacentHTML('beforeend', html); renderMasterList(); renderDatePicker(); document.getElementById('confirmBtn').addEventListener('click', confirmBooking); }
function renderMasterList(){ const masters = DB.get('masters'); const masterServices = DB.get('master_services'); const container = document.getElementById('masterList'); container.innerHTML=''; masters.forEach(m=>{ const ms = masterServices.find(x=>x.master_id===m.id && x.service_id===state.selectedService.id); if(ms || true){ const el = document.createElement('div'); el.className = 'master-chip'; el.dataset.id = m.id; el.innerHTML = `<div><strong>${m.name}</strong><div class="muted">${m.bio}</div></div><div>${m.rating_avg || ''}★</div>`; el.addEventListener('click', ()=>{ document.querySelectorAll('.master-chip').forEach(c=>c.classList.remove('active')); el.classList.add('active'); state.selectedMaster = m; renderSlotsForMaster(m); }); container.appendChild(el); } }); }
function renderDatePicker(){ const dp = document.getElementById('datePicker'); dp.innerHTML = '<div class="muted">Выберите дату:</div>'; const days = document.createElement('div'); days.style.display='flex'; days.style.gap='8px'; days.style.marginTop='8px'; days.style.flexWrap='wrap'; for(let i=0;i<14;i++){ const d = new Date(); d.setDate(d.getDate()+i); const btn = document.createElement('button'); btn.className='slot'; btn.textContent = d.toLocaleDateString(); btn.dataset.iso = d.toISOString(); btn.addEventListener('click', ()=>{ document.querySelectorAll('#datePicker .slot').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); state.selectedDate = btn.dataset.iso; if(state.selectedMaster) renderSlotsForMaster(state.selectedMaster); }); days.appendChild(btn); } dp.appendChild(days); }
function renderSlotsForMaster(master){ const slotsContainer = document.getElementById('slotsContainer'); slotsContainer.innerHTML = ''; if(!state.selectedDate) return slotsContainer.innerHTML = '<div class="muted">Выберите дату</div>'; const weekday = (new Date(state.selectedDate)).getDay(); const wday = weekday===0?7:weekday; const templates = DB.get('work_templates').filter(t=>t.master_id===master.id && t.weekday===wday); if(templates.length===0) return slotsContainer.innerHTML = '<div class="muted">Мастер не работает в этот день</div>'; const tpl = templates[0]; const [h1,m1] = tpl.start.split(':').map(Number); const [h2,m2] = tpl.end.split(':').map(Number); const start = new Date(state.selectedDate); start.setHours(h1,m1,0,0); const end = new Date(state.selectedDate); end.setHours(h2,m2,0,0); const interval = tpl.slot_interval; const slots = []; for(let t = start.getTime(); t+ (state.selectedService.duration*60000) <= end.getTime(); t += interval*60000){ slots.push(new Date(t)); } const appointments = DB.get('appointments'); const html = document.createElement('div'); html.className='time-slots'; slots.forEach(s=>{ const iso = s.toISOString(); const overlapping = appointments.find(a=> a.master_id===master.id && a.status==='active' && ( (new Date(a.start_datetime).getTime() < s.getTime() + state.selectedService.duration*60000) && (new Date(a.end_datetime).getTime() > s.getTime()) )); const btn = document.createElement('button'); btn.className='slot' + (overlapping? ' booked':''); btn.textContent = s.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); if(!overlapping){ btn.addEventListener('click', ()=>{ document.querySelectorAll('.time-slots .slot').forEach(x=>x.classList.remove('selected')); btn.classList.add('selected'); state.selectedSlot = s.toISOString(); document.getElementById('confirmBtn').disabled = false; }); } html.appendChild(btn); }); slotsContainer.appendChild(html); }
function confirmBooking(){ if(!state.selectedService || !state.selectedMaster || !state.selectedSlot) return alert('Выберите услугу, мастера и слот'); const appointments = DB.get('appointments'); const sStart = new Date(state.selectedSlot).getTime(); const sEnd = sStart + state.selectedService.duration*60000; const conflict = appointments.find(a=> a.master_id===state.selectedMaster.id && a.status==='active' && ( (new Date(a.start_datetime).getTime() < sEnd) && (new Date(a.end_datetime).getTime() > sStart) )); if(conflict){ alert('К сожалению, слот уже занят. Выберите другой.'); renderSlotsForMaster(state.selectedMaster); return; } const newA = { id: uuid(), user_id: state.currentUserId, master_id: state.selectedMaster.id, service_id: state.selectedService.id, start_datetime: new Date(state.selectedSlot).toISOString(), end_datetime: new Date(sEnd).toISOString(), status: 'active', created_at: new Date().toISOString() }; appointments.push(newA); DB.put('appointments', appointments); const notifs = DB.get('notifications_log'); alert('Запись создана! Мы отправим напоминания.'); state.selectedService = null; state.selectedMaster = null; state.selectedDate = null; state.selectedSlot = null; document.getElementById('panelContent').innerHTML = '<h3>Запись создана</h3><p class="muted">Проверьте «Мои записи» в правой панели.</p>'; renderMyBookings(); }
function renderMyBookings(){ const bookings = DB.get('appointments').filter(a=> a.user_id===state.currentUserId); const container = document.getElementById('myBookings'); container.innerHTML=''; if(bookings.length===0) return container.innerHTML='<div class="muted">У вас нет записей</div>'; bookings.forEach(b=>{ const m = DB.get('masters').find(x=>x.id===b.master_id); const s = DB.get('services').find(x=>x.id===b.service_id); const el = document.createElement('div'); el.className='booking-item'; el.innerHTML = `<div><strong>${s.name}</strong><div class="muted">${new Date(b.start_datetime).toLocaleString()} • ${m.name}</div></div><div><button data-id="${b.id}" class="btn-cancel small">Отменить</button></div>`; container.appendChild(el); }); document.querySelectorAll('.btn-cancel').forEach(b=>b.addEventListener('click', onCancelBooking)); }
function onCancelBooking(e){ const id = e.target.dataset.id; let bookings = DB.get('appointments'); const idx = bookings.findIndex(x=>x.id===id); if(idx===-1) return; bookings[idx].status='cancelled'; DB.put('appointments', bookings); const users = DB.get('users'); const u = users.find(x=>x.id===state.currentUserId); u.cancel_count = (u.cancel_count || 0) + 1; DB.put('users', users); renderMyBookings(); alert('Запись отменена.'); }
function openProfileModal(){ const modal = document.getElementById('modalRoot'); modal.classList.add('show'); modal.innerHTML = `<div class="modal-card"><h3>Профиль</h3>    <div id="profileContent"></div>    <div style="margin-top:12px;text-align:right"><button id="closeProfile">Закрыть</button></div></div>`; const users = DB.get('users'); const u = users.find(x=>x.id===state.currentUserId); document.getElementById('profileContent').innerHTML = `<div><strong>${u.name}</strong><div class="muted">Отмена: ${u.cancel_count} раз</div></div>`; document.getElementById('closeProfile').addEventListener('click', ()=> modal.classList.remove('show')); }
setInterval(()=>{ const appointments = DB.get('appointments'); const users = DB.get('users'); const now = new Date(); appointments.forEach(a=>{ if(a.status!=='active') return; const start = new Date(a.start_datetime); const diffH = (start.getTime()-now.getTime())/3600000; const notifs = DB.get('notifications_log'); if(diffH <=24 && !notifs.find(n=>n.appointment_id===a.id && n.type==='reminder_24h')){ notifs.push({id: uuid(), appointment_id: a.id, user_id: a.user_id, type:'reminder_24h', sent_at: new Date().toISOString(), status:'sent'}); DB.put('notifications_log', notifs); console.log('sent 24h reminder for', a.id); } if(diffH <=4 && !notifs.find(n=>n.appointment_id===a.id && n.type==='reminder_4h')){ notifs.push({id: uuid(), appointment_id: a.id, user_id: a.user_id, type:'reminder_4h', sent_at: new Date().toISOString(), status:'sent'}); DB.put('notifications_log', notifs); console.log('sent 4h reminder for', a.id); } }); }, 30000);
