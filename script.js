const FORM_ACTION='https://docs.google.com/forms/d/e/15Tmdnja8xotos4jWNKi9zAwMU0MzBwKSiU8Vk3HZdR4/formResponse';

/*
 * O formulário existente tem estas seis perguntas:
 * Tipo de Encontro
 * Estilo de Roupa
 * Transporte
 * Nível de Animação
 * Pedido Especial
 * Dia Escolhido
 *
 * Os nomes abaixo representam essas perguntas no site.
 * Falta apenas substituir os entry.* pelos IDs reais das perguntas.
 */
const FORM_FIELDS={
  tipoEncontro:'entry.TIPO_ENCONTRO',
  estiloRoupa:'entry.ESTILO_ROUPA',
  transporte:'entry.TRANSPORTE',
  nivelAnimacao:'entry.NIVEL_ANIMACAO',
  pedidoEspecial:'entry.PEDIDO_ESPECIAL',
  data:'entry.DIA_ESCOLHIDO'
};

const answers={
  tipoEncontro:null,
  estiloRoupa:null,
  transporte:null,
  nivelAnimacao:null,
  pedidoEspecial:null,
  data:null
};

let currentStep='intro';

const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);

function showStep(step){
  $$('.step').forEach(e=>e.classList.remove('active'));
  const target=$(`#step-${step}`);
  if(target)target.classList.add('active');
  currentStep=step;
  updateProgressBar();
  window.scrollTo({top:0,behavior:'smooth'});
}

function updateProgressBar(){
  const visible=typeof currentStep==='number'&&currentStep>=1&&currentStep<=6;
  $('#progress-container').classList.toggle('visible',visible);
  if(!visible)return;
  $('#progress-bar').style.width=`${((currentStep-1)/5)*100}%`;
  $$('.dots i').forEach((d,i)=>d.classList.toggle('active',i<currentStep));
}

$('#btn-intro').onclick=()=>showStep(0);

$('#btn-sim').onclick=()=>showStep(1);

const noButton=$('#btn-nao');

function escapeNo(){
  const w=innerWidth;
  const h=innerHeight;
  const bw=noButton.offsetWidth;
  const bh=noButton.offsetHeight;
  noButton.style.position='fixed';
  noButton.style.left=`${Math.max(10,Math.floor(Math.random()*Math.max(1,w-bw-20)))}px`;
  noButton.style.top=`${Math.max(10,Math.floor(Math.random()*Math.max(1,h-bh-20)))}px`;
}

noButton.addEventListener('mouseenter',escapeNo);
noButton.addEventListener('touchstart',e=>{e.preventDefault();escapeNo()},{passive:false});
noButton.onclick=e=>{e.preventDefault();escapeNo()};

$$('.option-card').forEach(card=>card.addEventListener('click',()=>{
  const q=card.dataset.question;
  answers[q]=card.dataset.value;
  $$(`.option-card[data-question="${q}"]`).forEach(c=>c.classList.remove('selected'));
  card.classList.add('selected');

  setTimeout(()=>{
    if(typeof currentStep==='number'&&currentStep<6)showStep(currentStep+1);
  },250);
}));

function dateOnly(d){
  return new Date(d.getFullYear(),d.getMonth(),d.getDate());
}

function iso(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function longDate(d){
  return new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d);
}

function nextWeekday(base,target){
  const d=dateOnly(base);
  let diff=target-d.getDay();
  if(diff<=0)diff+=7;
  d.setDate(d.getDate()+diff);
  return d;
}

function generateDates(){
  const box=$('#date-options');
  const today=dateOnly(new Date());
  box.innerHTML='';

  [5,6,0].map(day=>nextWeekday(today,day)).forEach(d=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='date-option';
    b.dataset.date=iso(d);
    b.innerHTML=`<span><span class="date-weekday">${new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(d)}</span><span class="date-full">${longDate(d)}</span></span><span class="check">✓</span>`;
    b.onclick=()=>selectDate(b.dataset.date,b);
    box.appendChild(b);
  });

  $('#custom-date').min=iso(today);
}

function selectDate(value,button){
  answers.data=value;
  $('#custom-date').value='';
  $$('.date-option').forEach(b=>b.classList.remove('selected'));
  button.classList.add('selected');
  $('#btn-finalizar').disabled=false;
}

$('#custom-date').addEventListener('change',e=>{
  if(!e.target.value)return;
  answers.data=e.target.value;
  $$('.date-option').forEach(b=>b.classList.remove('selected'));
  $('#btn-finalizar').disabled=false;
});

async function sendToForm(){
  const fd=new FormData();

  Object.entries(FORM_FIELDS).forEach(([key,entry])=>{
    const value=answers[key];
    if(/^entry\.[A-Za-z0-9_-]+$/.test(entry)&&value!=null){
      fd.append(entry,value);
    }
  });

  try{
    await fetch(FORM_ACTION,{method:'POST',mode:'no-cors',body:fd});
    return true;
  }catch(err){
    console.warn('Falha no envio ao Google Forms',err);
    return false;
  }
}

$('#btn-finalizar').onclick=async()=>{
  if(!answers.data)return;

  const b=$('#btn-finalizar');
  b.disabled=true;
  b.textContent='Enviando... 💌';

  await sendToForm();
  showStep(7);
};

generateDates();
updateProgressBar();