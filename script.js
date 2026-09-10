const SUPABASE_URL = 'https://baajhgfklomqyrsxrbnu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-n8uqmAGH1UeAzLYvxuySA_eHnlSi8m';
const supabaseClient = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

const answers = { role: '', musica: '', horario: '', comida: '', conta: '', dia: '' };
let currentStep = 'intro';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function goToStep(step) {
  $$('.step').forEach((section) => section.classList.remove('active'));
  const targetStep = $(`#step-${step}`);
  if (!targetStep) return;
  targetStep.classList.add('active');
  currentStep = step;
  updateProgressBar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressBar() {
  const progressBar = $('#progress-bar');
  if (!progressBar) return;
  const visible = typeof currentStep === 'number' && currentStep >= 1 && currentStep <= 6;
  progressBar.classList.toggle('visible', visible);
  if (!visible) return;
  progressBar.querySelectorAll('.progress-step').forEach((element, index) => {
    element.classList.toggle('active', index < currentStep);
  });
}

$('#btn-intro')?.addEventListener('click', () => goToStep(0));
$('#btn-sim')?.addEventListener('click', () => goToStep(1));

const btnNao = $('#btn-nao');
const isMobile = () => window.matchMedia('(max-width: 767px)').matches || navigator.maxTouchPoints > 0;

function moveNoButton() {
  if (!btnNao || isMobile()) return;
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
btnNao?.addEventListener('click', (event) => {
  if (isMobile()) return;
  event.preventDefault();
  moveNoButton();
});

$$('.option-card').forEach((card) => {
  card.addEventListener('click', () => {
    const key = card.dataset.key;
    const value = card.dataset.val;
    const step = card.closest('.step');
    if (!key || !step) return;
    step.querySelectorAll('.option-card').forEach((option) => option.classList.remove('selected'));
    card.classList.add('selected');
    answers[key] = value || '';
    const nextButton = step.querySelector('.btn-next');
    if (nextButton) nextButton.disabled = false;
  });
});

$$('[data-prev]').forEach((button) => {
  button.addEventListener('click', () => goToStep(Number(button.dataset.prev)));
});

$$('[data-next]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!button.disabled) goToStep(Number(button.dataset.next));
  });
});

const customDate = $('#custom-date-input');
const datesContainer = $('#dates-container');
const btnFinalizar = $('#btn-finalizar');

function dateOnly(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function toISODate(date) { return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-'); }
function formatLongDate(date) { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date); }

function getNextWeekday(baseDate, targetDay) {
  const date = dateOnly(baseDate);
  let difference = targetDay - date.getDay();
  if (difference <= 0) difference += 7;
  date.setDate(date.getDate() + difference);
  return date;
}

function setDateSelection(value) {
  answers.dia = value;
  if (btnFinalizar) btnFinalizar.disabled = !value;
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
    button.innerHTML = `<span class="date-option-content"><span class="date-weekday">${new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date)}</span><span class="date-full">${label}</span></span><span class="check" aria-hidden="true">✓</span>`;
    button.addEventListener('click', () => selectSuggestedDate(isoDate, button));
    datesContainer.appendChild(button);
  });
  if (customDate) customDate.min = toISODate(today);
}

customDate?.addEventListener('change', (event) => {
  const value = event.target.value;
  if (!value) { setDateSelection(''); return; }
  $$('.date-option').forEach((option) => option.classList.remove('selected'));
  setDateSelection(value);
});

async function finishForm() {
  if (!answers.dia || !btnFinalizar) return;
  if (!supabaseClient) {
    alert('Não foi possível conectar ao formulário agora. Tente novamente. 💌');
    return;
  }
  btnFinalizar.disabled = true;
  const originalText = btnFinalizar.textContent;
  btnFinalizar.textContent = 'Enviando... 💌';

  const { error } = await supabaseClient.from('respostas_convite').insert({
    role: answers.role,
    musica: answers.musica,
    horario: answers.horario,
    comida: answers.comida,
    conta: answers.conta,
    dia_escolhido: answers.dia
  });

  if (error) {
    console.error('Erro ao salvar resposta:', error);
    btnFinalizar.disabled = false;
    btnFinalizar.textContent = originalText;
    alert('Ops! Não consegui registrar sua resposta. Tente novamente. 💌');
    return;
  }

  btnFinalizar.textContent = originalText;
  goToStep(7);
}

btnFinalizar?.addEventListener('click', finishForm);
generateDynamicDates();
updateProgressBar();