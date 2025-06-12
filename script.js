/* ─── Helpers ───────────────────────────────────────────────────────── */
function getUrlSubject() {
  return new URLSearchParams(window.location.search).get('subject') || '';
}
function getSubjects() {
  return JSON.parse(localStorage.getItem('subjects') || '[]');
}

/* ─── index.html ───────────────────────────────────────────────────── */
function addSubject() {
  const input = document.getElementById('subjectInput');
  const name  = input.value.trim();
  if (!name) return alert('กรุณาพิมพ์ชื่อวิชา');
  let subs = getSubjects();
  if (subs.includes(name)) return alert('วิชานี้มีอยู่แล้ว');
  subs.push(name);
  localStorage.setItem('subjects', JSON.stringify(subs));
  input.value = '';
  renderSubjects();
}
function renderSubjects() {
  const ul = document.getElementById('subjectList');
  ul.innerHTML = '';
  const subs = getSubjects();
  if (!subs.length) return ul.innerHTML = '<li>ยังไม่มีรายวิชา</li>';
  subs.forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${s}</span>
      <div class="btn-group">
        <a href="manage.html?subject=${encodeURIComponent(s)}" class="btn">จัดการนักเรียน</a>
        <a href="attendance.html?subject=${encodeURIComponent(s)}" class="btn">เช็คชื่อ</a>
        <a href="summary.html?subject=${encodeURIComponent(s)}" class="btn">สรุปผล</a>
        <a href="logs.html?subject=${encodeURIComponent(s)}" class="btn">Log</a>
      </div>`;
    ul.appendChild(li);
  });
}

/* ─── manage.html ───────────────────────────────────────────────────── */
function loadStudents() {
  const subject = getUrlSubject();
  document.getElementById('title').textContent = `จัดการนักเรียน - วิชา: ${subject}`;
  const key = `students_${subject}`;
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  const tb = document.querySelector('#studentTable tbody');
  tb.innerHTML = '';
  (arr.length ? arr : [{}]).forEach(stu => appendStudentRow(stu.id||'', stu.name||''));
  document.getElementById('studentListView').style.display = 'none';
}
function appendStudentRow(id, name) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" value="${id}" placeholder="เลขประจำตัว"/></td>
    <td><input type="text" value="${name}" placeholder="ชื่อ-สกุล"/></td>
    <td><button class="btn delete-btn" onclick="removeRow(this)">🗑️</button></td>`;
  document.querySelector('#studentTable tbody').appendChild(tr);
}
function removeRow(btn) { btn.closest('tr').remove(); }
function addStudentRows() {
  let n = parseInt(document.getElementById('batchCount').value,10);
  if(isNaN(n)||n<1) n=1; if(n>10) n=10;
  for(let i=0;i<n;i++) appendStudentRow('','');
}
function saveStudents() {
  const subject = getUrlSubject();
  const key = `students_${subject}`;
  const rows = document.querySelectorAll('#studentTable tbody tr');
  const arr = [];
  rows.forEach(r => {
    const id = r.cells[0].querySelector('input').value.trim();
    const name = r.cells[1].querySelector('input').value.trim();
    if (id && name) arr.push({ id, name });
  });
  if (!arr.length) return alert('กรุณาเพิ่มนักเรียนอย่างน้อย 1 คน');
  localStorage.setItem(key, JSON.stringify(arr));
  document.getElementById('statusMsg').textContent = '✅ บันทึกเรียบร้อย';
  setTimeout(() => document.getElementById('statusMsg').textContent = '', 3000);
  loadStudents();
}
function viewStudents() {
  const subject = getUrlSubject();
  const arr = JSON.parse(localStorage.getItem(`students_${subject}`)||'[]');
  const ul = document.getElementById('savedStudentList');
  ul.innerHTML = '';
  if (!arr.length) return ul.innerHTML = '<li>ยังไม่มีนักเรียน</li>';
  arr.forEach(s => {
    const li = document.createElement('li');
    li.textContent = `${s.id} - ${s.name}`;
    ul.appendChild(li);
  });
  document.getElementById('studentListView').style.display = 'block';
}

/* ─── attendance.html ───────────────────────────────────────────────── */
function initAttendance() {
  const subject = getUrlSubject();
  document.getElementById('title').textContent = `เช็คชื่อนักเรียน - วิชา: ${subject}`;
}
function loadAttendance() {
  const subject = getUrlSubject();
  const date    = document.getElementById('datePicker').value;
  const checker = document.getElementById('checkerName').value.trim();
  if (!date)    return alert('กรุณาเลือกวันที่');
  if (!checker) return alert('กรุณากรอกชื่อ-สกุลผู้เช็คชื่อ');

  const students = JSON.parse(localStorage.getItem(`students_${subject}`)||'[]');
  if (!students.length) return alert('กรุณาเพิ่มนักเรียนก่อน');

  const attendanceData = JSON.parse(localStorage.getItem(`attendance_${subject}`)||'{}');
  const entry = attendanceData[date] || { checker:'', records:{} };

  if (entry.checker) {
    document.getElementById('checkerName').value = entry.checker;
  }

  const form = document.getElementById('attendanceForm');
  form.innerHTML = '';
  students.forEach(s => {
    const selValue = entry.records[s.id] || '';
    const row = document.createElement('div');
    row.className = 'attendance-row';
    row.innerHTML = `
      <span class="student-info">${s.id} - ${s.name}</span>
      <select data-id="${s.id}" class="status-select">
        <option value="">--เลือกสถานะ--</option>
        <option value="มา"  ${selValue==='มา'  ? 'selected' : ''}>มา</option>
        <option value="ขาด" ${selValue==='ขาด'? 'selected' : ''}>ขาด</option>
        <option value="ลา"  ${selValue==='ลา'  ? 'selected' : ''}>ลา</option>
      </select>`;
    form.appendChild(row);
  });
}
function saveAttendance() {
  const subject = getUrlSubject();
  const date    = document.getElementById('datePicker').value;
  const checker = document.getElementById('checkerName').value.trim();
  if (!date)    return alert('กรุณาเลือกวันที่');
  if (!checker) return alert('กรุณากรอกชื่อ-สกุลผู้เช็คชื่อ');

  const selects = document.querySelectorAll('#attendanceForm select');
  const records = {};
  selects.forEach(sel => { records[sel.dataset.id] = sel.value; });

  const key = `attendance_${subject}`;
  const data = JSON.parse(localStorage.getItem(key)||'{}');
  data[date] = { checker, records };
  localStorage.setItem(key, JSON.stringify(data));

  const total   = selects.length;
  const present = Object.values(records).filter(v=>'มา'===v).length;
  const pct     = total ? ((present/total)*100).toFixed(1) : 0;

  const msg = document.getElementById('statusMsg');
  msg.textContent = `✅ บันทึกเรียบร้อย (${date}) มาเรียน ${pct}%`;
  setTimeout(()=>msg.textContent='',4000);
  document.getElementById('attendanceForm').innerHTML = '';
}

/* ─── summary.html ─────────────────────────────────────────────────── */
function loadSummary() {
  const subject = getUrlSubject();
  document.getElementById('title').textContent = `สรุปผลการมาเรียน - วิชา: ${subject}`;
  const students = JSON.parse(localStorage.getItem(`students_${subject}`)||'[]');
  const data     = JSON.parse(localStorage.getItem(`attendance_${subject}`)||'{}');
  const dates    = Object.keys(data).sort();
  const c        = document.getElementById('summaryTableContainer');

  if (!students.length) return c.innerHTML = '<p>ยังไม่มีนักเรียน</p>';
  if (!dates.length)    return c.innerHTML = '<p>ยังไม่มีข้อมูลเช็คชื่อ</p>';

  let html = '<table><thead><tr><th>รหัส</th><th>ชื่อ</th>';
  dates.forEach(d=> html+=`<th>${d}</th>`);
  html+='<th>มา</th><th>ขาด</th><th>ลา</th><th>%มา</th></tr></thead><tbody>';

  students.forEach(s=>{
    let come=0,abs=0,lea=0;
    html+=`<tr><td>${s.id}</td><td>${s.name}</td>`;
    dates.forEach(d=>{
      const rec = data[d].records||{};
      const st  = rec[s.id]||'';
      if(st==='มา') come++;
      if(st==='ขาด') abs++;
      if(st==='ลา')  lea++;
      html+=`<td>${st}</td>`;
    });
    const tot = come+abs+lea;
    const pct = tot?((come/tot)*100).toFixed(1):0;
    html+=`<td>${come}</td><td>${abs}</td><td>${lea}</td><td>${pct}%</td></tr>`;
  });

  html+='</tbody></table>';
  c.innerHTML = html;
}

/* ─── logs.html ─────────────────────────────────────────────────────── */
function loadLogs() {
  const subject = getUrlSubject();
  document.getElementById('title').textContent = `Log การเช็คชื่อ - วิชา: ${subject}`;
  const students = JSON.parse(localStorage.getItem(`students_${subject}`)||'[]');
  const data     = JSON.parse(localStorage.getItem(`attendance_${subject}`)||'{}');
  const dates    = Object.keys(data).sort();
  const container= document.getElementById('logsTableContainer');

  if (!dates.length) {
    container.innerHTML = '<p>ยังไม่มี log การเช็คชื่อ</p>';
    return;
  }

  let html = '';
  dates.forEach(date => {
    const entry = data[date];
    html += `<h2>วันที่ ${date}</h2>`;
    html += `
      <table>
        <thead>
          <tr>
            <th>เลขประจำตัว</th>
            <th>ชื่อ-สกุล</th>
            <th>ผู้เช็คชื่อ</th>
          </tr>
        </thead>
        <tbody>
    `;
    Object.keys(entry.records).forEach(id => {
      const stu  = students.find(s => s.id === id);
      const name = stu ? stu.name : '-';
      html += `
        <tr>
          <td>${id}</td>
          <td>${name}</td>
          <td>${entry.checker}</td>
        </tr>
      `;
    });
    html += `
        </tbody>
      </table>
    `;
  });

  container.innerHTML = html;
}
