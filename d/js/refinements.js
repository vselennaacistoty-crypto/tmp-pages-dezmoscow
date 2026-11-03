'use strict';
(() => {
  const dialog = document.querySelector('.request-dialog');
  const inlineForm = document.querySelector('[data-inquiry]');
  const modalForm = inlineForm.cloneNode(true);
  dialog.querySelector('[data-dialog-form]').append(modalForm);
  const entry = dialog.querySelector('[data-dialog-entry]');
  const result = dialog.querySelector('[data-dialog-result]');
  const message = dialog.querySelector('#request-message');
  const forms = [inlineForm, modalForm];
  const plans = new WeakMap();
  let opener = null;
  let activeForm = modalForm;
  function applyPlan(form, plan) {
    plans.set(form, plan);
    const box = form.querySelector('[data-selected-plan]');
    box.hidden = !plan;
    box.replaceChildren();
    if (!plan) return;
    const strong = document.createElement('strong');
    strong.textContent = plan.name + ' обработка';
    const text = document.createElement('span');
    text.textContent = 'От ' + plan.price + ' за 1-комнатную квартиру. Итог — после осмотра.';
    const clear = document.createElement('button');
    clear.type = 'button'; clear.textContent = 'Убрать выбранный тариф';
    clear.addEventListener('click', () => applyPlan(form, null));
    box.append(strong, text, document.createElement('br'), clear);
  }
  function showEntry() {
    entry.hidden = false; result.hidden = true;
    dialog.setAttribute('aria-labelledby', 'request-title');
  }
  document.querySelectorAll('[data-request]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault(); opener = trigger; activeForm = modalForm;
      const data = trigger.dataset;
      modalForm.reset();
      modalForm.elements.service.value = data.service || 'Нужна консультация';
      modalForm.elements.object.value = data.object || 'Квартира';
      applyPlan(modalForm, data.plan ? {name:data.plan,price:data.price} : null);
      showEntry();
      dialog.showModal();
      modalForm.elements.service.focus();
    });
  });
  forms.forEach(form => {
    form.addEventListener('change', () => {
      if (form.elements.object.value !== 'Квартира' || !['Нужна консультация','Тараканы / клопы','Тараканы','Клопы','Моль'].includes(form.elements.service.value)) applyPlan(form, null);
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      activeForm = form;
      if (!dialog.open) { opener = event.submitter; dialog.showModal(); }
      const values = new FormData(form), plan = plans.get(form);
      const business = values.get('object') === 'Организация';
      const lines = [business ? 'Здравствуйте! Прошу подготовить КП на обработку.' : 'Здравствуйте! Хочу уточнить стоимость обработки.', 'Проблема: ' + values.get('service') + '.', 'Объект: ' + values.get('object') + '.'];
      if (values.get('area')) lines.push('Площадь: ' + values.get('area') + ' м².');
      if (plan) lines.push('Интересует ' + plan.name.toLowerCase() + ' обработка. Цена в прайсе: от ' + plan.price + ' за 1-комнатную квартиру.');
      lines.push('Подскажите итоговую стоимость, состав работ, условия гарантии и доступное время выезда.');
      message.value = lines.join('\n');
      dialog.querySelector('[data-wa]').href = 'https://wa.me/79099891262?text=' + encodeURIComponent(message.value);
      dialog.querySelector('[data-email]').href = 'mailto:info@dezinsekciya.moscow?subject=' + encodeURIComponent(business ? 'Запрос КП на обработку' : 'Стоимость обработки') + '&body=' + encodeURIComponent(message.value);
      dialog.querySelector('[data-copy-status]').textContent = '';
      entry.hidden = true; result.hidden = false;
      dialog.setAttribute('aria-labelledby', 'result-title');
      dialog.scrollTop = 0;
      dialog.querySelector('#result-title').focus();
    });
  });
  dialog.querySelector('.request-dialog__close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.querySelector('.request-edit').addEventListener('click', () => {
    if (activeForm === inlineForm) {
      for (const key of ['service','object','area']) modalForm.elements[key].value = inlineForm.elements[key].value;
      applyPlan(modalForm, plans.get(inlineForm)); activeForm = modalForm;
    }
    showEntry(); modalForm.elements.service.focus();
  });
  dialog.querySelector('[data-copy]').addEventListener('click', async () => {
    const status = dialog.querySelector('[data-copy-status]');
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(message.value);
      status.textContent = 'Скопировано. Вставьте текст в сообщение службе.';
    } catch {
      message.focus(); message.select();
      status.textContent = 'Текст выделен. Скопируйте его через Ctrl+C или меню телефона.';
    }
  });
})();
