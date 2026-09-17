/* ============================================================
   PHILOTOPIC — lógica de la aplicación conectada a Supabase
   Las historias se publican ÚNICAMENTE desde el panel de Supabase.
   Los visitantes leen, votan y comentan. La sesión usa Supabase Auth.
   ============================================================ */

// 1. CONFIGURACIÓN Y CONEXIÓN CON SUPABASE
const SUPABASE_URL = 'https://spbcvfywrmyvlzsynoyr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwYmN2Znl3cm15dmx6c3lub3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDU3MTAsImV4cCI6MjEwNTEyMTcxMH0.125_gdrrwOckwT8N2XhMNAAn7153PeKgJyGzA-CpBDs';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
/* --- REALTIME --- */
function suscribirRealtime() {
  db.channel('cambios-vivo')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'opciones' },
      (payload) => {
        const opcionActualizada = payload.new;
        estado.historias.forEach(h => {
          const opt = h.opciones?.find(o => o.id === opcionActualizada.id);
          if (opt) opt.votos = opcionActualizada.votos;
        });

        if (!$('#vista-feed').hidden) pintarEncuestas();
        if (!$('#vista-debate').hidden && estado.actual) {
          const hActual = estado.historias.find(h => h.id === estado.actual);
          if (hActual) {
            pintarEncuesta(hActual);
            pintarEditor(hActual);
            pintarLateralDebate(hActual);
          }
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comentarios' },
      (payload) => {
        const nuevoComentario = payload.new;
        const historia = estado.historias.find(h => h.id === nuevoComentario.historia_id);
        if (historia) {
          if (!historia.comentarios) historia.comentarios = [];
          if (!historia.comentarios.some(c => c.id === nuevoComentario.id)) {
            historia.comentarios.push(nuevoComentario);
            if (!$('#vista-debate').hidden && estado.actual === historia.id) {
              pintarEditor(historia);
            }
          }
        }
      }
    )
    .subscribe();
}
const EMAIL_ADMIN = 'philotopic0@gmail.com';

/* ------------------------------------------------------------
   A. DATOS BASE
   ------------------------------------------------------------ */
const CATEGORIAS = ['Dilemas morales','Relaciones','Trabajo','Familia','Sociedad','Tecnología'];

const HISTORIAS_SEMILLA = [
{
  id:'h1', categoria:'Dilemas morales', autor:'rocio_v', destacada:true,
  titulo:'Encontré 4.000 € en el bolsillo de un abrigo de segunda mano',
  cuerpo:[
    'El abrigo costaba 28 euros en una tienda de segunda mano del centro. Lo compré un martes por la tarde, me lo puse esa misma noche y al meter la mano en el forro noté un bulto duro cosido por dentro. En casa lo abrí con unas tijeras de cocina: cuatro mil euros en billetes de cincuenta, doblados en tres montones y atados con gomas del pelo.',
    'Volví a la tienda al día siguiente. La encargada me dijo que los abrigos llegan en sacas desde un almacén de donaciones y que no hay forma de saber quién dejó ese. Me ofreció quedarse ella el dinero "por si alguien pregunta". No apuntó nada, no me pidió los datos, no llamó a nadie.',
    'En el bolsillo interior había también un billete de autobús de 2019 y una receta médica doblada con un apellido que no se lee entero. Pasé dos noches buscando ese apellido en internet. Encontré a cuatro personas posibles. A ninguna me atreví a escribirle "¿ha perdido usted cuatro mil euros?".',
    'Mi hermano dice que ese dinero era de alguien que murió y que la familia donó la ropa sin mirar. Mi pareja dice que hay que llevarlo a la policía y olvidarse. Yo llevo tres semanas con los billetes en un cajón, sin gastarlos y sin devolverlos, y cada día que pasa se parecen un poco más a míos.'
  ],
  pregunta:'Pasadas tres semanas sin dueño, ¿de quién es ese dinero?',
  opciones:[
    {id:'o1',texto:'De quien lo perdió: hay que seguir buscándolo',votos:1841},
    {id:'o2',texto:'De nadie: entregarlo a la policía y punto',votos:1290},
    {id:'o3',texto:'Suyo: compró el abrigo y lo que había dentro',votos:964}
  ]
},
{
  id:'h2', categoria:'Trabajo', autor:'m_ferrer', destacada:false,
  titulo:'Mi jefe me pidió que descartara a la mejor candidata porque estaba embarazada',
  cuerpo:[
    'Llevo cuatro años seleccionando perfiles técnicos en una empresa de sesenta personas. La semana pasada terminamos un proceso con tres finalistas y la decisión era evidente: una de ellas sacaba dos cabezas a los demás en la prueba y llevaba seis años haciendo exactamente lo que necesitábamos.',
    'En la última entrevista comentó, de pasada y contenta, que estaba embarazada de cuatro meses. No preguntamos, no venía a cuento, lo dijo ella. Al salir, mi jefe cerró la puerta y me dijo que buscara "un motivo técnico" para dejarla fuera y que contratáramos al segundo. Textual: "no me puedo permitir pagar una baja el primer año".',
    'Si me niego, el proceso lo firma otra persona y ella se queda fuera igual. Si acepto, escribo con mi nombre un informe falso. Si lo cuento fuera, lo pierdo todo por una candidata a la que no conozco y que probablemente nunca sabrá que existí.',
    'Llevo el borrador del informe abierto desde el jueves. No he escrito una sola línea.'
  ],
  pregunta:'¿Qué haces el lunes por la mañana?',
  opciones:[
    {id:'o1',texto:'Negarme por escrito y que firme quien quiera',votos:2410},
    {id:'o2',texto:'Denunciarlo fuera de la empresa',votos:1655},
    {id:'o3',texto:'Firmar y empezar a buscar otro trabajo',votos:402}
  ]
},
{
  id:'h3', categoria:'Familia', autor:'sanchez_dl', destacada:false,
  titulo:'Mi padre pregunta por mi madre cada mañana y cada mañana decido si se la mato',
  cuerpo:[
    'A mi padre le diagnosticaron demencia hace dos años. Mi madre murió en marzo. Él estuvo en el funeral, lloró, habló con todo el mundo y por la tarde ya no se acordaba.',
    'Cada mañana pregunta dónde está. Las primeras semanas se lo contaba. Se derrumbaba como si fuera la primera vez, con la misma intensidad exacta, y a las dos horas volvía a preguntar. Una enfermera me dijo que le estaba haciendo vivir el peor día de su vida, en bucle, por una idea mía de honestidad.',
    'Ahora le digo que ha bajado a la compra. Él asiente, se queda tranquilo y desayuna. A veces, muy de vez en cuando, tiene un momento claro y me mira distinto, y yo no sé si en ese instante sabe que le estoy mintiendo.',
    'Mi hermana dice que le estoy robando su duelo. Yo creo que le estoy ahorrando ochenta duelos.'
  ],
  pregunta:'¿Se le debe la verdad cada mañana?',
  opciones:[
    {id:'o1',texto:'Sí: la verdad no depende de que la recuerde',votos:520},
    {id:'o2',texto:'No: evitar sufrimiento inútil también es cuidar',votos:2870},
    {id:'o3',texto:'Depende del día y de cómo esté él',votos:1194}
  ]
}
];

/* ------------------------------------------------------------
   B. UTILIDADES
   ------------------------------------------------------------ */
const $  = (s, ctx=document) => ctx.querySelector(s);
const $$ = (s, ctx=document) => Array.from(ctx.querySelectorAll(s));

function esc(t){ return String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function enfasis(s){ return s.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[\s(])\*([^*]+)\*/g,'$1<i>$2</i>'); }
function formatearTexto(t){
  return esc(t).trim().split(/\n{2,}/).map(bloque => {
    if(/^\s*&gt;/.test(bloque)) return '<blockquote>' + enfasis(bloque.replace(/^\s*&gt;\s?/gm,'')).replace(/\n/g,'<br>') + '</blockquote>';
    return '<p>' + enfasis(bloque).replace(/\n/g,'<br>') + '</p>';
  }).join('');
}
function haceRato(fechaIso){
  if(!fechaIso) return 'reciente';
  const min = Math.max(0, (Date.now() - new Date(fechaIso).getTime()) / 60000);
  if(min < 1) return 'ahora mismo'; if(min < 60) return 'hace ' + Math.round(min) + ' min';
  if(min < 1440) return 'hace ' + Math.floor(min/60) + ' h';
  const d = Math.floor(min/1440); return d === 1 ? 'hace 1 día' : 'hace ' + d + ' días';
}
const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const plural = (n, sing, pl) => num(n) + ' ' + (n === 1 ? sing : pl);
const totalVotos = h => (h.opciones || []).reduce((s,o) => s + (o.votos || 0), 0);

function contarComentarios(lista){
  if(!lista) return 0;
  return lista.reduce((s,c) => s + 1 + contarComentarios(c.respuestas || []), 0);
}
function buscarComentario(lista, id){
  for(const c of lista){
    if(c.id === id) return c;
    const hallado = buscarComentario(c.respuestas || [], id); if(hallado) return hallado;
  } return null;
}
const idNuevo = p => p + '_' + Math.random().toString(36).slice(2,9);

let temporizadorAviso;
function avisar(texto){
  const el = $('#aviso'); el.textContent = texto; el.dataset.visible = 'si';
  clearTimeout(temporizadorAviso); temporizadorAviso = setTimeout(() => el.dataset.visible = 'no', 2600);
}

/* ------------------------------------------------------------
   C. ESTADO Y COMUNICACIÓN CON SUPABASE
   ------------------------------------------------------------ */
const estado = {
  usuario: null,
  userAuth: null,
  modoModal: 'entrar',
  historias: [],
  notificaciones: [], // Nuevo estado para notificaciones
  votos: JSON.parse(localStorage.getItem('philotopic:votos') || '{}'),
  votosCom: JSON.parse(localStorage.getItem('philotopic:votosCom') || '{}'),
  reportes: JSON.parse(localStorage.getItem('philotopic:reportes') || '[]'),
  orden: 'tendencias', categoria: 'todas', busqueda: '', ordenCom: 'relevancia', actual: null
};

function guardarLocal(){
  localStorage.setItem('philotopic:votos', JSON.stringify(estado.votos));
  localStorage.setItem('philotopic:votosCom', JSON.stringify(estado.votosCom));
  localStorage.setItem('philotopic:reportes', JSON.stringify(estado.reportes));
}
/* --- CARGA INICIAL DE DATOS --- */
async function cargarDatosSupabase() {
  try {
    const { data: historias, error: errH } = await db
      .from('historias')
      .select(`
        id, categoria, autor, titulo, cuerpo, pregunta, destacada, created_at,
        opciones ( id, texto, votos ), 
        comentarios ( id, padre_id, autor, texto, voto_opcion, arriba, abajo, created_at )
      `)
      .order('created_at', { ascending: false });

    if (errH) throw errH;

    if (!historias || historias.length === 0) { 
      await sembrarBaseDeDatos(); 
      return cargarDatosSupabase(); 
    }

    estado.historias = historias.map(h => {
      const todosComs = (h.comentarios || []).map(c => ({ 
        id: c.id, 
        padre_id: c.padre_id, 
        autor: c.autor, 
        texto: c.texto, 
        voto: c.voto_opcion, 
        arriba: c.arriba, 
        abajo: c.abajo, 
        created_at: c.created_at, 
        respuestas: [] 
      }));

      const mapa = {}; 
      todosComs.forEach(c => mapa[c.id] = c);
      
      const raiz = [];
      todosComs.forEach(c => { 
        if (c.padre_id && mapa[c.padre_id]) { 
          mapa[c.padre_id].respuestas.push(c); 
        } else { 
          raiz.push(c); 
        } 
      });

      return { 
        ...h, 
        opciones: (h.opciones || []).sort((a, b) => a.id.localeCompare(b.id)), 
        comentarios: raiz 
      };
    });

    pintarEncuestas();
    suscribirRealtime();

  } catch (e) { 
    console.error('Error cargando datos:', e); 
    avisar('Error conectando con la base de datos.'); 
  }
}

async function sembrarBaseDeDatos(){
  for(const h of HISTORIAS_SEMILLA){
    await db.from('historias').insert({ id: h.id, categoria: h.categoria, autor: h.autor, titulo: h.titulo, cuerpo: h.cuerpo, pregunta: h.pregunta, destacada: h.destacada });
    for(const op of h.opciones){ await db.from('opciones').insert({ id: op.id, historia_id: h.id, texto: op.texto, votos: op.votos }); }
  }
}

const haVotado = idH => Boolean(estado.votos[idH]);
const miVoto = idH => estado.votos[idH] || null;
const estaLogado = () => Boolean(estado.userAuth && estado.usuario);

/* ------------------------------------------------------------
   D. NOTIFICACIONES
   ------------------------------------------------------------ */
async function cargarNotificaciones(){
  if(!estaLogado()) return;
  const { data, error } = await db
    .from('notificaciones')
    .select('*')
    .eq('usuario_destino', estado.usuario)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if(!error && data){
    estado.notificaciones = data;
    pintarNotificaciones();
  }
}

function pintarNotificaciones(){
  const noLeidas = estado.notificaciones.filter(n => !n.leida).length;
  const punto = $('#punto-notificaciones');
  if(punto) punto.hidden = noLeidas === 0;

  const lista = $('#lista-notificaciones');
  if(!lista) return;

  if(estado.notificaciones.length === 0){
    lista.innerHTML = '<div class="noti-vacio">No tienes notificaciones nuevas.</div>';
    return;
  }

  lista.innerHTML = estado.notificaciones.map(n => `
    <div class="noti-item ${n.leida ? '' : 'noti-item--no-leida'}" data-ir-noti="${n.id}">
      <div class="avatar" style="width:32px;height:32px;font-size:11px;flex:0 0 auto;">${esc(n.actor.slice(0,2).toUpperCase())}</div>
      <div>
        <b>${esc(n.actor)}</b> te ha respondido en un debate.
        <div style="font-size:0.75rem;color:var(--plomo-claro);margin-top:3px">${haceRato(n.created_at)}</div>
      </div>
    </div>
  `).join('');
}

// Abrir/Cerrar panel de notificaciones
$('#btn-notificaciones').addEventListener('click', (e) => {
  e.stopPropagation();
  if(!estaLogado()){
    abrirSesion('entrar');
    avisar('Inicia sesión para ver tus notificaciones.');
    return;
  }
  const panel = $('#panel-notificaciones');
  panel.hidden = !panel.hidden;
  
  if(!panel.hidden){
    // Marcar como leídas automáticamente al abrir
    const idsNoLeidas = estado.notificaciones.filter(n => !n.leida).map(n => n.id);
    if(idsNoLeidas.length > 0){
      estado.notificaciones.forEach(n => n.leida = true);
      pintarNotificaciones(); // Oculta el punto rojo al instante
      db.from('notificaciones').update({ leida: true }).in('id', idsNoLeidas).then(()=>{});
    }
  }
});

// Cerrar el panel si se hace clic fuera
document.addEventListener('click', (e) => {
  const panel = $('#panel-notificaciones');
  if(panel && !panel.hidden && !e.target.closest('.contenedor-notificaciones')){
    panel.hidden = true;
  }
});

/* ------------------------------------------------------------
   E. PORTADA Y DEBATE (Vistas)
   ------------------------------------------------------------ */
const TINTES = ['#3B2EEA','#9A93F4','#C9C5F9','#E4E2FC','#F0EFFE'];

function debateDelDia(){ return estado.historias.find(h => h.destacada) || estado.historias[0]; }
function pintarDestacado(){
  const h = debateDelDia(); if(!h) return;
  $('#debate-dia').innerHTML = `
    <div class="destacado__linea"><span class="destacado__marca"><span class="pulso"></span>Debate del día</span><span class="categoria">${esc(h.categoria)}</span><span class="meta">${haceRato(h.created_at)}</span></div>
    <h2 class="destacado__pregunta" id="titulo-debate-dia">${esc(h.pregunta)}</h2>
    <p class="destacado__resumen">${esc(h.cuerpo[0].slice(0,190))}…</p>
    <div class="destacado__acciones">
      <button class="btn btn--principal" data-ir="${h.id}">${haVotado(h.id) ? 'Seguir el debate' : 'Leer y votar'}</button>
      <span class="meta">${plural(totalVotos(h),'voto','votos')} · ${plural(contarComentarios(h.comentarios),'respuesta','respuestas')}</span>
    </div>`;
}

function miniEncuesta(h){
  const total = totalVotos(h);
  if(!haVotado(h.id)){
    return `<div class="mini"><p class="mini__aviso" style="margin:0"><svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>Resultados ocultos hasta que votes · ${total === 1 ? '1 persona ya lo ha hecho' : num(total) + ' personas ya lo han hecho'}</p></div>`;
  }
  const segmentos = (h.opciones || []).map((o,i) => `<span class="mini__seg" style="width:${total ? (o.votos/total*100).toFixed(1) : 0}%;background:${TINTES[i % TINTES.length]}"></span>`).join('');
  const leyenda = (h.opciones || []).map((o,i) => `<span class="mini__item"><span class="mini__punto" style="background:${TINTES[i % TINTES.length]}"></span><b>${total ? Math.round(o.votos/total*100) : 0}%</b> ${esc(o.texto.length > 34 ? o.texto.slice(0,34)+'…' : o.texto)}</span>`).join('');
  return `<div class="mini"><div class="mini__barra">${segmentos}</div><div class="mini__leyenda">${leyenda}</div></div>`;
}

function tarjeta(h){
  const reportada = estado.reportes.includes(h.id);
  return `
  <article class="tarjeta">
    <div class="tarjeta__cabecera"><span class="categoria">${esc(h.categoria)}</span><span class="meta">${haceRato(h.created_at)} · ${esc(h.autor)}</span></div>
    <h2 class="tarjeta__titulo"><a href="#${h.id}" data-ir="${h.id}">${esc(h.titulo)}</a></h2>
    <p class="tarjeta__previa">${esc(h.cuerpo[0])}</p><p class="tarjeta__pregunta">${esc(h.pregunta)}</p>
    ${miniEncuesta(h)}
    <div class="tarjeta__pie">
      <button class="accion" data-ir="${h.id}"><svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M14 10.2a1.8 1.8 0 0 1-1.8 1.8H5l-3 2.6V3.8A1.8 1.8 0 0 1 3.8 2h8.4A1.8 1.8 0 0 1 14 3.8Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg> ${plural(contarComentarios(h.comentarios),'respuesta','respuestas')}</button>
      <button class="accion" data-compartir="${h.id}"><svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 9.5 12 4M12 4H8.4M12 4v3.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 10v2.2A1.8 1.8 0 0 1 11.2 14H3.8A1.8 1.8 0 0 1 2 12.2V4.8A1.8 1.8 0 0 1 3.8 3H6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Compartir</button>
      <button class="accion accion--reportar" data-reportar="${h.id}" data-hecho="${reportada?'si':'no'}" style="margin-left:auto">${reportada ? 'Reportada' : 'Reportar'}</button>
    </div>
  </article>`;
}

function historiasVisibles(){
  const q = estado.busqueda.trim().toLowerCase();
  let lista = estado.historias.filter(h => {
    const okCat = estado.categoria === 'todas' || h.categoria === estado.categoria;
    const okBusq = !q || (h.titulo + ' ' + h.pregunta + ' ' + h.cuerpo.join(' ') + ' ' + h.categoria).toLowerCase().includes(q);
    return okCat && okBusq;
  });
  const respuestas = h => contarComentarios(h.comentarios);
  const minAprox = h => Math.max(1, (Date.now() - new Date(h.created_at).getTime()) / 60000);
  const ordenes = { tendencias: (a,b) => ((respuestas(b)*60 + totalVotos(b)) / (minAprox(b)+120)) - ((respuestas(a)*60 + totalVotos(a)) / (minAprox(a)+120)), debatidas: (a,b) => respuestas(b) - respuestas(a), nuevas: (a,b) => new Date(b.created_at) - new Date(a.created_at), votadas: (a,b) => totalVotos(b) - totalVotos(a) };
  return lista.sort(ordenes[estado.orden]);
}

function pintarFeed(){
  const lista = historiasVisibles();
  const cont = $('#feed');
  if(!lista.length){ cont.innerHTML = `<div class="vacio"><h3>Ninguna historia encaja con esa búsqueda</h3><p>Prueba con otra palabra o cambia de temática.</p></div>`; return; }
  cont.innerHTML = lista.map(tarjeta).join('');
}

function pintarCategorias(){
  const cuenta = c => estado.historias.filter(h => h.categoria === c).length;
  $('#chips-categoria').innerHTML = ['todas', ...CATEGORIAS].map(c => `<button class="chip" data-categoria="${esc(c)}" aria-pressed="${estado.categoria===c}">${c === 'todas' ? 'Todas' : esc(c)}</button>`).join('');
  $('#lista-tematicas').innerHTML = CATEGORIAS.map(c => `<li><button data-categoria="${esc(c)}">${esc(c)} <span>${cuenta(c)}</span></button></li>`).join('');
  $('#tema-cabecera').innerHTML = `<option value="todas">Todas las temáticas</option>` + CATEGORIAS.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  $('#tema-cabecera').value = estado.categoria;
}

function abrirDebate(id){
  const h = estado.historias.find(x => x.id === id); if(!h) return;
  estado.actual = id; estado.ordenCom = 'relevancia';
  $('#vista-feed').hidden = true; $('#vista-debate').hidden = false;
  pintarDebate(); window.scrollTo({top:0});
}

function volverAlFeed(){
  estado.actual = null; $('#vista-debate').hidden = true; $('#vista-feed').hidden = false;
  pintarDestacado(); pintarFeed();
}

function pintarDebate(){
  const h = estado.historias.find(x => x.id === estado.actual); if(!h) return;
  pintarRelato(h); pintarEncuesta(h); pintarEditor(h); pintarHilos(h); pintarLateralDebate(h);
}

function pintarRelato(h){
  const reportada = estado.reportes.includes(h.id);
  $('#hoja-relato').innerHTML = `
    <div class="tarjeta__cabecera"><span class="categoria">${esc(h.categoria)}</span><span class="meta">${esc(h.autor)} · ${haceRato(h.created_at)}</span></div>
    <h1 class="hoja__titulo">${esc(h.titulo)}</h1><div class="relato">${h.cuerpo.map(p => `<p>${esc(p)}</p>`).join('')}</div>
    <p class="pregunta-grande">${esc(h.pregunta)}</p>
    <div class="tarjeta__pie" style="margin-top:20px">
      <button class="accion" data-compartir="${h.id}">Compartir</button>
      <button class="accion accion--reportar" data-reportar="${h.id}" data-hecho="${reportada?'si':'no'}">${reportada ? 'Reportada' : 'Reportar historia'}</button>
    </div>`;
}

function pintarEncuesta(h){
  const total = totalVotos(h); const mio = miVoto(h.id); let cuerpo;
  if(!mio){
    cuerpo = `<div class="opciones">` + h.opciones.map(o => `<button class="opcion" data-votar="${o.id}"><span class="opcion__marca"></span><span>${esc(o.texto)}</span></button>`).join('') + `</div><p class="aviso-sesgo"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style="flex:0 0 auto;margin-top:2px"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 7.2v4M8 4.8v.9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg> Los resultados aparecen en cuanto votes. Se ocultan antes para que la mayoría no decida por ti.</p>`;
  }else{
    const opcionMia = h.opciones.find(o => o.id === mio);
    cuerpo = `<div class="opciones">` + h.opciones.map(o => {
        const pct = total ? (o.votos / total * 100) : 0; const esMio = o.id === mio;
        return `<div class="resultado ${esMio ? 'resultado--mio' : ''}"><span class="resultado__relleno" data-ancho="${pct.toFixed(1)}"></span><span class="resultado__fila"><span class="resultado__texto">${esc(o.texto)}</span>${esMio ? '<span class="resultado__tuyo">tu voto</span>' : ''}<span class="resultado__pct">${pct.toFixed(1)}%</span></span></div>`;
      }).join('') + `</div><div class="encuesta__pie"><span class="meta">${plural(total,'voto','votos')}${opcionMia ? (opcionMia.votos === 1 ? ' · nadie más ha votado lo mismo que tú' : ' · ' + num(opcionMia.votos - 1) + ' han votado lo mismo que tú') : ''}</span><span class="meta">Un voto por cuenta</span></div>`;
  }
  $('#modulo-encuesta').innerHTML = `<div class="encuesta__cabecera"><h3 id="titulo-encuesta">${mio ? 'Así ha votado la gente' : 'Vota antes de leer a los demás'}</h3>${mio ? '' : `<span class="meta">${plural(total,'voto','votos')}</span>`}</div>${cuerpo}`;
  requestAnimationFrame(() => { $$('#modulo-encuesta .resultado__relleno').forEach(b => b.style.width = b.dataset.ancho + '%'); });
}

function pintarEditor(h){
  const mio = miVoto(h.id);
  const selector = mio ? '' : `<div class="voto-rapido"><label for="voto-editor">Vota también:</label><select id="voto-editor"><option value="">Sin voto</option>${h.opciones.map(o => `<option value="${o.id}">${esc(o.texto)}</option>`).join('')}</select></div>`;
  $('#modulo-editor').innerHTML = `<h3 id="titulo-editor" style="font-size:var(--t-md);margin-bottom:12px">${estaLogado() ? 'Argumenta tu postura' : 'Entra para responder'}</h3>
    <div class="editor__barra" role="toolbar" aria-label="Formato del texto"><button class="herramienta" data-formato="negrita" title="Negrita"><b>B</b></button><button class="herramienta" data-formato="cursiva" title="Cursiva"><i>I</i></button><button class="herramienta" data-formato="cita" title="Citar">&ldquo; &rdquo;</button><span class="meta" style="margin-left:auto;padding-right:8px">Escribe el porqué, no solo el qué</span></div>
    <label for="texto-respuesta" class="solo-lectores">Tu respuesta</label><textarea id="texto-respuesta" placeholder="${estaLogado() ? 'Explica qué harías tú y qué te hace dudar…' : 'Inicia sesión para debatir.'}"></textarea>
    <div class="editor__pie">${selector || '<span class="meta">Publicas como <b style="color:var(--carbon)">' + esc(estado.usuario || 'invitado') + '</b></span>'}<button class="btn btn--principal" id="btn-publicar-respuesta">Publicar respuesta</button></div>`;
}

function pintarComentario(c, h){
  const opcion = h.opciones.find(o => o.id === c.voto);
  const miV = estado.votosCom[c.id] || 0;
  const reportado = estado.reportes.includes(c.id);
  const respuestas = ordenarComentarios(c.respuestas || []);
  return `<div class="comentario" id="${c.id}">
    <div class="comentario__cabecera"><span class="avatar" style="width:26px;height:26px;font-size:11px">${esc(c.autor.slice(0,2).toUpperCase())}</span><span class="comentario__autor">${esc(c.autor)}</span>${opcion ? `<span class="insignia-voto">votó <b>${esc(opcion.texto.length>24 ? opcion.texto.slice(0,24)+'…' : opcion.texto)}</b></span>` : ''}<span class="meta">${haceRato(c.created_at)}</span></div>
    <div class="comentario__cuerpo">${formatearTexto(c.texto)}</div>
    <div class="comentario__acciones">
      <span class="votos">
        <button data-voto-com="${c.id}" data-dir="1" aria-pressed="${miV===1}" aria-label="A favor"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.2 13 9H3Z" fill="${miV===1?'currentColor':'none'}" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button><span class="votos__conteo">${c.arriba - c.abajo}</span><button class="abajo" data-voto-com="${c.id}" data-dir="-1" aria-pressed="${miV===-1}" aria-label="En contra"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12.8 3 7h10Z" fill="${miV===-1?'currentColor':'none'}" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button>
      </span>
      <button class="accion" data-responder="${c.id}">Responder</button><button class="accion accion--reportar" data-reportar="${c.id}" data-hecho="${reportado?'si':'no'}">${reportado ? 'Reportado' : 'Reportar'}</button>
    </div>
    <div class="caja-respuesta" data-caja="${c.id}" hidden><label for="resp-${c.id}" class="solo-lectores">Respuesta a ${esc(c.autor)}</label><textarea id="resp-${c.id}" placeholder="Responde a ${esc(c.autor)}…"></textarea><div class="caja-respuesta__pie"><button class="btn btn--linea btn--pequeno" data-cancelar-respuesta="${c.id}">Cancelar</button><button class="btn btn--principal btn--pequeno" data-enviar-respuesta="${c.id}">Responder</button></div></div>
    ${respuestas.length ? `<div class="respuestas">${respuestas.map(r => pintarComentario(r, h)).join('')}</div>` : ''}
  </div>`;
}

function ordenarComentarios(lista){
  const copia = lista.slice();
  return estado.ordenCom === 'nuevos' ? copia.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) : copia.sort((a,b) => (b.arriba - b.abajo) - (a.arriba - a.abajo));
}
function pintarHilos(h){
  const lista = ordenarComentarios(h.comentarios || []);
  $('#titulo-hilos').textContent = `Debate (${contarComentarios(h.comentarios)})`;
  $('#hilos').innerHTML = lista.length ? lista.map(c => pintarComentario(c, h)).join('') : `<div class="vacio"><h3>Nadie ha argumentado todavía</h3><p>El primer comentario marca el tono de todo el hilo.</p></div>`;
  $$('#orden-comentarios button').forEach(b => b.setAttribute('aria-pressed', b.dataset.ordenCom === estado.ordenCom));
}
function pintarLateralDebate(h){
  const total = totalVotos(h);
  $('#panel-contexto').innerHTML = `<h3>Sobre esta historia</h3><ul class="lista-tematicas"><li><button type="button" style="cursor:default">Publicada <span>${haceRato(h.created_at)}</span></button></li><li><button type="button" style="cursor:default">Votos <span>${num(total)}</span></button></li><li><button type="button" style="cursor:default">Respuestas <span>${contarComentarios(h.comentarios)}</span></button></li><li><button type="button" style="cursor:default">Tu voto <span>${miVoto(h.id) ? 'emitido' : 'pendiente'}</span></button></li></ul>`;
  const otros = estado.historias.filter(x => x.id !== h.id).slice(0,4);
  $('#relacionados').innerHTML = otros.map(o => `<li><button data-ir="${o.id}">${esc(o.titulo.length>52 ? o.titulo.slice(0,52)+'…' : o.titulo)}<span>${contarComentarios(o.comentarios)}</span></button></li>`).join('');
}
/* --- VISTA DE PERFIL --- */
async function abrirPerfil(){
  if(!estaLogado()){
    abrirModal();
    return;
  }
  $('#vista-feed').hidden = true;
  $('#vista-debate').hidden = true;
  if($('#vista-admin')) $('#vista-admin').hidden = true;
  $('#vista-perfil').hidden = false;
  window.scrollTo({ top: 0 });

  const alias = estado.usuario || 'Usuario';
  $('#perfil-nombre').textContent = alias;
  $('#perfil-email').textContent = estado.userAuth?.email || '';
  $('#perfil-avatar-grande').textContent = alias.slice(0, 2).toUpperCase();

  // Calcular estadísticas locales
  const votosTotales = Object.keys(estado.votosLocales || {}).length;
  $('#perfil-total-votos').textContent = votosTotales;

  // Contar comentarios del usuario en la base de datos
  try {
    const { count, error } = await db
      .from('comentarios')
      .select('*', { count: 'exact', head: true })
      .eq('autor', alias);
    $('#perfil-total-comentarios').textContent = error ? 0 : (count || 0);
  } catch(e) {
    $('#perfil-total-comentarios').textContent = 0;
  }
}
/* --- PANEL DE ADMINISTRACIÓN --- */
function abrirAdmin(){
  if(!estaLogado() || !estado.userAuth || estado.userAuth.email !== EMAIL_ADMIN){
    avisar('Acceso restringido al administrador.');
    volverAlFeed();
    return;
  }
  $('#vista-feed').hidden = true;
  $('#vista-debate').hidden = true;
  $('#vista-admin').hidden = false;
  window.scrollTo({ top: 0 });
}

async function publicarHistoriaAdmin(e){
  e.preventDefault();
  const btn = $('#btn-submit-historia');
  btn.disabled = true;
  btn.textContent = 'Publicando en la nube…';

  const titulo = $('#admin-titulo').value.trim();
  const categoria = $('#admin-categoria').value;
  const cuerpoTexto = $('#admin-cuerpo').value.trim();
  const pregunta = $('#admin-pregunta').value.trim();
  const destacada = $('#admin-destacada').checked;

  const op1 = $('#admin-op1').value.trim();
  const op2 = $('#admin-op2').value.trim();
  const op3 = $('#admin-op3').value.trim();

  const parrafos = cuerpoTexto.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const idHistoria = 'h_' + Date.now();

  try {
    const { error: errH } = await db.from('historias').insert({
      id: idHistoria,
      titulo,
      categoria,
      cuerpo: parrafos,
      pregunta,
      autor: estado.usuario || 'Admin',
      destacada
    });
    if(errH) throw errH;

    const opcionesAInsertar = [
      { id: 'o1', historia_id: idHistoria, texto: op1, votos: 0 },
      { id: 'o2', historia_id: idHistoria, texto: op2, votos: 0 }
    ];
    if(op3) opcionesAInsertar.push({ id: 'o3', historia_id: idHistoria, texto: op3, votos: 0 });

    const { error: errO } = await db.from('opciones').insert(opcionesAInsertar);
    if(errO) throw errO;

    avisar('¡Historia publicada con éxito!');
    $('#form-crear-historia').reset();

    await cargarDatosSupabase();
    location.hash = '';
    volverAlFeed();
  } catch(err) {
    console.error('Error publicando historia:', err);
    avisar('Error al guardar: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publicar dilema ahora';
  }
}
/* --- ACCIONES EN BASE DE DATOS --- */
async function votar(idHistoria, idOpcion){
  if(haVotado(idHistoria)) return;
  const h = estado.historias.find(x => x.id === idHistoria); const o = h && h.opciones.find(x => x.id === idOpcion);
  if(!o) return; o.votos = (o.votos || 0) + 1; estado.votos[idHistoria] = idOpcion;
  guardarLocal(); pintarEncuesta(h); pintarEditor(h); pintarLateralDebate(h); avisar('Voto registrado.');
  try { await db.rpc('registrar_voto', { p_opcion_id: idOpcion }); } catch(e){ console.error(e); }
}

async function votarComentario(idCom, dir){
  const h = estado.historias.find(x => x.id === estado.actual); const c = buscarComentario(h.comentarios, idCom);
  if(!c) return;
  const previo = estado.votosCom[idCom] || 0;
  if(previo === 1) c.arriba--; else if(previo === -1) c.abajo--;
  if(previo === dir){ delete estado.votosCom[idCom]; }else{ if(dir === 1) c.arriba++; else c.abajo++; estado.votosCom[idCom] = dir; }
  guardarLocal(); pintarHilos(h);
  try { await db.from('comentarios').update({ arriba: c.arriba, abajo: c.abajo }).eq('id', idCom); } catch(e){ console.error('Error votando comentario:', e); }
}

async function publicarRespuesta(texto, idPadre){
  if(!estaLogado()){ abrirSesion('entrar'); avisar('Inicia sesión para responder.'); return false; }
  if(!texto.trim()){ avisar('Escribe tu respuesta.'); return false; }
  const h = estado.historias.find(x => x.id === estado.actual);
  const nuevo = { id: idNuevo('c'), historia_id: h.id, padre_id: idPadre || null, autor: estado.usuario, texto: texto.trim(), voto_opcion: miVoto(h.id), arriba: 1, abajo: 0, created_at: new Date().toISOString(), respuestas: [] };

  estado.votosCom[nuevo.id] = 1; guardarLocal();
  
  if(idPadre){
    const padre = buscarComentario(h.comentarios, idPadre);
    padre.respuestas = padre.respuestas || []; padre.respuestas.unshift(nuevo);
    // DISPARAR NOTIFICACIÓN SI NO ES A SÍ MISMO
    if(padre.autor !== estado.usuario){
      db.from('notificaciones').insert({ usuario_destino: padre.autor, actor: estado.usuario, historia_id: h.id }).then(()=>{});
    }
  }else{
    h.comentarios.unshift(nuevo);
  }
  pintarHilos(h); pintarLateralDebate(h); avisar('Respuesta publicada.');

  try { await db.from('comentarios').insert({ id: nuevo.id, historia_id: nuevo.historia_id, padre_id: nuevo.padre_id, autor: nuevo.autor, texto: nuevo.texto, voto_opcion: nuevo.voto_opcion, arriba: 1, abajo: 0 }); } catch(e){ console.error('Error publicando comentario:', e); }
  return true;
}

function reportar(id){
  if(estado.reportes.includes(id)){ avisar('Ya reportado. En revisión.'); return; }
  estado.reportes.push(id); guardarLocal(); avisar('Reportado al equipo de moderación.');
  if(estado.actual){ pintarDebate(); } else { pintarFeed(); }
}

function compartir(id){
  const h = estado.historias.find(x => x.id === id); const url = location.origin + location.pathname + '#' + id;
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(() => avisar('Enlace copiado: ' + h.titulo.slice(0,35) + '…'), () => avisar('Enlace: ' + url)); }else{ avisar('Enlace: ' + url); }
}

/* ------------------------------------------------------------
   F. AUTENTICACIÓN
   ------------------------------------------------------------ */
let veloActivo = null;
function abrirModal(sel){ veloActivo = $(sel); veloActivo.hidden = false; document.body.style.overflow = 'hidden'; const primero = veloActivo.querySelector('input:not([hidden]),select'); if(primero) setTimeout(() => primero.focus(), 40); }
function cerrarModal(){ if(!veloActivo) return; veloActivo.hidden = true; document.body.style.overflow = ''; veloActivo = null; }

function cambiarModoAuth(modo){
  estado.modoModal = modo; const esRegistro = modo === 'registro';
  $('#titulo-sesion').textContent = esRegistro ? 'Crea tu cuenta' : 'Entra en Philotopic';
  $('#desc-sesion').textContent = esRegistro ? 'Elige tu nombre de usuario para votar y comentar.' : 'Vota en dilemas abiertos y comparte tu perspectiva moral.';
  $('#s-submit').textContent = esRegistro ? 'Crear cuenta' : 'Iniciar sesión';
  $('#campo-usuario').hidden = !esRegistro; $('#campo-confirmar').hidden = !esRegistro;
  $('#tab-login').setAttribute('aria-selected', !esRegistro); $('#tab-registro').setAttribute('aria-selected', esRegistro);

  const switchText = $('#auth-switch-text');
  if (switchText) {
    switchText.innerHTML = esRegistro ? `¿Ya tienes cuenta? <button type="button" class="link-inline" id="btn-switch-modo">Inicia sesión</button>` : `¿No tienes cuenta? <button type="button" class="link-inline" id="btn-switch-modo">Regístrate</button>`;
    $('#btn-switch-modo').addEventListener('click', () => cambiarModoAuth(esRegistro ? 'entrar' : 'registro'));
  }
  $('#s-error').hidden = true;
}

function abrirSesion(modo = 'entrar'){
  cambiarModoAuth(modo);
  $('#s-email').value = ''; $('#s-password').value = ''; if($('#s-usuario')) $('#s-usuario').value = ''; if($('#s-password-confirm')) $('#s-password-confirm').value = '';
  $$('.btn-toggle-password').forEach(btn => resetearOjoContrasena(btn));
  abrirModal('#velo-sesion');
}

function alternarVerContrasena(btn) {
  const targetId = btn.dataset.target; const input = document.getElementById(targetId); if (!input) return;
  const esPassword = input.type === 'password'; input.type = esPassword ? 'text' : 'password';
  btn.innerHTML = esPassword ? `<svg class="icon-ojo" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>` : `<svg class="icon-ojo" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  btn.setAttribute('aria-label', esPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
}

function resetearOjoContrasena(btn){
  const targetId = btn.dataset.target; const input = document.getElementById(targetId); if(input) input.type = 'password';
  btn.innerHTML = `<svg class="icon-ojo" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

function traducirErrorAuth(error){
  const msg = (error && error.message) || '';
  if(/invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.'; if(/already registered/i.test(msg)) return 'Ya existe una cuenta con ese correo.'; if(/password should be at least/i.test(msg)) return 'La contraseña necesita al menos 6 caracteres.';
  return msg || 'Ha ocurrido un error. Inténtalo de nuevo.';
}

async function procesarAuth() {
  const errorEl = $('#s-error'); errorEl.hidden = true;
  const email = $('#s-email').value.trim(); const password = $('#s-password').value;
  const username = $('#s-usuario') ? $('#s-usuario').value.trim() : ''; const confirmPassword = $('#s-password-confirm') ? $('#s-password-confirm').value : '';

  if (!email || !password) { errorEl.textContent = 'Introduce correo y contraseña.'; errorEl.hidden = false; return; }

  if (estado.modoModal === 'registro') {
    if (!username || username.length < 3) { errorEl.textContent = 'El nombre de usuario es obligatorio.'; errorEl.hidden = false; return; }
    if (password !== confirmPassword) { errorEl.textContent = 'Las contraseñas no coinciden.'; errorEl.hidden = false; return; }
    avisar('Creando cuenta…');
    const { data, error } = await db.auth.signUp({ email, password, options: { data: { username: username.replace(/\s+/g, '_') } } });
    if (error) { errorEl.textContent = traducirErrorAuth(error); errorEl.hidden = false; return; }
    if (data.user) { establecerSesion(data.user); cerrarModal(); avisar('Cuenta creada con éxito. Bienvenido.'); }
  } else {
    avisar('Iniciando sesión…');
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) { errorEl.textContent = traducirErrorAuth(error); errorEl.hidden = false; return; }
    if (data.user) { establecerSesion(data.user); cerrarModal(); avisar('Sesión iniciada.'); }
  }
}

async function loginConGoogle(){ const { error } = await db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } }); if(error) avisar('Error conectando con Google'); }

async function salir(){
  await db.auth.signOut();
  establecerSesion(null);
  avisar('Has cerrado sesión.');
}

function establecerSesion(user){
  estado.userAuth = user;
  if(user){
    estado.usuario = (user.user_metadata && user.user_metadata.username) || (user.email ? user.email.split('@')[0] : 'usuario');
    cargarNotificaciones();
  } else {
    estado.usuario = null;
    estado.notificaciones = [];
    pintarNotificaciones();
  }
  pintarPerfil();
  if(estado.actual) pintarDebate();
}

function pintarPerfil(){
  const invitado = $('#zona-invitado'), perfil = $('#zona-perfil');
  if(estaLogado()){
    invitado.hidden = true; invitado.style.display = 'none';
    perfil.hidden = false; perfil.textContent = estado.usuario.slice(0,2).toUpperCase(); perfil.setAttribute('aria-label', 'Cerrar sesión');
  }else{
    invitado.hidden = false; invitado.style.display = 'flex'; perfil.hidden = true;
  }
}

/* ------------------------------------------------------------
   G. EVENTOS E INICIO
   ------------------------------------------------------------ */
document.addEventListener('click', ev => {
  const t = ev.target; const el = sel => t.closest(sel);

  // Clic en una notificación del panel
  const noti = el('[data-ir-noti]');
  if(noti){
    ev.preventDefault();
    const n = estado.notificaciones.find(x => x.id === noti.dataset.irNoti);
    if(n){ $('#panel-notificaciones').hidden = true; abrirDebate(n.historia_id); }
    return;
  }

  const ir = el('[data-ir]'); if(ir){ ev.preventDefault(); abrirDebate(ir.dataset.ir); return; }
  const op = el('[data-votar]'); if(op){ votar(estado.actual, op.dataset.votar); return; }
  const vc = el('[data-voto-com]'); if(vc){ votarComentario(vc.dataset.votoCom, Number(vc.dataset.dir)); return; }

  const rp = el('[data-responder]');
  if(rp){
    if(!estaLogado()){ abrirSesion('entrar'); avisar('Entra para responder.'); return; }
    const caja = $(`[data-caja="${rp.dataset.responder}"]`); caja.hidden = !caja.hidden; if(!caja.hidden) caja.querySelector('textarea').focus(); return;
  }
  const cn = el('[data-cancelar-respuesta]'); if(cn){ $(`[data-caja="${cn.dataset.cancelarRespuesta}"]`).hidden = true; return; }
  const env = el('[data-enviar-respuesta]'); if(env){ publicarRespuesta($(`#resp-${env.dataset.enviarRespuesta}`).value, env.dataset.enviarRespuesta); return; }

  const sh = el('[data-compartir]'); if(sh){ compartir(sh.dataset.compartir); return; }
  const rep = el('[data-reportar]'); if(rep){ reportar(rep.dataset.reportar); return; }

  const cat = el('[data-categoria]');
  if(cat){ estado.categoria = cat.dataset.categoria; $('#tema-cabecera').value = estado.categoria; $$('#chips-categoria .chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.categoria === estado.categoria)); if(estado.actual) volverAlFeed(); else pintarFeed(); return; }
  
  const tab = el('[data-orden]'); if(tab){ estado.orden = tab.dataset.orden; $$('#pestanas-orden .pestana').forEach(p => p.setAttribute('aria-selected', p === tab)); pintarFeed(); return; }
  const oc = el('[data-orden-com]'); if(oc){ estado.ordenCom = oc.dataset.ordenCom; pintarHilos(estado.historias.find(x => x.id === estado.actual)); return; }
  const fmt = el('[data-formato]'); if(fmt){ aplicarFormato(fmt.dataset.formato); return; }
  const ses = el('[data-abrir-sesion]'); if(ses){ abrirSesion(ses.dataset.abrirSesion); return; }
  if(el('[data-cerrar]')){ cerrarModal(); return; }
  if(t.classList && t.classList.contains('velo')){ cerrarModal(); return; }
});

function aplicarFormato(tipo){
  const ta = $('#texto-respuesta'); if(!ta) return; const ini = ta.selectionStart, fin = ta.selectionEnd, sel = ta.value.slice(ini, fin) || 'texto';
  const envoltura = {negrita:['**','**'], cursiva:['*','*'], cita:['> ','']}[tipo]; ta.value = ta.value.slice(0,ini) + envoltura[0] + sel + envoltura[1] + ta.value.slice(fin); ta.focus(); ta.setSelectionRange(ini + envoltura[0].length, ini + envoltura[0].length + sel.length);
}

document.addEventListener('click', async ev => {
  if(!ev.target.closest('#btn-publicar-respuesta')) return;
  const ta = $('#texto-respuesta'), sel = $('#voto-editor');
  if(sel && sel.value) votar(estado.actual, sel.value);
  const publicado = await publicarRespuesta(ta ? ta.value : '', null);
  if(publicado && ta) ta.value = '';
});

$('#tab-login').addEventListener('click', () => cambiarModoAuth('entrar')); $('#tab-registro').addEventListener('click', () => cambiarModoAuth('registro'));
$('#s-submit').addEventListener('click', procesarAuth); $('#btn-google').addEventListener('click', loginConGoogle);
$$('.btn-toggle-password').forEach(btn => { btn.addEventListener('click', () => alternarVerContrasena(btn)); });
$('#s-password').addEventListener('keydown', e => { if(e.key === 'Enter') procesarAuth(); });
if($('#s-password-confirm')) $('#s-password-confirm').addEventListener('keydown', e => { if(e.key === 'Enter') procesarAuth(); });

$('#form-buscar').addEventListener('submit', e => e.preventDefault());
$('#buscar').addEventListener('input', e => { estado.busqueda = e.target.value; if(estado.actual) volverAlFeed(); else pintarFeed(); });
$('#tema-cabecera').addEventListener('change', e => { estado.categoria = e.target.value; $$('#chips-categoria .chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.categoria === estado.categoria)); if(estado.actual) volverAlFeed(); else pintarFeed(); });
$('#btn-debate-dia').addEventListener('click', () => { const d = debateDelDia(); if(d) abrirDebate(d.id); });
$('#zona-perfil').addEventListener('click', () => { location.hash = 'perfil'; abrirPerfil(); });
$('#ir-inicio').addEventListener('click', e => { e.preventDefault(); volverAlFeed(); }); $('#btn-volver').addEventListener('click', e => { e.preventDefault(); volverAlFeed(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') cerrarModal(); });
$('#form-crear-historia').addEventListener('submit', publicarHistoriaAdmin);
$('#btn-volver-admin').addEventListener('click', e => { e.preventDefault(); location.hash = ''; volverAlFeed(); });
$('#btn-volver-perfil').addEventListener('click', e => { e.preventDefault(); location.hash = ''; volverAlFeed(); });
$('#btn-cerrar-sesion-perfil').addEventListener('click', () => { salir(); volverAlFeed(); });

// Inicialización
(async function iniciar(){
  db.auth.onAuthStateChange((event, session) => { establecerSesion(session ? session.user : null); });
  pintarPerfil();
  avisar('Cargando debates desde la nube…');
  const [resSesion] = await Promise.all([ db.auth.getSession(), cargarDatosSupabase() ]);
  establecerSesion(resSesion.data.session ? resSesion.data.session.user : null);
  pintarCategorias(); pintarDestacado(); pintarFeed();
  const destino = location.hash.slice(1);
  if(destino === 'admin'){
  abrirAdmin();
} else if(destino === 'perfil'){
  abrirPerfil();
} else if(destino && estado.historias.some(h => h.id === destino)){
  abrirDebate(destino);
}
})();