let selfPersonId = null;

function setStatus(text) {
  const el = document.getElementById('selfStatus');
  if (el) el.textContent = text;
}

async function apiPost(url, payload) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await resp.json();
}

// 1) Добавить себя (создаёт запись Person и сохраняет selfPersonId)
window.addSelf = async function addSelf() {
  const firstName = (document.getElementById('selfName').value || '').trim();
  const lastName = (document.getElementById('selfSurname').value || '').trim();
  const birthDate = document.getElementById('selfBirthDate').value || null;

  if (!firstName) {
    setStatus('Укажите имя.');
    return;
  }

  const data = await apiPost('/api/create/', {
    first_name: firstName,
    last_name: lastName,
    birth_date: birthDate,
    death_date: null,
    father_id: null,
    mother_id: null
  });

  if (data.status !== 'ok') {
    setStatus('Ошибка сохранения в БД.');
    console.log(data);
    return;
  }

  selfPersonId = data.person_id;
  setStatus(`Вы сохранены в БД. Ваш ID: ${selfPersonId}. Теперь добавляйте родственников.`);
};

// 2) Добавить форму родственника (мы полностью контролируем структуру формы)
window.addRelativeForm = function addRelativeForm() {
  if (!selfPersonId) {
    setStatus('Сначала добавьте себя (нужен ваш ID).');
    return;
  }

  const container = document.getElementById('relativesFormsContainer');
  const wrapper = document.createElement('div');
  wrapper.className = 'glass-card';
  wrapper.style.marginTop = '1rem';
  wrapper.style.padding = '1rem';

  wrapper.innerHTML = `
    <div class="modern-form-grid">
      <select class="relType">
        <option value="father">Отец</option>
        <option value="mother">Мать</option>
        <option value="child_from_me">Ребёнок (от меня)</option>
      </select>

      <input type="text" class="relFirstName" placeholder="Имя родственника">
      <input type="text" class="relLastName" placeholder="Фамилия родственника">
      <input type="date" class="relBirthDate" placeholder="Дата рождения">

      <button type="button" class="btn-primary relSaveBtn">Сохранить родственника (в БД)</button>
      <button type="button" class="btn-secondary relRemoveBtn">Удалить форму</button>
    </div>

    <div class="relStatus" style="margin-top: .75rem; color:#666;"></div>
  `;

  container.appendChild(wrapper);

  const saveBtn = wrapper.querySelector('.relSaveBtn');
  const removeBtn = wrapper.querySelector('.relRemoveBtn');

  removeBtn.addEventListener('click', () => wrapper.remove());

  saveBtn.addEventListener('click', async () => {
    const relType = wrapper.querySelector('.relType').value;
    const firstName = (wrapper.querySelector('.relFirstName').value || '').trim();
    const lastName = (wrapper.querySelector('.relLastName').value || '').trim();
    const birthDate = wrapper.querySelector('.relBirthDate').value || null;
    const statusEl = wrapper.querySelector('.relStatus');

    if (!firstName) {
      statusEl.textContent = 'Укажите имя родственника.';
      return;
    }

    // Создаём родственника как Person
    const created = await apiPost('/api/create/', {
      first_name: firstName,
      last_name: lastName,
      birth_date: birthDate,
      death_date: null,
      father_id: null,
      mother_id: null
    });

    if (created.status !== 'ok') {
      statusEl.textContent = 'Ошибка создания родственника.';
      console.log(created);
      return;
    }

    const relId = created.person_id;

    // Теперь связываем через father_id/mother_id
    if (relType === 'father') {
      // Обновляем "себя": father_id = relId
      const upd = await apiPost('/api/set-parents/', {
        person_id: selfPersonId,
        father_id: relId,
        mother_id: null
      });
      statusEl.textContent = upd.status === 'ok'
        ? `Отец сохранён. ID отца: ${relId}. (Связь записана в father_id вашего Person)`
        : 'Ошибка установки отца.';
    }

    if (relType === 'mother') {
      // Обновляем "себя": mother_id = relId
      const upd = await apiPost('/api/set-parents/', {
        person_id: selfPersonId,
        father_id: null,
        mother_id: relId
      });
      statusEl.textContent = upd.status === 'ok'
        ? `Мать сохранена. ID матери: ${relId}. (Связь записана в mother_id вашего Person)`
        : 'Ошибка установки матери.';
    }

    if (relType === 'child_from_me') {
      // Создаём ребёнка и связываем: father_id = selfPersonId (упрощённо)
      // Если хочешь строго (с полом), надо добавить поле gender в модель, но сейчас делаем минимально.
      const updChild = await apiPost('/api/set-parents/', {
        person_id: relId,
        father_id: selfPersonId,
        mother_id: null
      });

      statusEl.textContent = updChild.status === 'ok'
        ? `Ребёнок сохранён. ID ребёнка: ${relId}. (У ребёнка father_id = ваш ID ${selfPersonId})`
        : 'Ошибка привязки ребёнка.';
    }
  });
};

// Заглушки, чтобы ничего не падало, если они где-то вызываются
window.buildTree = function buildTree() {};
