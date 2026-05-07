// Tríade Fibra — NOC Board · shared data + helpers
// Loaded as plain JS so both the TV and admin views can read the same task list.

window.NOC_TASKS = [
  {
    id: 't-001',
    title: 'OLT Centro fora do ar',
    description: 'OLT-CTR-04 sem resposta há 8 min. Verificar power e uplink no rack 3.',
    priority: 'critical',          // critical | high | normal | low
    status: 'in_progress',         // todo | in_progress | done
    assignee: 'Marcos R.',
    location: 'OLT Centro · Rack 3',
    createdAt: Date.now() - 1000 * 60 * 12,
    dueAt:     Date.now() - 1000 * 60 * 3,        // OVERDUE
    tag: 'INFRA',
  },
  {
    id: 't-002',
    title: 'Cliente VIP — queda recorrente',
    description: 'Pousada Serra Verde reclamou 3x essa semana. Ligar e abrir OS de reinspeção.',
    priority: 'critical',
    status: 'todo',
    assignee: 'Bia M.',
    location: 'Cliente · Nova Lima',
    createdAt: Date.now() - 1000 * 60 * 25,
    dueAt:     Date.now() + 1000 * 60 * 18,        // ~18 min
    tag: 'CLIENTE',
  },
  {
    id: 't-003',
    title: 'Rota BGP instável — peering Algar',
    description: 'Flapping desde 14h. Validar no looking-glass e abrir chamado.',
    priority: 'high',
    status: 'in_progress',
    assignee: 'Diego S.',
    location: 'Core BH-01',
    createdAt: Date.now() - 1000 * 60 * 48,
    dueAt:     Date.now() + 1000 * 60 * 42,
    tag: 'BACKBONE',
  },
  {
    id: 't-004',
    title: 'Verificar status OLT Buritis',
    description: 'Rotina diária — checar alarmes, temperaturas e portas down.',
    priority: 'high',
    status: 'todo',
    assignee: 'Marcos R.',
    location: 'OLT Buritis',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    dueAt:     Date.now() + 1000 * 60 * 60 * 3,
    tag: 'INFRA',
  },
  {
    id: 't-005',
    title: 'Ligar Sr. Hélio — reagendar visita',
    description: 'Cliente Centro · pediu para mover instalação de quinta para sábado de manhã.',
    priority: 'normal',
    status: 'todo',
    assignee: 'Bia M.',
    location: 'Cliente · Centro',
    createdAt: Date.now() - 1000 * 60 * 90,
    dueAt:     Date.now() + 1000 * 60 * 60 * 5,
    tag: 'CLIENTE',
  },
  {
    id: 't-006',
    title: 'Substituir ONU em Contagem',
    description: 'Casa do Sr. Pedro · ONU defeituosa. Já está separada na bancada.',
    priority: 'normal',
    status: 'in_progress',
    assignee: 'João T.',
    location: 'Contagem · Eldorado',
    createdAt: Date.now() - 1000 * 60 * 30,
    dueAt:     Date.now() + 1000 * 60 * 60 * 2,
    tag: 'CAMPO',
  },
  {
    id: 't-007',
    title: 'Sincronizar backup do Mikrotik core',
    description: 'Última sincronização há 3 dias. Validar configs antes do deploy de quinta.',
    priority: 'high',
    status: 'todo',
    assignee: 'Diego S.',
    location: 'Core BH-01',
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
    dueAt:     Date.now() + 1000 * 60 * 60 * 7,
    tag: 'BACKBONE',
  },
  {
    id: 't-008',
    title: 'Validar splitter no poste R. Bahia',
    description: 'Reclamações de 4 clientes na mesma quadra. Possível splitter saturado.',
    priority: 'high',
    status: 'todo',
    assignee: 'João T.',
    location: 'R. Bahia, 1.450',
    createdAt: Date.now() - 1000 * 60 * 75,
    dueAt:     Date.now() + 1000 * 60 * 90,
    tag: 'CAMPO',
  },
  {
    id: 't-009',
    title: 'Atualizar firmware Huawei MA5800',
    description: 'Janela de manutenção marcada para 02h. Validar checklist de rollback.',
    priority: 'normal',
    status: 'todo',
    assignee: 'Marcos R.',
    location: 'OLT Pampulha',
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    dueAt:     Date.now() + 1000 * 60 * 60 * 9,
    tag: 'INFRA',
  },
  {
    id: 't-010',
    title: 'Resposta a chamado #4821',
    description: 'Cliente perguntou sobre IPv6. Responder com link da documentação.',
    priority: 'normal',
    status: 'todo',
    assignee: 'Bia M.',
    location: 'Suporte N1',
    createdAt: Date.now() - 1000 * 60 * 50,
    dueAt:     Date.now() + 1000 * 60 * 60 * 4,
    tag: 'CLIENTE',
  },
  {
    id: 't-011',
    title: 'Auditoria semanal de logs',
    description: 'Revisar SSH/console nas OLTs e gerar relatório.',
    priority: 'low',
    status: 'todo',
    assignee: 'Diego S.',
    location: 'NOC',
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    dueAt:     Date.now() + 1000 * 60 * 60 * 18,
    tag: 'BACKBONE',
  },
  {
    id: 't-012',
    title: 'Levar UPS reserva para Buritis',
    description: 'UPS principal apresentou alarme de bateria fraca. Substituir até fim do dia.',
    priority: 'high',
    status: 'in_progress',
    assignee: 'João T.',
    location: 'OLT Buritis',
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
    dueAt:     Date.now() + 1000 * 60 * 25,
    tag: 'CAMPO',
  },
  {
    id: 't-013',
    title: 'Abrir RMA roteador Cisco',
    description: 'Defeito confirmado, número de série anotado na planilha.',
    priority: 'low',
    status: 'todo',
    assignee: 'Marcos R.',
    location: 'NOC',
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    dueAt:     Date.now() + 1000 * 60 * 60 * 28,
    tag: 'INFRA',
  },
  {
    id: 't-014',
    title: 'Fechar OS #2245',
    description: 'Visita finalizada às 11h. Anexar foto da ONU instalada.',
    priority: 'normal',
    status: 'done',
    assignee: 'João T.',
    location: 'Betim · Centro',
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    dueAt:     Date.now() - 1000 * 60 * 60 * 1,
    completedAt: Date.now() - 1000 * 60 * 18,
    tag: 'CAMPO',
  },
];

// ----- helpers -----
window.NOC = {
  // ms remaining (negative = overdue)
  msRemaining(task, now = Date.now()) { return task.dueAt - now; },

  // urgency level used for color: overdue > critical > warning > ok
  // overdue: dueAt < now
  // critical: <15 min remaining OR priority === 'critical'
  // warning:  <60 min remaining OR priority === 'high'
  // ok:       otherwise
  urgencyLevel(task, now = Date.now()) {
    const ms = task.dueAt - now;
    if (ms < 0) return 'overdue';
    if (ms < 15 * 60 * 1000 || task.priority === 'critical') return 'critical';
    if (ms < 60 * 60 * 1000 || task.priority === 'high') return 'warning';
    return 'ok';
  },

  // Format ms into "HH:MM:SS" or "-MM:SS" (overdue)
  formatCountdown(ms) {
    const sign = ms < 0 ? '-' : '';
    const abs = Math.abs(ms);
    const totalSec = Math.floor(abs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    if (h > 0) return `${sign}${h}:${pad(m)}:${pad(s)}`;
    return `${sign}${pad(m)}:${pad(s)}`;
  },

  formatDueLabel(task) {
    const ms = task.dueAt - Date.now();
    if (ms < 0) return 'ATRASADA';
    const min = Math.round(ms / 60000);
    if (min < 60) return `em ${min} min`;
    const h = Math.floor(min / 60);
    const rem = min % 60;
    if (h < 24) return rem ? `em ${h}h${rem.toString().padStart(2, '0')}` : `em ${h}h`;
    const d = Math.floor(h / 24);
    return `em ${d}d`;
  },

  priorityLabel: { critical: 'CRÍTICA', high: 'ALTA', normal: 'NORMAL', low: 'BAIXA' },
  statusLabel:   { todo: 'A FAZER', in_progress: 'EM ANDAMENTO', done: 'CONCLUÍDA' },
  tagColor: {
    INFRA:    '#FF6B3D',
    CLIENTE:  '#7BC9FF',
    BACKBONE: '#C58CFF',
    CAMPO:    '#5BD6A8',
  },
};
