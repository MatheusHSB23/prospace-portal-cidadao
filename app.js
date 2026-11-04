/* ProSpace Health — Portal Web do Cidadão
 * Cliente Supabase com chave pública (Publishable/anon). Nunca usar service_role no navegador.
 */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const appRoot = $('#app');
  const modalRoot = $('#modal-root');
  const toastRegion = $('#toast-region');

  const state = {
    client: null,
    user: null,
    profile: null,
    page: 'home',
    authMode: 'login',
    authNotice: null,
    awaitingConfirmation: false,
    recoveryMode: false,
    routeToken: 0,
    profilePromise: null,
    loading: false,
    appointments: [],
    lastAppointment: null,
    booking: { units: [], services: [], unitId: '', serviceId: '', date: tomorrowISO(), slots: [], slotId: '', reason: '', symptoms: false },
    vaccineTab: 'vaccines',
    citizenLocation: null,
  };

  const titles = {
    home: ['Início', 'Resumo da sua jornada de saúde.'],
    services: ['Preciso de atendimento', 'Encontre o serviço mais adequado para sua necessidade.'],
    booking: ['Agendar atendimento', 'Escolha uma unidade, um serviço e um horário disponível.'],
    appointments: ['Meus atendimentos', 'Acompanhe seus agendamentos e protocolos.'],
    units: ['Unidades de saúde', 'Consulte os locais de atendimento disponíveis na rede.'],
    exams: ['Meus exames', 'Consulte o andamento e os resultados disponibilizados pela equipe.'],
    vaccines: ['Vacinas e medicamentos', 'Acompanhe seus registros de vacinação e pedidos de medicamentos.'],
    family: ['Minha família', 'Gerencie os vínculos familiares cadastrados nesta conta.'],
    requests: ['Minhas solicitações', 'Envie pedidos e acompanhe o andamento dos protocolos.'],
    campaigns: ['Campanhas de saúde', 'Conheça as campanhas e ações publicadas pela rede.'],
    notifications: ['Notificações', 'Acompanhe os avisos enviados para sua conta.'],
    profile: ['Meu perfil', 'Mantenha seus dados pessoais atualizados.'],
    confirmation: ['Agendamento registrado', 'Guarde o protocolo e apresente o QR Code na unidade.'],
  };

  const navGroups = [
    { label: 'Principal', items: [
      ['home', 'Início', 'home'],
      ['services', 'Preciso de atendimento', 'heart'],
      ['booking', 'Agendar atendimento', 'calendar-plus'],
      ['appointments', 'Meus atendimentos', 'calendar-check'],
    ]},
    { label: 'Minha saúde', items: [
      ['units', 'Unidades de saúde', 'hospital'],
      ['exams', 'Meus exames', 'flask'],
      ['vaccines', 'Vacinas e medicamentos', 'syringe'],
      ['family', 'Minha família', 'users'],
    ]},
    { label: 'Acompanhamento', items: [
      ['requests', 'Minhas solicitações', 'clipboard-list'],
      ['campaigns', 'Campanhas', 'megaphone'],
      ['notifications', 'Notificações', 'bell'],
      ['profile', 'Meu perfil', 'user'],
    ]},
  ];

  const iconPaths = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    heart: '<path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.3 4.3 0 0 1 12 6.5a4.3 4.3 0 0 1 8.8 2.3Z"/><path d="M12 8v5m-2.5-2.5h5"/>',
    'calendar-plus': '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 9.5h18M12 13v5m-2.5-2.5h5"/>',
    'calendar-check': '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 9.5h18m5 5 2 2 4-4"/>',
    hospital: '<path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16M2 21h20M9 21v-4h6v4M12 6v6m-3-3h6"/>',
    flask: '<path d="M9 3h6m-5 0v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3M8 15h8"/>',
    syringe: '<path d="m14 6 4 4m-7-1 6-6 4 4-6 6m-8 2 7-7m-9 9 2-2m-4 6 5-5m-2-4 4 4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m6.5-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7.5 0a4 4 0 0 0 0-8m4 18v-2a4 4 0 0 0-3-3.87"/>',
    'clipboard-list': '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M9 10h6m-6 4h6m-6 4h4"/>',
    megaphone: '<path d="m3 11 18-5v12L3 13zM7 14l2 7h4l-2-8M21 10v4"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    plus: '<path d="M12 5v14m-7-7h14"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 1M4 17l2 1a7 7 0 0 0 12.5-3"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    logout: '<path d="M10 17l5-5-5-5m5 5H3m10-9h5a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 19v2h16v-2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    phone: '<path d="M6 3h3l2 5-2 2a15 15 0 0 0 5 5l2-2 5 2v3a2 2 0 0 1-2 2C10 20 4 14 4 5a2 2 0 0 1 2-2Z"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 9.5h18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    alert: '<path d="M10.3 4.3 2.7 18a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    trash: '<path d="M3 6h18m-2 0-.8 14H5.8L5 6m4 0V3h6v3m-5 4v6m4-6v6"/>',
    family: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0m1-5a5 5 0 0 1 5 5"/>',
    qr: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><path d="M15 15h2v2h-2zm4 0h2v2h-2zm-4 4h2v2h-2zm4 0h2v2h-2z"/>',
    prescription: '<path d="M6 3h12v18H6zM9 8h6m-6 4h6m-6 4h3"/>',
  };

  function icon(name, cls = '') {
    return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.info}</svg>`;
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function relation(value) {
    if (Array.isArray(value)) return value[0] || {};
    return value && typeof value === 'object' ? value : {};
  }

  function todayISO() {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
  }

  function tomorrowISO() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
  }

  function dateLabel(value) {
    if (!value) return 'Não informado';
    const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime())) return esc(value);
    return new Intl.DateTimeFormat('pt-BR').format(d);
  }

  function dateTimeLabel(date, time) {
    return `${dateLabel(date)} • ${String(time || '').slice(0, 5) || '--:--'}`;
  }

  function timeLabel(value) { return String(value || '--:--').slice(0, 5); }

  function isFutureAppointment(row) {
    if (!row?.appointment_date) return false;
    const time = timeLabel(row.appointment_time);
    const point = new Date(`${row.appointment_date}T${time}:00`);
    return point.getTime() > Date.now();
  }

  function statusLabel(value) {
    const labels = {
      scheduled: 'Agendado', confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado', missed: 'Não compareceu',
      requested: 'Solicitado', processing: 'Em processamento', available: 'Resultado disponível', approved: 'Aprovado',
      available_for_pickup: 'Disponível para retirada', dispensed: 'Entregue', received: 'Recebido', in_review: 'Em análise',
      waiting_for_information: 'Aguardando informação', rejected: 'Não aprovado',
    };
    return labels[value] || String(value || 'Não informado').replaceAll('_', ' ');
  }

  function statusClass(value) {
    if (['confirmed', 'completed', 'available', 'approved', 'dispensed'].includes(value)) return 'success';
    if (['cancelled', 'missed', 'rejected'].includes(value)) return 'danger';
    if (['in_review', 'waiting_for_information', 'processing', 'available_for_pickup'].includes(value)) return 'warning';
    return 'neutral';
  }

  function initials(name) {
    const bits = String(name || 'Cidadão').trim().split(/\s+/).filter(Boolean);
    return bits.length > 1 ? `${bits[0][0]}${bits[bits.length - 1][0]}`.toUpperCase() : (bits[0] || 'C').slice(0, 2).toUpperCase();
  }

  function toast(message, kind = 'success') {
    const node = document.createElement('div');
    node.className = `toast ${kind === 'error' ? 'error' : kind === 'success' ? 'success' : ''}`;
    node.innerHTML = `${icon(kind === 'error' ? 'alert' : 'info')}<span>${esc(message)}</span>`;
    toastRegion.appendChild(node);
    window.setTimeout(() => node.remove(), 4600);
  }

  function friendlyError(error) {
    const message = error?.message || String(error || 'Erro desconhecido.');
    const normalized = message.toLowerCase();
    if (normalized.includes('invalid login credentials')) return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
    if (normalized.includes('email not confirmed')) return 'Seu e-mail ainda não foi confirmado. Confira a caixa de entrada ou reenvie o link.';
    if (normalized.includes('user already registered')) return 'Este e-mail já possui cadastro. Entre na sua conta ou recupere a senha.';
    if (normalized.includes('password should be')) return 'Use uma senha com pelo menos 8 caracteres.';
    if (normalized.includes('duplicate key') || normalized.includes('already exists')) return 'Já existe um cadastro com uma dessas informações. Confira o CPF ou os dados informados.';
    if (normalized.includes('horário não está mais disponível')) return message;
    if (normalized.includes('row-level security')) return 'A operação foi bloqueada pelas permissões do banco. Confira as políticas RLS do Supabase.';
    if (normalized.includes('failed to fetch')) return 'Não foi possível conectar ao Supabase. Confira a internet e a URL do projeto.';
    return message;
  }

  function assertResult(result) {
    if (result.error) throw result.error;
    return result.data;
  }

  function openModal(title, body, widthClass = '') {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-card ${widthClass}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><h2>${esc(title)}</h2><button class="modal-close" type="button" data-action="close-modal" aria-label="Fechar">${icon('close')}</button></div><div class="modal-body">${body}</div></section></div>`;
  }

  function closeModal() { modalRoot.innerHTML = ''; }

  function showLoading(message = 'Carregando seus dados…') {
    return `<div class="loading-block"><div><div class="spinner"></div><p>${esc(message)}</p></div></div>`;
  }

  function emptyState(title, message, action = '') {
    return `<div class="empty-state"><div class="empty-icon">${icon('activity')}</div><h3>${esc(title)}</h3><p>${esc(message)}</p>${action}</div>`;
  }

  function errorState(error, retryPage = state.page) {
    return `<div class="notice">${icon('alert')}<div><strong>Não foi possível carregar estas informações.</strong><br>${esc(friendlyError(error))}<div style="margin-top:10px"><button class="btn btn-outline" data-page="${esc(retryPage)}">${icon('refresh')} Tentar novamente</button></div></div></div>`;
  }

  function pageLayout(title, subtitle, body, actions = '') {
    return `<div class="page-header"><div><div class="page-kicker">ProSpace Health • Cidadão</div><h1>${esc(title)}</h1><p>${esc(subtitle || '')}</p></div><div class="page-header-actions">${actions}</div></div>${body}`;
  }

  function navMarkup() {
    return navGroups.map(group => `<div class="nav-label">${esc(group.label)}</div><nav class="side-nav">${group.items.map(([page, label, iconName]) => `<button class="nav-item ${state.page === page ? 'active' : ''}" data-page="${page}" type="button">${icon(iconName)}<span>${esc(label)}</span>${page === 'notifications' && state.unreadCount ? `<small class="nav-count">${state.unreadCount}</small>` : ''}</button>`).join('')}</nav>`).join('');
  }

  function renderShell(content = showLoading()) {
    const name = state.profile?.full_name || state.user?.email || 'Cidadão';
    const [title, subtitle] = titles[state.page] || titles.home;
    appRoot.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-brand"><img src="assets/app-icon.png" alt=""><div><strong>ProSpace</strong><small>HEALTH • CIDADÃO</small></div></div>
          ${navMarkup()}
          <div class="nav-spacer"></div>
          <div class="sidebar-profile"><div class="avatar">${esc(initials(name))}</div><div><strong>${esc(name)}</strong><small>Portal do cidadão</small></div><button class="signout-small" data-action="signout" title="Sair">${icon('logout')}</button></div>
        </aside>
        <div class="mobile-scrim" id="mobile-scrim" data-action="close-drawer"></div>
        <section class="main-side">
          <header class="topbar">
            <div class="topbar-left">
              <button class="menu-toggle" type="button" data-action="toggle-drawer" aria-label="Abrir menu">${icon('menu')}</button>
              <div class="topbar-title"><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></div>
            </div>
            <div class="topbar-actions">
              <button class="top-icon-btn ${state.unreadCount ? 'notification-dot' : ''}" data-page="notifications" title="Notificações">${icon('bell')}</button>
              <div class="user-chip"><div class="avatar">${esc(initials(name))}</div><div class="user-copy"><strong>${esc(name)}</strong><small>${esc(state.user?.email || '')}</small></div></div>
            </div>
          </header>
          <main class="content" id="page-content">${content}</main>
          <footer class="app-footer">ProSpace Health • Portal do Cidadão • Seus dados são pessoais e protegidos.</footer>
        </section>
        <nav class="mobile-bottom">
          ${[['home','Início','home'],['booking','Agendar','calendar-plus'],['appointments','Atendimentos','calendar-check'],['profile','Perfil','user']].map(([page,label,iconName]) => `<button class="${state.page === page ? 'active' : ''}" data-page="${page}">${icon(iconName)}<span>${esc(label)}</span></button>`).join('')}
        </nav>
      </div>`;
  }

  function renderAuth() {
    state.recoveryMode = false;
    const mode = state.authMode;
    const register = mode === 'register';
    const forgot = mode === 'forgot';
    let title = register ? 'Crie sua conta' : forgot ? 'Recuperar senha' : 'Bem-vindo de volta';
    let subtitle = register ? 'Cadastre-se para acompanhar seus serviços de saúde.' : forgot ? 'Informe seu e-mail e enviaremos instruções para redefinir sua senha.' : 'Entre para acessar seus atendimentos e informações de saúde.';
    let form = '';
    if (forgot) {
      form = `<form id="forgot-form" class="auth-form"><div class="field"><label for="forgot-email">E-mail cadastrado</label><input id="forgot-email" name="email" type="email" required autocomplete="email" placeholder="voce@exemplo.com" value="${esc(state.lastEmail || '')}"></div><button class="auth-submit" type="submit">Enviar link de recuperação</button><button class="text-button" type="button" data-action="auth-login" style="margin-top:16px">Voltar para entrar</button></form>`;
    } else {
      form = `<div class="auth-tabs"><button class="${!register ? 'active' : ''}" type="button" data-action="auth-login">Entrar</button><button class="${register ? 'active' : ''}" type="button" data-action="auth-register">Criar conta</button></div>
        <form id="auth-form" class="auth-form">
          ${register ? `<div class="form-grid"><div class="field full"><label for="auth-name">Nome completo</label><input id="auth-name" name="full_name" type="text" required minlength="3" autocomplete="name" placeholder="Seu nome completo"></div><div class="field"><label for="auth-cpf">CPF (opcional)</label><input id="auth-cpf" name="cpf" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00"></div><div class="field"><label for="auth-phone">Telefone</label><input id="auth-phone" name="phone" type="tel" autocomplete="tel" placeholder="(00) 00000-0000"></div></div>` : ''}
          <div class="field"><label for="auth-email">E-mail</label><input id="auth-email" name="email" type="email" required autocomplete="email" placeholder="voce@exemplo.com" value="${esc(state.lastEmail || '')}"></div>
          <div class="field"><label for="auth-password">Senha</label><input id="auth-password" name="password" type="password" required minlength="8" autocomplete="${register ? 'new-password' : 'current-password'}" placeholder="${register ? 'Pelo menos 8 caracteres' : 'Sua senha'}"></div>
          ${register ? `<div class="field"><label for="auth-confirm">Confirme a senha</label><input id="auth-confirm" name="confirm_password" type="password" required minlength="8" autocomplete="new-password" placeholder="Digite a senha novamente"></div>` : `<div class="form-inline"><span class="field-hint">Acesso pessoal e protegido</span><button class="text-button" type="button" data-action="auth-forgot">Esqueci minha senha</button></div>`}
          <button class="auth-submit" type="submit">${register ? 'Criar minha conta' : 'Entrar na minha conta'}</button>
        </form>
        ${state.awaitingConfirmation ? `<div class="auth-note">Seu cadastro foi criado. Confirme o e-mail enviado para liberar o acesso. Não recebeu? <button class="text-button" type="button" data-action="resend-confirmation">Reenviar link</button></div>` : ''}`;
    }

    const notice = state.authNotice ? `<div class="auth-note ${state.authNotice.kind === 'error' ? 'error' : ''}">${esc(state.authNotice.text)}</div>` : '';
    appRoot.innerHTML = `<main class="auth-layout">
      <section class="auth-story"><div class="auth-story-content"><img class="auth-logo" src="assets/prospace-health-logo.png" alt="ProSpace Health"><div><h1>Cuidado de saúde, mais simples.</h1><p>Acesse serviços públicos de saúde, agende atendimentos e acompanhe suas informações em um só lugar.</p></div></div><div class="auth-perks"><span>${icon('calendar-check')} Agendamentos</span><span>${icon('shield')} Seus dados protegidos</span><span>${icon('activity')} Acompanhamento</span></div></section>
      <section class="auth-panel"><div class="auth-card"><div class="auth-brand-mobile"><img src="assets/app-icon.png" alt=""><div><strong>ProSpace Health</strong><small>Portal do cidadão</small></div></div><div class="auth-kicker">Portal do cidadão</div><h2>${esc(title)}</h2><p class="auth-subtitle">${esc(subtitle)}</p>${form}${notice}<div class="auth-security">${icon('shield')}<span>Seus dados são pessoais. Nunca compartilhe sua senha ou códigos de acesso. Em caso de emergência, ligue 192 (SAMU).</span></div></div></section>
    </main>`;
  }

  function renderRecovery() {
    state.recoveryMode = true;
    appRoot.innerHTML = `<main class="auth-layout"><section class="auth-story"><div class="auth-story-content"><img class="auth-logo" src="assets/prospace-health-logo.png" alt="ProSpace Health"><div><h1>Quase lá.</h1><p>Defina uma nova senha para voltar a acessar sua conta com segurança.</p></div></div></section><section class="auth-panel"><div class="auth-card"><div class="auth-kicker">Segurança da conta</div><h2>Crie uma nova senha</h2><p class="auth-subtitle">Use pelo menos 8 caracteres e confirme a senha antes de salvar.</p><form id="reset-form"><div class="field"><label for="new-password">Nova senha</label><input id="new-password" name="password" type="password" minlength="8" required autocomplete="new-password"></div><div class="field"><label for="confirm-password">Confirme a nova senha</label><input id="confirm-password" name="confirm_password" type="password" minlength="8" required autocomplete="new-password"></div><button class="auth-submit" type="submit">Salvar nova senha</button></form></div></section></main>`;
  }

  async function handleSession(session) {
    if (!session?.user) {
      state.user = null; state.profile = null; state.appointments = [];
      renderAuth();
      return;
    }
    const userId = session.user.id;
    if (state.user?.id === userId && state.profile) return;
    if (state.profilePromise) {
      try { await state.profilePromise; } catch (_) { /* retry below when auth event fires again */ }
      if (state.user?.id === userId && state.profile) return;
    }
    state.profilePromise = (async () => {
      const result = await state.client.from('profiles').select('id,full_name,cpf,phone,birth_date,role').eq('id', userId).maybeSingle();
      if (result.error) throw result.error;
      const profile = result.data;
      if (!profile) throw new Error('O perfil do usuário não foi encontrado. Confira se o gatilho handle_new_user foi instalado no banco.');
      if (profile.role !== 'citizen') {
        state.authNotice = { kind: 'error', text: 'Esta conta está cadastrada como equipe de saúde ou administrador. Utilize o Portal de Gestão para esse tipo de acesso.' };
        await state.client.auth.signOut();
        state.user = null; state.profile = null;
        renderAuth();
        return;
      }
      state.user = session.user;
      state.profile = profile;
      const requestedPage = location.hash.replace(/^#\/?/, '');
      state.page = titles[requestedPage] ? requestedPage : 'home';
      await renderAuthenticatedPage();
    })();
    try { await state.profilePromise; }
    catch (error) {
      state.user = null; state.profile = null;
      await state.client.auth.signOut().catch(() => {});
      state.authNotice = { kind: 'error', text: friendlyError(error) };
      renderAuth();
    } finally { state.profilePromise = null; }
  }

  async function init() {
    const config = window.PROSPACE_CONFIG || {};
    if (!window.supabase?.createClient) {
      appRoot.innerHTML = `<main class="auth-layout"><section class="auth-panel"><div class="auth-card"><h2>Biblioteca de conexão indisponível</h2><p class="auth-subtitle">Não foi possível carregar o cliente Supabase. Confira a conexão com a internet e recarregue a página.</p></div></section></main>`;
      return;
    }
    const url = String(config.supabaseUrl || '').trim().replace(/\/+$/, '');
    const key = String(config.supabaseAnonKey || '').trim();
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) || !key || /service_role|sb_secret_/i.test(key)) {
      appRoot.innerHTML = `<main class="auth-layout"><section class="auth-panel"><div class="auth-card"><div class="auth-kicker">Configuração necessária</div><h2>Conecte o banco de dados</h2><p class="auth-subtitle">Abra <strong>supabase-config.js</strong> e informe a Project URL e a chave pública Publishable/anon do seu projeto Supabase. Nunca use service_role ou sb_secret_ no navegador.</p><button class="btn btn-outline" onclick="location.reload()">${icon('refresh')} Recarregar</button></div></section></main>`;
      return;
    }
    state.client = window.supabase.createClient(url, key, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true, flowType: 'pkce' },
    });

    state.client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        state.recoveryMode = true;
        renderRecovery();
        return;
      }
      if (state.recoveryMode && event === 'USER_UPDATED') return;
      if (event === 'SIGNED_OUT') {
        state.user = null; state.profile = null; state.appointments = [];
        if (!state.recoveryMode) renderAuth();
        return;
      }
      if (event !== 'INITIAL_SESSION' && session?.user) {
        handleSession(session);
      }
    });

    try {
      const { data, error } = await state.client.auth.getSession();
      if (error) throw error;
      if (data.session) await handleSession(data.session);
      else renderAuth();
    } catch (error) {
      state.authNotice = { kind: 'error', text: friendlyError(error) };
      renderAuth();
    }
  }

  async function renderAuthenticatedPage() {
    if (!state.user) { renderAuth(); return; }
    const token = ++state.routeToken;
    renderShell(showLoading());
    const renderers = {
      home: renderHome,
      services: renderServices,
      booking: renderBooking,
      appointments: renderAppointments,
      units: renderUnits,
      exams: renderExams,
      vaccines: renderVaccines,
      family: renderFamily,
      requests: renderRequests,
      campaigns: renderCampaigns,
      notifications: renderNotifications,
      profile: renderProfile,
      confirmation: renderConfirmation,
    };
    try {
      const html = await (renderers[state.page] || renderHome)();
      if (token !== state.routeToken) return;
      const content = $('#page-content');
      if (content) content.innerHTML = html;
      if (state.page === 'confirmation') renderQrCode();
      if (state.page === 'profile') bindProfileMasks();
      if (state.page === 'booking') bindBookingFormDefaults();
      if (state.page === 'notifications') state.unreadCount = 0;
    } catch (error) {
      if (token !== state.routeToken) return;
      const content = $('#page-content');
      if (content) content.innerHTML = pageLayout((titles[state.page] || titles.home)[0], (titles[state.page] || titles.home)[1], errorState(error));
    }
  }

  function navigate(page) {
    if (!titles[page]) page = 'home';
    closeDrawer();
    if (state.page === page && location.hash === `#${page}`) {
      renderAuthenticatedPage();
      return;
    }
    state.page = page;
    if (location.hash !== `#${page}`) history.replaceState(null, '', `#${page}`);
    renderAuthenticatedPage();
  }

  function closeDrawer() {
    $('#sidebar')?.classList.remove('open');
    $('#mobile-scrim')?.classList.remove('show');
  }

  function openDrawer() {
    $('#sidebar')?.classList.add('open');
    $('#mobile-scrim')?.classList.add('show');
  }

  async function signOut() {
    if (!state.client) return;
    const ok = window.confirm('Deseja sair da sua conta?');
    if (!ok) return;
    const { error } = await state.client.auth.signOut();
    if (error) toast(friendlyError(error), 'error');
  }

  async function submitAuth(form) {
    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim().toLowerCase();
    const password = String(fd.get('password') || '');
    state.lastEmail = email;
    state.authNotice = null;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { toast('Informe um e-mail válido.', 'error'); return; }
    const submit = $('button[type="submit"]', form);
    if (submit) { submit.disabled = true; submit.textContent = 'Aguarde…'; }
    try {
      if (state.authMode === 'register') {
        const fullName = String(fd.get('full_name') || '').trim();
        const cpf = String(fd.get('cpf') || '').replace(/\D/g, '');
        const phone = String(fd.get('phone') || '').trim();
        if (fullName.length < 3) throw new Error('Informe seu nome completo.');
        if (password.length < 8) throw new Error('Use uma senha com pelo menos 8 caracteres.');
        if (password !== String(fd.get('confirm_password') || '')) throw new Error('As senhas não coincidem.');
        const { data, error } = await state.client.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${location.origin}${location.pathname}`,
            data: { full_name: fullName, cpf: cpf || null, phone: phone || null },
          },
        });
        if (error) throw error;
        if (data.session) {
          await handleSession(data.session);
          toast('Cadastro concluído. Bem-vindo ao ProSpace Health!');
        } else {
          state.awaitingConfirmation = true;
          state.authMode = 'login';
          state.authNotice = { kind: 'success', text: 'Cadastro criado! Confirme o e-mail enviado para liberar o acesso. Confira também a pasta de spam.' };
          renderAuth();
        }
      } else {
        const { data, error } = await state.client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        state.awaitingConfirmation = false;
        await handleSession(data.session);
        if (state.user) toast('Acesso realizado com sucesso.');
      }
    } catch (error) {
      if (String(error?.message || '').toLowerCase().includes('email not confirmed')) {
        state.awaitingConfirmation = true;
      }
      state.authNotice = { kind: 'error', text: friendlyError(error) };
      renderAuth();
    }
  }

  async function resendConfirmation() {
    const email = state.lastEmail || $('#auth-email')?.value?.trim().toLowerCase();
    if (!email) { toast('Informe o e-mail utilizado no cadastro.', 'error'); return; }
    try {
      const { error } = await state.client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${location.origin}${location.pathname}` } });
      if (error) throw error;
      toast('Se a conta estiver pendente, um novo link será enviado. Confira também o spam.');
    } catch (error) { toast(friendlyError(error), 'error'); }
  }

  async function submitForgot(form) {
    const email = String(new FormData(form).get('email') || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast('Informe um e-mail válido.', 'error'); return; }
    try {
      const { error } = await state.client.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}${location.pathname}` });
      if (error) throw error;
      state.authMode = 'login';
      state.authNotice = { kind: 'success', text: 'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.' };
      renderAuth();
    } catch (error) { toast(friendlyError(error), 'error'); }
  }

  async function submitReset(form) {
    const fd = new FormData(form);
    const password = String(fd.get('password') || '');
    const confirmation = String(fd.get('confirm_password') || '');
    if (password.length < 8) { toast('Use uma senha com pelo menos 8 caracteres.', 'error'); return; }
    if (password !== confirmation) { toast('As senhas não coincidem.', 'error'); return; }
    const button = $('button[type="submit"]', form);
    if (button) { button.disabled = true; button.textContent = 'Salvando…'; }
    try {
      const { error } = await state.client.auth.updateUser({ password });
      if (error) throw error;
      await state.client.auth.signOut();
      state.recoveryMode = false;
      state.authNotice = { kind: 'success', text: 'Senha atualizada. Entre com a nova senha para continuar.' };
      renderAuth();
    } catch (error) { toast(friendlyError(error), 'error'); if (button) { button.disabled = false; button.textContent = 'Salvar nova senha'; } }
  }

  async function getAppointments() {
    const result = await state.client.from('appointments')
      .select('id,protocol,appointment_date,appointment_time,status,reason,symptoms,created_at,health_units(name,address,city),health_services(name)')
      .order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false });
    return assertResult(result) || [];
  }

  async function renderHome() {
    const [appointmentsResult, requestsResult, campaignsResult, notificationsResult] = await Promise.all([
      getAppointments(),
      state.client.from('service_requests').select('id,status').order('created_at', { ascending: false }),
      state.client.from('campaigns').select('id,title,description,start_date,end_date,health_units(name)').eq('active', true).order('start_date', { ascending: false }),
      state.client.from('notifications').select('id,read_at').order('created_at', { ascending: false }),
    ]);
    const requests = assertResult(requestsResult) || [];
    const campaigns = assertResult(campaignsResult) || [];
    const notifications = assertResult(notificationsResult) || [];
    state.appointments = appointmentsResult;
    state.unreadCount = notifications.filter(n => !n.read_at).length;
    const upcoming = appointmentsResult.filter(a => ['scheduled', 'confirmed'].includes(a.status) && isFutureAppointment(a)).sort((a,b) => `${a.appointment_date} ${a.appointment_time}`.localeCompare(`${b.appointment_date} ${b.appointment_time}`));
    const pendingRequests = requests.filter(r => !['completed', 'rejected'].includes(r.status)).length;
    const next = upcoming[0];
    const name = (state.profile?.full_name || 'Olá').split(' ')[0];
    const serviceCards = [
      ['booking', 'calendar-plus', 'Agendar atendimento', 'Encontre horários disponíveis na sua unidade.'],
      ['appointments', 'calendar-check', 'Meus atendimentos', 'Consulte seus protocolos e próximos horários.'],
      ['units', 'hospital', 'Unidades de saúde', 'Veja endereço e contato das unidades.'],
      ['exams', 'flask', 'Meus exames', 'Acompanhe exames e resultados liberados.'],
      ['vaccines', 'syringe', 'Vacinas e medicamentos', 'Consulte registros e pedidos.'],
      ['family', 'users', 'Minha família', 'Gerencie os vínculos cadastrados na conta.'],
      ['requests', 'clipboard-list', 'Minhas solicitações', 'Envie dúvidas e acompanhe protocolos.'],
      ['campaigns', 'megaphone', 'Campanhas', 'Veja ações de saúde publicadas pela rede.'],
    ];
    return pageLayout('Início', 'Acesse seus serviços e acompanhe suas informações de saúde.', `
      <section class="hero-card"><div class="hero-content"><span class="hero-label">${icon('shield')} PORTAL DO CIDADÃO</span><h2>Olá, ${esc(name)}. Como podemos ajudar?</h2><p>Encontre serviços públicos de saúde, agende atendimentos e acompanhe suas informações em um só lugar.</p><button class="btn btn-outline" data-page="services">Encontrar atendimento ${icon('arrow')}</button></div><div class="hero-mark"><img src="assets/app-icon.png" alt=""></div></section>
      <section class="grid grid-4" style="margin-bottom:18px">
        <article class="stat-card"><div class="stat-top"><span>Próximos atendimentos</span><span class="stat-icon">${icon('calendar')}</span></div><div class="stat-number">${upcoming.length}</div><div class="stat-foot">Agendamentos futuros ativos</div></article>
        <article class="stat-card"><div class="stat-top"><span>Solicitações em aberto</span><span class="stat-icon">${icon('clipboard-list')}</span></div><div class="stat-number">${pendingRequests}</div><div class="stat-foot">Aguardando retorno da equipe</div></article>
        <article class="stat-card"><div class="stat-top"><span>Campanhas publicadas</span><span class="stat-icon">${icon('megaphone')}</span></div><div class="stat-number">${campaigns.length}</div><div class="stat-foot">Ações disponíveis para você</div></article>
        <article class="stat-card"><div class="stat-top"><span>Notificações não lidas</span><span class="stat-icon">${icon('bell')}</span></div><div class="stat-number">${state.unreadCount}</div><div class="stat-foot">Avisos da sua conta</div></article>
      </section>
      <div class="panel-head"><div><h2>Acesso rápido</h2><p>Escolha o que deseja fazer.</p></div></div>
      <section class="grid grid-4" style="margin-bottom:20px">${serviceCards.map(([page, iconName, label, desc]) => `<button class="service-card" type="button" data-page="${page}"><span class="service-icon">${icon(iconName)}</span><strong>${esc(label)}</strong><p>${esc(desc)}</p><span class="card-link">Acessar ${icon('arrow')}</span></button>`).join('')}</section>
      <section class="grid grid-2">
        <article class="panel"><div class="panel-head"><div><h3>Próximo atendimento</h3><p>Seu próximo agendamento ativo.</p></div><button class="link-button" data-page="appointments">Ver todos →</button></div>
          ${next ? appointmentHighlight(next) : emptyState('Nenhum atendimento agendado','Quando você agendar, o próximo atendimento aparecerá aqui.','<button class="btn btn-primary" data-page="booking">Agendar agora</button>')}
        </article>
        <article class="panel"><div class="panel-head"><div><h3>Campanhas de saúde</h3><p>Informações divulgadas pela rede.</p></div><button class="link-button" data-page="campaigns">Ver campanhas →</button></div>
          ${campaigns.length ? campaigns.slice(0,2).map(c => `<div class="data-card" style="margin-bottom:9px"><div class="data-icon">${icon('megaphone')}</div><div class="data-body"><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><div class="data-meta">${dateLabel(c.start_date)} a ${dateLabel(c.end_date)}</div></div></div>`).join('') : emptyState('Sem campanhas publicadas','As campanhas oficiais aparecerão aqui quando forem divulgadas.')}
        </article>
      </section>
      <div class="notice" style="margin-top:18px">${icon('alert')}<div><strong>Em caso de emergência:</strong> se houver risco imediato à vida, ligue 192 (SAMU) ou procure o serviço de emergência local. Este portal não é um canal de urgência.</div></div>
    `);
  }

  function appointmentHighlight(item) {
    const unit = relation(item.health_units), service = relation(item.health_services);
    const day = new Date(`${item.appointment_date}T00:00:00`).getDate();
    const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${item.appointment_date}T00:00:00`)).replace('.', '').toUpperCase();
    return `<div class="appointment-highlight"><div class="date-tile"><strong>${day}</strong><small>${esc(month)}</small></div><div style="min-width:0;flex:1"><h3>${esc(service.name || 'Atendimento')}</h3><p>${esc(unit.name || 'Unidade não informada')} • ${timeLabel(item.appointment_time)}</p><div class="data-meta"><span class="badge ${statusClass(item.status)}">${esc(statusLabel(item.status))}</span><span>${esc(item.protocol)}</span></div></div><button class="btn btn-outline" data-action="show-appointment-qr" data-id="${esc(item.id)}">${icon('qr')} QR</button></div>`;
  }

  async function renderServices() {
    const services = [
      ['booking','calendar-plus','Consulta ou avaliação','Agende atendimento clínico, enfermagem e acompanhamento.'],
      ['exams','flask','Exames','Consulte solicitações, andamento e resultados disponibilizados.'],
      ['vaccines','syringe','Vacinação','Acompanhe as doses registradas pela equipe de saúde.'],
      ['vaccines','prescription','Medicamentos','Consulte pedidos e orientações de retirada.'],
      ['requests','clipboard-list','Fazer uma solicitação','Envie dúvidas e pedidos à equipe da unidade.'],
      ['units','hospital','Encontrar uma unidade','Consulte endereço, telefone e horário de funcionamento.'],
    ];
    return pageLayout(...titles.services, `<section class="grid grid-3">${services.map(([page,ico,title,desc]) => `<button class="service-card" data-page="${page}"><span class="service-icon">${icon(ico)}</span><strong>${esc(title)}</strong><p>${esc(desc)}</p><span class="card-link">Acessar ${icon('arrow')}</span></button>`).join('')}</section><div class="notice" style="margin-top:18px">${icon('info')}<span>Não utilize este portal para emergências. Em situações de risco imediato, ligue 192 (SAMU).</span></div>`);
  }

  async function fetchUnits() {
    return assertResult(await state.client.from('health_units').select('id,name,address,city,state,phone,unit_type,opening_hours,latitude,longitude').eq('active', true).order('name')) || [];
  }

  async function fetchServices() {
    return assertResult(await state.client.from('health_services').select('id,name,description').eq('active', true).order('name')) || [];
  }

  async function fetchSlots(unitId, serviceId, date) {
    if (!unitId || !serviceId || !date) return [];
    const rows = assertResult(await state.client.from('appointment_slots').select('id,slot_date,slot_time,capacity,booked_count').eq('unit_id', unitId).eq('service_id', serviceId).eq('slot_date', date).eq('is_open', true).order('slot_time')) || [];
    return rows.filter(row => Number(row.capacity || 0) > Number(row.booked_count || 0));
  }

  async function renderBooking() {
    const [units, services] = await Promise.all([fetchUnits(), fetchServices()]);
    state.booking.units = units; state.booking.services = services;
    if (!units.length || !services.length) {
      return pageLayout(...titles.booking, emptyState('Agendamento ainda não disponível','A equipe precisa cadastrar unidades, serviços e horários no painel de gestão.'));
    }
    if (!units.some(u => u.id === state.booking.unitId)) state.booking.unitId = units[0].id;
    if (!services.some(s => s.id === state.booking.serviceId)) state.booking.serviceId = services[0].id;
    if (!state.booking.date || state.booking.date < todayISO()) state.booking.date = tomorrowISO();
    state.booking.slotId = '';
    state.booking.slots = await fetchSlots(state.booking.unitId, state.booking.serviceId, state.booking.date);
    return pageLayout(...titles.booking, `
      <div class="grid grid-2" style="align-items:start">
        <form id="booking-form" class="form-panel">
          <div class="field"><label for="booking-unit">Unidade de saúde</label><select id="booking-unit" name="unit_id">${units.map(u => `<option value="${esc(u.id)}" ${u.id === state.booking.unitId ? 'selected' : ''}>${esc(u.name)} — ${esc(u.city)}</option>`).join('')}</select></div>
          <div class="field"><label for="booking-service">Serviço</label><select id="booking-service" name="service_id">${services.map(s => `<option value="${esc(s.id)}" ${s.id === state.booking.serviceId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>${services.find(s => s.id === state.booking.serviceId)?.description ? `<small class="field-hint">${esc(services.find(s => s.id === state.booking.serviceId).description)}</small>` : ''}</div>
          <div class="field"><label for="booking-date">Data desejada</label><input id="booking-date" name="date" type="date" min="${todayISO()}" max="${dateMaxISO()}" value="${esc(state.booking.date)}" required></div>
          <div class="field"><label>Horários disponíveis</label><div id="booking-slots">${slotMarkup(state.booking.slots)}</div></div>
          <div class="field"><label for="booking-reason">Motivo do atendimento (opcional)</label><textarea id="booking-reason" name="reason" maxlength="800" placeholder="Descreva brevemente o que precisa. Evite inserir dados desnecessários."></textarea></div>
          <label class="form-check"><input type="checkbox" name="symptoms" id="booking-symptoms"><span>Estou com sintomas hoje. Informo apenas para ajudar no acolhimento da unidade.</span></label>
          <button class="btn btn-primary" type="submit">${icon('calendar-check')} Confirmar agendamento</button>
        </form>
        <aside class="panel"><div class="panel-head"><div><h3>Antes de confirmar</h3><p>Confira as informações do atendimento.</p></div>${icon('shield')}</div><div class="list"><div class="data-card"><div class="data-icon">${icon('hospital')}</div><div class="data-body"><h3>Unidade selecionada</h3><p id="booking-summary-unit">${esc(units.find(u => u.id === state.booking.unitId)?.name || '')}</p></div></div><div class="data-card"><div class="data-icon">${icon('calendar')}</div><div class="data-body"><h3>Data escolhida</h3><p id="booking-summary-date">${dateLabel(state.booking.date)}</p></div></div><div class="notice">${icon('info')}<span>O horário só será reservado após a confirmação no banco de dados. A disponibilidade pode mudar enquanto você escolhe.</span></div></div></aside>
      </div>`);
  }

  function dateMaxISO() { const d = new Date(); d.setFullYear(d.getFullYear() + 1); const offset = d.getTimezoneOffset(); return new Date(d.getTime() - offset * 60000).toISOString().slice(0,10); }

  function slotMarkup(slots) {
    if (!slots?.length) return `<div class="empty-state" style="padding:20px"><div class="empty-icon">${icon('clock')}</div><h3>Nenhum horário livre</h3><p>Escolha outra data ou unidade para consultar horários disponíveis.</p></div>`;
    return `<div class="slot-list">${slots.map(slot => `<button class="slot-button ${state.booking.slotId === slot.id ? 'selected' : ''}" type="button" data-action="select-slot" data-slot-id="${esc(slot.id)}">${esc(timeLabel(slot.slot_time))}</button>`).join('')}</div>`;
  }

  async function reloadBookingSlots() {
    const unitId = $('#booking-unit')?.value || state.booking.unitId;
    const serviceId = $('#booking-service')?.value || state.booking.serviceId;
    const date = $('#booking-date')?.value || state.booking.date;
    state.booking.unitId = unitId; state.booking.serviceId = serviceId; state.booking.date = date; state.booking.slotId = '';
    const container = $('#booking-slots');
    if (container) container.innerHTML = showLoading('Buscando horários…');
    if (date < todayISO()) {
      if (container) container.innerHTML = `<div class="notice">${icon('alert')}Escolha uma data a partir de hoje.</div>`;
      return;
    }
    try {
      state.booking.slots = await fetchSlots(unitId, serviceId, date);
      if (container) container.innerHTML = slotMarkup(state.booking.slots);
      const summaryDate = $('#booking-summary-date'); if (summaryDate) summaryDate.textContent = dateLabel(date);
      const summaryUnit = $('#booking-summary-unit'); if (summaryUnit) summaryUnit.textContent = state.booking.units.find(u => u.id === unitId)?.name || '';
    } catch (error) {
      if (container) container.innerHTML = `<div class="notice">${icon('alert')}${esc(friendlyError(error))}</div>`;
    }
  }

  function bindBookingFormDefaults() {
    const form = $('#booking-form');
    if (form) form.dataset.ready = '1';
  }

  async function submitBooking(form) {
    const fd = new FormData(form);
    const slotId = state.booking.slotId;
    if (!slotId) { toast('Selecione um horário disponível.', 'error'); return; }
    const button = $('button[type="submit"]', form);
    if (button) { button.disabled = true; button.textContent = 'Confirmando…'; }
    try {
      const data = assertResult(await state.client.rpc('book_appointment', {
        p_slot_id: slotId,
        p_reason: String(fd.get('reason') || '').trim() || null,
        p_symptoms: fd.get('symptoms') === 'on',
      }));
      state.lastAppointment = {
        ...data,
        health_units: state.booking.units.find(unit => unit.id === state.booking.unitId) || {},
        health_services: state.booking.services.find(service => service.id === state.booking.serviceId) || {},
      };
      toast('Atendimento agendado com sucesso.');
      navigate('confirmation');
    } catch (error) {
      toast(friendlyError(error), 'error');
      await reloadBookingSlots();
      if (button) { button.disabled = false; button.innerHTML = `${icon('calendar-check')} Confirmar agendamento`; }
    }
  }

  async function renderAppointments() {
    const rows = await getAppointments();
    state.appointments = rows;
    if (!rows.length) return pageLayout(...titles.appointments, emptyState('Nenhum atendimento encontrado','Quando você realizar um agendamento, ele aparecerá nesta página.','<button class="btn btn-primary" data-page="booking">Agendar atendimento</button>'));
    const sorted = [...rows].sort((a,b) => `${b.appointment_date} ${b.appointment_time}`.localeCompare(`${a.appointment_date} ${a.appointment_time}`));
    return pageLayout(...titles.appointments, `<div class="list">${sorted.map(row => appointmentCard(row)).join('')}</div>`);
  }

  function appointmentCard(row) {
    const unit = relation(row.health_units), service = relation(row.health_services);
    const canCancel = ['scheduled','confirmed'].includes(row.status) && isFutureAppointment(row);
    return `<article class="data-card"><div class="data-icon">${icon('calendar-check')}</div><div class="data-body"><h3>${esc(service.name || 'Atendimento')}</h3><p>${esc(unit.name || 'Unidade não informada')} — ${esc(unit.address || '')}</p><div class="data-meta"><span>${dateTimeLabel(row.appointment_date,row.appointment_time)}</span><span class="badge ${statusClass(row.status)}">${esc(statusLabel(row.status))}</span></div><div class="data-meta"><span>Protocolo: <strong>${esc(row.protocol)}</strong></span></div>${row.reason ? `<p>Motivo: ${esc(row.reason)}</p>` : ''}<div class="data-actions"><button class="btn btn-soft" data-action="show-appointment-qr" data-id="${esc(row.id)}">${icon('qr')} Ver QR Code</button>${canCancel ? `<button class="btn btn-danger" data-action="cancel-appointment" data-id="${esc(row.id)}">${icon('close')} Cancelar</button>` : ''}</div></div></article>`;
  }

  async function cancelAppointment(id) {
    const ok = window.confirm('Deseja cancelar este atendimento? Esta ação só é permitida antes do horário marcado.');
    if (!ok) return;
    try {
      assertResult(await state.client.rpc('cancel_appointment', { p_appointment_id: id }));
      toast('Atendimento cancelado.');
      await renderAuthenticatedPage();
    } catch (error) { toast(friendlyError(error), 'error'); }
  }

  function renderConfirmation() {
    const appt = state.lastAppointment;
    if (!appt) return pageLayout(...titles.confirmation, emptyState('Protocolo não selecionado','Acesse seus atendimentos para consultar o QR Code.','<button class="btn btn-primary" data-page="appointments">Ver atendimentos</button>'));
    const unit = relation(appt.health_units), service = relation(appt.health_services);
    return pageLayout(...titles.confirmation, `<section class="panel"><div class="qr-layout"><div class="qr-box"><div id="qr-code"></div></div><div><span class="badge success">${icon('check')} Registrado</span><h2 style="font:800 24px Manrope;margin:14px 0 7px">Seu atendimento foi registrado!</h2><p style="color:var(--muted);font-size:13px;line-height:1.5">Apresente o QR Code ou informe o protocolo à equipe da unidade.</p><div class="list" style="margin:16px 0"><div><small class="field-hint">Serviço</small><strong>${esc(service.name || 'Atendimento')}</strong></div><div><small class="field-hint">Data e horário</small><strong>${dateTimeLabel(appt.appointment_date, appt.appointment_time)}</strong></div><div><small class="field-hint">Unidade</small><strong>${esc(unit.name || 'Unidade de saúde')}</strong></div><div><small class="field-hint">Protocolo</small><strong id="appointment-protocol">${esc(appt.protocol)}</strong></div></div><div class="form-actions"><button class="btn btn-outline" data-action="copy-protocol">${icon('copy')} Copiar protocolo</button><button class="btn btn-primary" data-page="appointments">Meus atendimentos</button></div></div></div></section>`);
  }

  function renderQrCode() {
    const appt = state.lastAppointment;
    const node = $('#qr-code');
    if (!appt || !node) return;
    node.innerHTML = '';
    if (window.QRCode) {
      new QRCode(node, { text: `ProSpace Health|${appt.protocol}`, width: 190, height: 190, colorDark: '#123b3a', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    } else {
      node.innerHTML = `<div class="notice">QR indisponível. Use o protocolo: ${esc(appt.protocol)}</div>`;
    }
  }

  function distanceKm(a,b) { const rad=n=>n*Math.PI/180, dLat=rad(b.latitude-a.latitude), dLon=rad(b.longitude-a.longitude); const x=Math.sin(dLat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLon/2)**2; return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); }
  async function renderUnits() {
    let units = await fetchUnits();
    if (!units.length) return pageLayout(...titles.units, emptyState('Nenhuma unidade cadastrada','As unidades ativas aparecerão aqui quando forem cadastradas pela gestão.'));
    if (state.citizenLocation) units = units.map(u=>({...u,_distance:u.latitude!=null&&u.longitude!=null?distanceKm(state.citizenLocation,{latitude:Number(u.latitude),longitude:Number(u.longitude)}):null})).sort((a,b)=>a._distance==null?1:b._distance==null?-1:a._distance-b._distance);
    const locationTools = `<div class="panel" style="margin-bottom:16px"><div class="panel-head"><div><h3>Unidades próximas</h3><p>${state.citizenLocation?'Lista ordenada pela distância da sua localização.':'Ative sua localização para ordenar as unidades mais próximas.'}</p></div><button class="btn btn-primary" data-action="locate-units">${icon('map-pin')} ${state.citizenLocation?'Atualizar localização':'Usar minha localização'}</button></div>${state.citizenLocation?'<small class="field-hint">Sua posição é usada somente nesta consulta e não é salva.</small>':''}</div>`;
    return pageLayout(...titles.units, `${locationTools}<section class="grid grid-2">${units.map(u => `<article class="data-card"><div class="data-icon">${icon('hospital')}</div><div class="data-body"><h3>${esc(u.name)}</h3><p>${esc(u.unit_type || 'Unidade de saúde')} • ${esc(u.address)}, ${esc(u.city)} - ${esc(u.state)}</p>${u._distance!=null?`<p><strong>${u._distance.toFixed(1).replace('.',',')} km de você</strong></p>`:''}${u.phone ? `<p>${icon('phone')} ${esc(u.phone)}</p>` : ''}${u.opening_hours ? `<p>${icon('clock')} ${esc(u.opening_hours)}</p>` : ''}<div class="data-actions">${u.latitude!=null&&u.longitude!=null?`<a class="btn btn-soft" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(u.latitude+','+u.longitude)}" target="_blank" rel="noopener">${icon('map-pin')} Como chegar</a>`:''}<button class="btn btn-primary" data-action="book-at-unit" data-id="${esc(u.id)}">${icon('calendar-plus')} Agendar nesta unidade</button></div></div></article>`).join('')}</section>`);
  }

  async function renderExams() {
    const rows = assertResult(await state.client.from('exam_records').select('id,title,requested_at,collected_at,status,result_summary,result_storage_path,created_at').order('created_at', { ascending: false })) || [];
    if (!rows.length) return pageLayout(...titles.exams, emptyState('Nenhum exame registrado','As solicitações e resultados de exames aparecerão aqui quando forem lançados pela equipe.'));
    return pageLayout(...titles.exams, `<div class="list">${rows.map(row => `<article class="data-card"><div class="data-icon">${icon('flask')}</div><div class="data-body"><h3>${esc(row.title)}</h3><div class="data-meta"><span class="badge ${statusClass(row.status)}">${esc(statusLabel(row.status))}</span><span>Solicitado: ${dateLabel(row.requested_at)}</span>${row.collected_at ? `<span>Coletado: ${dateLabel(row.collected_at)}</span>` : ''}</div>${row.result_summary ? `<p style="margin-top:10px"><strong>Resumo do resultado:</strong> ${esc(row.result_summary)}</p>` : ''}${row.status === 'available' && !row.result_summary ? `<p>Resultado disponibilizado. Procure a unidade caso precise de orientação sobre o documento.</p>` : ''}</div></article>`).join('')}</div>`);
  }

  async function renderVaccines() {
    const [vaccines, medications] = await Promise.all([
      state.client.from('vaccinations').select('id,vaccine_name,dose,application_date,next_dose_date,notes,health_units(name)').order('application_date', { ascending: false }),
      state.client.from('medication_orders').select('id,medication_name,dosage,quantity,status,instructions,created_at').order('created_at', { ascending: false }),
    ]);
    const v = assertResult(vaccines) || [], m = assertResult(medications) || [];
    const content = state.vaccineTab === 'vaccines'
      ? (v.length ? `<div class="list">${v.map(row => `<article class="data-card"><div class="data-icon">${icon('syringe')}</div><div class="data-body"><h3>${esc(row.vaccine_name)}</h3><p>${esc(row.dose || 'Dose não informada')} • Aplicada em ${dateLabel(row.application_date)}</p><div class="data-meta">${row.next_dose_date ? `<span>Próxima dose: ${dateLabel(row.next_dose_date)}</span>` : ''}${relation(row.health_units).name ? `<span>${esc(relation(row.health_units).name)}</span>` : ''}</div>${row.notes ? `<p>${esc(row.notes)}</p>` : ''}</div></article>`).join('')}</div>` : emptyState('Nenhuma vacina registrada','Os registros de vacinação vinculados à sua conta aparecerão aqui.'))
      : (m.length ? `<div class="list">${m.map(row => `<article class="data-card"><div class="data-icon">${icon('prescription')}</div><div class="data-body"><h3>${esc(row.medication_name)}</h3><p>${esc(row.dosage || 'Dosagem não informada')} ${row.quantity ? `• Quantidade: ${esc(row.quantity)}` : ''}</p><div class="data-meta"><span class="badge ${statusClass(row.status)}">${esc(statusLabel(row.status))}</span><span>Pedido: ${dateLabel(row.created_at?.slice(0,10))}</span></div>${row.instructions ? `<p>${esc(row.instructions)}</p>` : ''}</div></article>`).join('')}</div>` : emptyState('Nenhum pedido de medicamento','Os pedidos e informações de retirada aparecerão aqui.'));
    return pageLayout(...titles.vaccines, `<div class="tabs"><button class="${state.vaccineTab === 'vaccines' ? 'active' : ''}" data-action="vaccine-tab" data-tab="vaccines">${icon('syringe')} Vacinação (${v.length})</button><button class="${state.vaccineTab === 'medications' ? 'active' : ''}" data-action="vaccine-tab" data-tab="medications">${icon('prescription')} Medicamentos (${m.length})</button></div>${content}`);
  }

  async function renderFamily() {
    const rows = assertResult(await state.client.from('family_members').select('id,full_name,relationship,birth_date,created_at').order('full_name')) || [];
    const action = `<button class="btn btn-primary" data-action="add-family">${icon('plus')} Adicionar familiar</button>`;
    return pageLayout(...titles.family, rows.length ? `<div class="notice" style="margin-bottom:15px">${icon('info')}<span>Este cadastro registra o vínculo familiar. Ele não concede acesso automático a prontuários ou informações clínicas de outra pessoa.</span></div><div class="list">${rows.map(row => `<article class="data-card"><div class="data-icon">${icon('family')}</div><div class="data-body"><h3>${esc(row.full_name)}</h3><p>${esc(row.relationship)} • Nascimento: ${dateLabel(row.birth_date)}</p></div><button class="btn btn-danger" data-action="delete-family" data-id="${esc(row.id)}">${icon('trash')} Remover</button></article>`).join('')}</div>` : `${emptyState('Nenhum familiar vinculado','Adicione um dependente para registrar o vínculo nesta conta.')}<div style="display:flex;justify-content:center;margin-top:14px"><button class="btn btn-primary" data-action="add-family">${icon('plus')} Adicionar familiar</button></div>`, action);
  }

  function openFamilyModal() {
    openModal('Adicionar familiar', `<form id="family-form"><div class="field"><label for="family-name">Nome completo</label><input id="family-name" name="full_name" required minlength="3" maxlength="150"></div><div class="field"><label for="family-relationship">Parentesco</label><select id="family-relationship" name="relationship" required><option value="">Selecione</option><option>Filho(a)</option><option>Cônjuge</option><option>Mãe</option><option>Pai</option><option>Irmão(ã)</option><option>Avô(ó)</option><option>Outro</option></select></div><div class="field"><label for="family-birth">Data de nascimento (opcional)</label><input id="family-birth" name="birth_date" type="date" max="${todayISO()}"></div><div class="modal-actions"><button class="btn btn-outline" type="button" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit">Salvar vínculo</button></div></form>`);
  }

  async function submitFamily(form) {
    const fd = new FormData(form);
    const name = String(fd.get('full_name') || '').trim();
    const relationship = String(fd.get('relationship') || '').trim();
    const birthDate = String(fd.get('birth_date') || '') || null;
    if (name.length < 3 || !relationship) { toast('Preencha nome e parentesco.', 'error'); return; }
    try {
      assertResult(await state.client.from('family_members').insert({ owner_id: state.user.id, full_name: name, relationship, birth_date: birthDate }));
      closeModal(); toast('Familiar cadastrado.'); await renderAuthenticatedPage();
    } catch (error) { toast(friendlyError(error), 'error'); }
  }

  async function deleteFamily(id) {
    if (!window.confirm('Deseja remover este vínculo familiar?')) return;
    try {
      assertResult(await state.client.from('family_members').delete().eq('id', id));
      toast('Vínculo removido.'); await renderAuthenticatedPage();
    } catch (error) { toast(friendlyError(error), 'error'); }
  }

  async function renderRequests() {
    const rows = assertResult(await state.client.from('service_requests').select('id,protocol,request_type,description,status,created_at,updated_at').order('created_at', { ascending: false })) || [];
    const action = `<button class="btn btn-primary" data-action="new-request">${icon('plus')} Nova solicitação</button>`;
    return pageLayout(...titles.requests, rows.length ? `<div class="list">${rows.map(row => `<article class="data-card"><div class="data-icon">${icon('clipboard-list')}</div><div class="data-body"><h3>${esc(row.request_type)}</h3><p>${esc(row.description)}</p><div class="data-meta"><span class="badge ${statusClass(row.status)}">${esc(statusLabel(row.status))}</span><span>Protocolo: <strong>${esc(row.protocol)}</strong></span><span>${dateLabel(row.created_at?.slice(0,10))}</span></div></div></article>`).join('')}</div>` : `${emptyState('Nenhuma solicitação enviada','Use o botão para encaminhar uma dúvida ou pedido à equipe da unidade.')}<div style="display:flex;justify-content:center;margin-top:14px"><button class="btn btn-primary" data-action="new-request">${icon('plus')} Nova solicitação</button></div>`, action);
  }

  function openRequestModal() {
    openModal('Nova solicitação', `<form id="request-form"><div class="field"><label for="request-type">Tipo de solicitação</label><select id="request-type" name="request_type" required><option>Solicitação de atendimento</option><option>Dúvida administrativa</option><option>Acesso a cadastro</option><option>Informação sobre serviço</option><option>Outro assunto</option></select></div><div class="field"><label for="request-description">Descreva sua solicitação</label><textarea id="request-description" name="description" minlength="5" maxlength="1500" required placeholder="Conte brevemente o que você precisa. Evite inserir informações clínicas desnecessárias."></textarea></div><div class="notice">${icon('shield')}<span>Não utilize esta área para emergências ou para enviar informações que exijam atendimento imediato.</span></div><div class="modal-actions"><button class="btn btn-outline" type="button" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit">Enviar solicitação</button></div></form>`);
  }

  async function submitRequest(form) {
    const fd = new FormData(form);
    const type = String(fd.get('request_type') || '').trim();
    const description = String(fd.get('description') || '').trim();
    if (description.length < 5) { toast('Descreva sua solicitação com pelo menos 5 caracteres.', 'error'); return; }
    try {
      assertResult(await state.client.from('service_requests').insert({ user_id: state.user.id, request_type: type, description, status: 'received' }));
      closeModal(); toast('Solicitação enviada.'); await renderAuthenticatedPage();
    } catch (error) { toast(friendlyError(error), 'error'); }
  }

  async function renderCampaigns() {
    const rows = assertResult(await state.client.from('campaigns').select('id,title,description,start_date,end_date,health_units(name,address)').eq('active', true).order('start_date', { ascending: false })) || [];
    if (!rows.length) return pageLayout(...titles.campaigns, emptyState('Nenhuma campanha publicada','As campanhas oficiais aparecerão aqui quando forem cadastradas pela equipe de saúde.'));
    return pageLayout(...titles.campaigns, `<section class="grid grid-2">${rows.map(row => { const unit = relation(row.health_units); return `<article class="campaign-card" style="padding:20px"><div class="data-icon" style="margin-bottom:13px">${icon('megaphone')}</div><h3 style="font:800 16px Manrope;margin:0 0 8px">${esc(row.title)}</h3><p style="color:var(--muted);font-size:12px;line-height:1.55;margin:0">${esc(row.description)}</p><div class="data-meta" style="margin-top:13px"><span>${dateLabel(row.start_date)} a ${dateLabel(row.end_date)}</span></div>${unit.name ? `<div class="data-meta">${icon('hospital')}<span>${esc(unit.name)}${unit.address ? ` • ${esc(unit.address)}` : ''}</span></div>` : ''}</article>`; }).join('')}</section>`);
  }

  async function renderNotifications() {
    const rows = assertResult(await state.client.from('notifications').select('id,title,body,read_at,created_at').order('created_at', { ascending: false })) || [];
    const unread = rows.filter(r => !r.read_at).length;
    state.unreadCount = unread;
    if (!rows.length) return pageLayout(...titles.notifications, emptyState('Tudo em dia','As notificações sobre seus atendimentos aparecerão aqui.'));
    return pageLayout(...titles.notifications, `<div class="panel-head"><div><h3>${unread} não lida(s)</h3><p>Toque em uma notificação para marcá-la como lida.</p></div><button class="btn btn-outline" data-action="mark-all-read">${icon('check')} Marcar todas como lidas</button></div><div class="list">${rows.map(row => `<article class="data-card" style="${row.read_at ? 'opacity:.75' : ''}"><div class="data-icon">${icon(row.read_at ? 'bell' : 'activity')}</div><div class="data-body"><h3>${esc(row.title)}</h3><p>${esc(row.body)}</p><div class="data-meta"><span>${dateLabel(row.created_at?.slice(0,10))}</span><span class="badge ${row.read_at ? 'neutral' : 'success'}">${row.read_at ? 'Lida' : 'Não lida'}</span></div>${!row.read_at ? `<div class="data-actions"><button class="btn btn-soft" data-action="mark-read" data-id="${esc(row.id)}">${icon('check')} Marcar como lida</button></div>` : ''}</div></article>`).join('')}</div>`);
  }

  async function markNotificationRead(id) {
    try {
      assertResult(await state.client.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', state.user.id));
      toast('Notificação marcada como lida.'); await renderAuthenticatedPage();
    } catch (error) { toast(friendlyError(error), 'error'); }
  }

  async function markAllNotificationsRead() {
    try {
      assertResult(await state.client.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', state.user.id).is('read_at', null));
      toast('Notificações atualizadas.'); await renderAuthenticatedPage();
    } catch (error) { toast(friendlyError(error), 'error'); }
  }

  async function renderProfile() {
    const result = assertResult(await state.client.from('profiles').select('full_name,cpf,phone,birth_date').eq('id', state.user.id).single());
    state.profile = { ...state.profile, ...result };
    const p = state.profile;
    return pageLayout(...titles.profile, `<div class="profile-banner"><div class="avatar">${esc(initials(p.full_name))}</div><div><strong>${esc(p.full_name || 'Minha conta')}</strong><small>${esc(state.user.email || '')}</small></div></div><form id="profile-form" class="form-panel"><div class="panel-head"><div><h3>Dados pessoais</h3><p>Atualize as informações da sua conta.</p></div>${icon('user')}</div><div class="form-row"><div class="field"><label for="profile-name">Nome completo</label><input id="profile-name" name="full_name" required minlength="3" value="${esc(p.full_name)}"></div><div class="field"><label for="profile-cpf">CPF (opcional)</label><input id="profile-cpf" name="cpf" inputmode="numeric" value="${esc(p.cpf)}"></div><div class="field"><label for="profile-phone">Telefone</label><input id="profile-phone" name="phone" type="tel" value="${esc(p.phone)}"></div><div class="field"><label for="profile-birth">Data de nascimento</label><input id="profile-birth" name="birth_date" type="date" max="${todayISO()}" value="${esc(p.birth_date)}"></div></div><div class="notice" style="margin:12px 0">${icon('info')}<span>O e-mail de acesso não pode ser alterado nesta tela. Para proteger sua conta, a função/perfil de usuário também não pode ser editada por aqui.</span></div><button class="btn btn-primary" type="submit">${icon('check')} Salvar alterações</button></form><div style="margin-top:16px"><button class="btn btn-danger" data-action="signout">${icon('logout')} Sair da conta</button></div>`);
  }

  function bindProfileMasks() {
    const cpf = $('#profile-cpf');
    if (cpf) cpf.addEventListener('input', () => { const digits = cpf.value.replace(/\D/g, '').slice(0,11); cpf.value = digits.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); });
  }

  async function submitProfile(form) {
    const fd = new FormData(form);
    const fullName = String(fd.get('full_name') || '').trim();
    const cpf = String(fd.get('cpf') || '').replace(/\D/g, '') || null;
    const phone = String(fd.get('phone') || '').trim() || null;
    const birthDate = String(fd.get('birth_date') || '') || null;
    if (fullName.length < 3) { toast('Informe seu nome completo.', 'error'); return; }
    try {
      assertResult(await state.client.from('profiles').update({ full_name: fullName, cpf, phone, birth_date: birthDate }).eq('id', state.user.id));
      state.profile = { ...state.profile, full_name: fullName, cpf, phone, birth_date: birthDate };
      toast('Perfil atualizado.'); await renderAuthenticatedPage();
    } catch (error) { toast(friendlyError(error), 'error'); }
  }

  function bindAppEvents() {
    document.addEventListener('click', async (event) => {
      const pageButton = event.target.closest('[data-page]');
      if (pageButton) {
        event.preventDefault();
        navigate(pageButton.dataset.page);
        return;
      }
      const actionButton = event.target.closest('[data-action]');
      if (!actionButton) return;
      const action = actionButton.dataset.action;
      if (action === 'toggle-drawer') { openDrawer(); return; }
      if (action === 'close-drawer' || action === 'backdrop-close') {
        if (event.target === actionButton || event.target === modalRoot.querySelector('.modal-backdrop')) {
          if (action === 'backdrop-close') closeModal(); else closeDrawer();
        }
        return;
      }
      if (action === 'close-modal') { closeModal(); return; }
      if (action === 'auth-login') { state.authMode = 'login'; state.authNotice = null; renderAuth(); return; }
      if (action === 'auth-register') { state.authMode = 'register'; state.authNotice = null; renderAuth(); return; }
      if (action === 'auth-forgot') { state.authMode = 'forgot'; state.authNotice = null; renderAuth(); return; }
      if (action === 'resend-confirmation') { await resendConfirmation(); return; }
      if (action === 'signout') { await signOut(); return; }
      if (action === 'select-slot') {
        state.booking.slotId = actionButton.dataset.slotId;
        $$('.slot-button').forEach(button => button.classList.toggle('selected', button.dataset.slotId === state.booking.slotId));
        return;
      }
      if (action === 'cancel-appointment') { await cancelAppointment(actionButton.dataset.id); return; }
      if (action === 'show-appointment-qr') {
        const id = actionButton.dataset.id;
        let appt = state.appointments.find(row => row.id === id);
        if (!appt) { try { state.appointments = await getAppointments(); appt = state.appointments.find(row => row.id === id); } catch (_) {} }
        if (appt) { state.lastAppointment = appt; navigate('confirmation'); }
        return;
      }
      if (action === 'copy-protocol') {
        const protocol = state.lastAppointment?.protocol;
        if (!protocol) return;
        try { await navigator.clipboard.writeText(protocol); toast('Protocolo copiado.'); }
        catch (_) { toast(`Protocolo: ${protocol}`); }
        return;
      }
      if (action === 'locate-units') {
        if (!navigator.geolocation) { toast('Geolocalização não disponível neste navegador.', 'error'); return; }
        actionButton.disabled = true; actionButton.textContent = 'Obtendo localização…';
        navigator.geolocation.getCurrentPosition(async pos => { state.citizenLocation={latitude:pos.coords.latitude,longitude:pos.coords.longitude}; await renderAuthenticatedPage(); toast('Unidades ordenadas pela proximidade.'); }, err => { actionButton.disabled=false; actionButton.textContent='Usar minha localização'; toast(err.code===1?'Permissão de localização negada.':'Não foi possível obter sua localização.', 'error'); }, {enableHighAccuracy:true,timeout:15000,maximumAge:60000});
        return;
      }
      if (action === 'book-at-unit') {
        state.booking.unitId = actionButton.dataset.id;
        navigate('booking');
        return;
      }
      if (action === 'add-family') { openFamilyModal(); return; }
      if (action === 'delete-family') { await deleteFamily(actionButton.dataset.id); return; }
      if (action === 'new-request') { openRequestModal(); return; }
      if (action === 'vaccine-tab') { state.vaccineTab = actionButton.dataset.tab || 'vaccines'; await renderAuthenticatedPage(); return; }
      if (action === 'mark-read') { await markNotificationRead(actionButton.dataset.id); return; }
      if (action === 'mark-all-read') { await markAllNotificationsRead(); return; }
      if (action === 'refresh-page') { await renderAuthenticatedPage(); return; }
    });

    document.addEventListener('change', async (event) => {
      if (['booking-unit', 'booking-service', 'booking-date'].includes(event.target.id)) {
        if (event.target.id === 'booking-unit') state.booking.unitId = event.target.value;
        if (event.target.id === 'booking-service') state.booking.serviceId = event.target.value;
        if (event.target.id === 'booking-date') state.booking.date = event.target.value;
        await reloadBookingSlots();
      }
    });

    document.addEventListener('submit', async (event) => {
      const form = event.target;
      if (!form.id) return;
      event.preventDefault();
      if (form.id === 'auth-form') await submitAuth(form);
      else if (form.id === 'forgot-form') await submitForgot(form);
      else if (form.id === 'reset-form') await submitReset(form);
      else if (form.id === 'booking-form') await submitBooking(form);
      else if (form.id === 'profile-form') await submitProfile(form);
      else if (form.id === 'request-form') await submitRequest(form);
      else if (form.id === 'family-form') await submitFamily(form);
    });

    window.addEventListener('hashchange', () => {
      if (!state.user) return;
      const page = location.hash.replace(/^#\/?/, '');
      if (titles[page]) { state.page = page; closeDrawer(); renderAuthenticatedPage(); }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { closeModal(); closeDrawer(); }
    });
  }

  bindAppEvents();
  init();
})();
