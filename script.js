const answers = {
  role: '',
  musica: '',
  horario: '',
  comida: '',
  conta: '',
  dia: ''
};

let currentStep = 'intro';

/*
 * Google Forms
 *
 * O endpoint abaixo é o formulário real "Respostas do Convite".
 * Os IDs entry.* precisam ser os IDs internos das seis perguntas do formulário.
 * Eles não ficam visíveis no link comum de edição/visualização.
 *
 * Quando os IDs forem conhecidos, substitua SOMENTE os valores abaixo, por exemplo:
 * role: 'entry.123456789'
 */
const FORM_ACTION = 'https://docs.google.com/forms/d/e/15Tmdnja8xotos4jWNKi9zAwMU0MzBwKSiU8Vk3HZdR4/formResponse';

const FORM_FIELDS = {
  role: 'entry.ROLE_ID',
  musica: 'entry.MUSICA_ID',
  horario: 'entry.HORARIO_ID',
  comida: 'entry.COMIDA_ID',
  conta: 'entry.CONTA_ID',
  dia: 'entry.DIA_ID'
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// NAVEGAÇÃO ENTRE ETAPAS
function goToStep(step) {
  $$('.step').forEach((section) => section.classList.remove('active'));

  const targetStep = $(`#step-${step}`);
  if (!targetStep) return;

  targetStep.classList.add('active');
  currentStep = step;
  updateProgressBar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep(step) {
  goToStep(step);
}

function prevStep(step) {
  goToStep(step);
}

// BARRA DE PROGRESSO — visível apenas entre as etapas 1 e 6
function updateProgressBar() {
  const progressBar = $('#progress-bar');
  if (!progressBar) return;

  const visible = typeof currentStep === 'number' && currentStep >= 1 && currentStep <= 6;
  progressBar.classList.toggle('visible', visible);

  if (!visible) return;

  const steps = progressBar.querySelectorAll('.progress-step');
  steps.forEach((element, index) => {
    element.classList.toggle('active', index < currentStep);
  });
}

// INTRO
$('#btn-intro')?.addEventListener('click', () => nextStep(0));
$('#btn-sim')?.addEventListener('click', () => nextStep(1));

// BOTÃO "NÃO" FUJÃO — funciona com mouse, touch e clique
const btnNao = $('#btn-nao');

function moveNoButton() {
  if (!btnNao) return;

  const margin = 12;
  const width = Math.max(btnNao.offsetWidth, 90);
  const height = Math.max(btnNao.offsetHeight, 50);
  const maxX = Math.max(margin, window.innerWidth - width - margin);
  const maxY = Math.max(margin, window.innerHeight - height - margin);

  const x = Math.floor(margin + Math.random() * Math.max(1, maxX - margin));
  const y = Math.floor(margin + Math.random() * Math.max(1, maxY - margin));

  btnNao.style.position = 'fixed';
  btnNao.style.left = `${Math.min(x, maxX)}px`;
  btnNao.style.top = `${Math.min(y, maxY)}px`;
  btnNao.style.zIndex = '1000';
}

btnNao?.addEventListener('mouseenter', moveNoButton);
btnNao?.addEventListener('touchstart', (event) => {
  event.preventDefault();
  moveNoButton();
}, { passive: false });
btnNao?.addEventListener('click', (event) => {
  event.preventDefault();
  moveNoButton();
});

// SELEÇÃO DE OPÇÕES — etapas 1 a 5
$$('.option-card').forEach((card) => {
  card.addEventListener('click', () => {
    const key = card.dataset.key;
    const value = card.dataset.val;
    const step = card.closest('.step');

    if (!key || !step) return;

    step.querySelectorAll('.option-card').forEach((option) => {
      option.classList.remove('selected');
    });

    card.classList.add('selected');
    answers[key] = value || '';

    const nextButton = step.querySelector('.btn-next');
    if (nextButton) nextButton.disabled = false;
  });
});

// NAVEGAÇÃO VOLTAR / AVANÇAR
$$('[data-prev]').forEach((button) => {
  button.addEventListener('click', () => prevStep(Number(button.dataset.prev)));
});

$$('[data-next]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!button.disabled) nextStep(Number(button.dataset.next));
  });
});

// DATAS
const customDate = $('#custom-date-input');
const datesContainer = $('#dates-container');
const btnFinalizar = $('#btn-finalizar');

function dateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toISODate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function getNextWeekday(baseDate, targetDay) {
  const date = dateOnly(baseDate);
  let difference = targetDay - date.getDay();

  // Sempre mostra a próxima ocorrência do dia, inclusive quando hoje já é esse dia.
  if (difference <= 0) difference += 7;

  date.setDate(date.getDate() + difference);
  return date;
}

function setDateSelection(value) {
  answers.dia = value;
  btnFinalizar.disabled = !value;
}

function selectSuggestedDate(value, button) {
  $$('.date-option').forEach((option) => option.classList.remove('selected'));
  button.classList.add('selected');

  if (customDate) customDate.value = '';
  setDateSelection(value);
}

function generateDynamicDates() {
  if (!datesContainer) return;

  const today = dateOnly(new Date());
  datesContainer.innerHTML = '';

  [5, 6, 0].forEach((targetDay) => {
    const date = getNextWeekday(today, targetDay);
    const isoDate = toISODate(date);
    const label = formatLongDate(date);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'date-option';
    button.dataset.date = isoDate;
    button.innerHTML = `
      <span class="date-option-content">
        <span class="date-weekday">${new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date)}</span>
        <span class="date-full">${label}</span>
      </span>
      <span class="check" aria-hidden="true">✓</span>
    `;

    button.addEventListener('click', () => selectSuggestedDate(isoDate, button));
    datesContainer.appendChild(button);
  });

  if (customDate) customDate.min = toISODate(today);
}

customDate?.addEventListener('change', (event) => {
  const value = event.target.value;

  if (!value) {
    setDateSelection('');
    return;
  }

  $$('.date-option').forEach((option) => option.classList.remove('selected'));
  setDateSelection(value);
});

// ENVIO SILENCIOSO PARA GOOGLE FORMS
function isPlaceholderField(entry) {
  return !/^entry\.\d+$/.test(entry);
}

async function finishForm() {
  if (!answers.dia || !btnFinalizar) return;

  btnFinalizar.disabled = true;
  const originalText = btnFinalizar.textContent;
  btnFinalizar.textContent = 'Enviando... 💌';

  const formData = new FormData();
  let configuredFields = 0;

  Object.entries(FORM_FIELDS).forEach(([key, entry]) => {
    const value = answers[key];

    if (value && !isPlaceholderField(entry)) {
      formData.append(entry, value);
      configuredFields += 1;
    }
  });

  // Ainda não há como enviar respostas reais sem os entry.* internos do formulário.
  // Mesmo assim, mantemos a experiência visual do convite até esses IDs serem configurados.
  if (configuredFields === 0) {
    console.warn('Google Forms: os IDs entry.* ainda não foram configurados.');
    btnFinalizar.textContent = originalText;
    goToStep(7);
    return;
  }

  try {
    await fetch(FORM_ACTION, {
      method: 'POST',
      mode: 'no-cors',
      body: formData
    });
  } catch (error) {
    console.warn('Falha ao enviar respostas ao Google Forms:', error);
  } finally {
    btnFinalizar.textContent = originalText;
    goToStep(7);
  }
}

btnFinalizar?.addEventListener('click', finishForm);

generateDynamicDates();
updateProgressBar();