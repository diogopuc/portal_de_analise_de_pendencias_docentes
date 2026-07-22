import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { Search, Users, AlertCircle, BookOpen, CheckCircle, Eye, Download } from 'lucide-react';
import { docentesAPI } from '../services/api';

const CORES = {
  simultanea:     '#C0392B',
  somente_agenda: '#E67E22',
  somente_tach:   '#8A0538',
  sem_pendencia:  '#27AE60',
  agenda_bar:     '#E67E22',
  tach_bar:       '#8A0538',
};

const TIPO_LABEL: Record<string, string> = {
  somente_agenda: 'Somente Agenda',
  somente_tach:   'Somente TACH',
  simultanea:     'Simultânea',
  sem_pendencia:  'Sem Pendência',
};

const CAMPUS_CODIGO: Record<string, string> = {
  'CAMPUS CURITIBA': 'CTBA',
  'CAMPUS TOLEDO':   'TLD',
  'CAMPUS LONDRINA': 'LDN',
};

const TIPO_COR: Record<string, string> = {
  somente_agenda: '#E67E22',
  somente_tach:   '#8A0538',
  simultanea:     '#C0392B',
  sem_pendencia:  '#27AE60',
};

function KpiCard({ valor, label, cor, sublabel }: { valor: number; label: string; cor: string; sublabel?: string }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 140, borderTop: `3px solid ${cor}`, padding: '16px 20px' }}>
      <p style={{ fontSize: 36, fontWeight: 700, color: cor, lineHeight: 1, margin: 0 }}>{valor}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#333', marginTop: 6, marginBottom: 0 }}>{label}</p>
      {sublabel && <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{sublabel}</p>}
    </div>
  );
}

function BadgeTipo({ tipo }: { tipo: string }) {
  const cor = TIPO_COR[tipo] ?? '#888';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      background: cor + '18',
      color: cor,
      border: `1px solid ${cor}40`,
      whiteSpace: 'nowrap',
    }}>
      {TIPO_LABEL[tipo] ?? tipo}
    </span>
  );
}

function exportarCSV(rows: ReturnType<typeof buildRows>) {
  const header = ['Matrícula', 'Nome', 'Campus', 'Curso', 'Tipo', 'Semanas c/ Pendência'].join(';');
  const lines = rows.map(r =>
    [r.matricula, r.nome, r.campus, r.curso, TIPO_LABEL[r.tipo] ?? r.tipo, r.pendentes].join(';')
  );
  const csv = [header, ...lines].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'coordenador_pendencias.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function buildRows(filtrados: ReturnType<typeof Array.prototype.filter>) {
  return filtrados.map((d: any) => ({
    matricula: d.matricula as number,
    nome: d.nomeDocente as string,
    campus: d.campus as string,
    curso: (d.semanas as any[])[0]?.curso ?? '—',
    tipo: d.tipoPendencia as string,
    pendentes: (d.semanas as any[]).filter((s: any) => s.pendenciaAgenda || s.pendenciaTach).length,
  }));
}

export function Coordenador() {
  const navigate = useNavigate();
  const [filtroDocente, setFiltroDocente] = useState('');
  const [filtroCampus, setFiltroCampus]   = useState('');
  const [filtroCurso, setFiltroCurso]     = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['coordenador'],
    queryFn: () => docentesAPI.listar({ limite: 1000 }),
    staleTime: 60_000,
  });

  const todos = data?.docentes ?? [];

  const campuses = useMemo(() =>
    [...new Set(todos.map(d => d.campus).filter(Boolean))].sort(),
    [todos],
  );

  const todosCursos = useMemo(() =>
    [...new Set(todos.flatMap(d => d.semanas.map(s => s.curso)).filter(Boolean))].sort(),
    [todos],
  );

  const cursosFiltrados = useMemo(() => {
    const codigo = filtroCampus ? CAMPUS_CODIGO[filtroCampus] : null;
    return codigo ? todosCursos.filter(c => c.includes(codigo)) : todosCursos;
  }, [todosCursos, filtroCampus]);

  const filtrados = useMemo(() => {
    let lista = todos;
    if (filtroCampus) lista = lista.filter(d => d.campus === filtroCampus);
    if (filtroCurso)  lista = lista.filter(d => d.semanas.some(s => s.curso === filtroCurso));
    if (filtroDocente) {
      const norm = filtroDocente.toLowerCase();
      lista = lista.filter(d =>
        d.nomeDocente.toLowerCase().includes(norm) || String(d.matricula).includes(norm),
      );
    }
    return lista;
  }, [todos, filtroCampus, filtroCurso, filtroDocente]);

  const kpis = useMemo(() => ({
    total:      filtrados.length,
    comPend:    filtrados.filter(d => d.tipoPendencia !== 'sem_pendencia').length,
    agenda:     filtrados.filter(d => d.tipoPendencia === 'somente_agenda').length,
    tach:       filtrados.filter(d => d.tipoPendencia === 'somente_tach').length,
    simultanea: filtrados.filter(d => d.tipoPendencia === 'simultanea').length,
    semPend:    filtrados.filter(d => d.tipoPendencia === 'sem_pendencia').length,
  }), [filtrados]);

  const dataPie = useMemo(() => [
    { name: 'Somente Agenda', value: kpis.agenda,     fill: CORES.somente_agenda },
    { name: 'Somente TACH',   value: kpis.tach,       fill: CORES.somente_tach   },
    { name: 'Simultânea',     value: kpis.simultanea, fill: CORES.simultanea     },
    { name: 'Sem Pendência',  value: kpis.semPend,    fill: CORES.sem_pendencia  },
  ].filter(d => d.value > 0), [kpis]);

  const dataBar = useMemo(() => {
    const map = new Map<string, { semana: string; Agenda: number; TACH: number }>();
    filtrados.forEach(d => {
      d.semanas.forEach(s => {
        if (!map.has(s.aba)) map.set(s.aba, { semana: s.semana, Agenda: 0, TACH: 0 });
        const e = map.get(s.aba)!;
        if (s.pendenciaAgenda) e.Agenda++;
        if (s.pendenciaTach)   e.TACH++;
      });
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [filtrados]);

  const rows = useMemo(() => buildRows(filtrados), [filtrados]);

  const handleCampusChange = (campus: string) => {
    setFiltroCampus(campus);
    // Limpa o curso se ele não pertence ao novo campus
    if (campus && filtroCurso) {
      const codigo = CAMPUS_CODIGO[campus];
      if (codigo && !filtroCurso.includes(codigo)) setFiltroCurso('');
    }
  };

  const limparFiltros = () => {
    setFiltroDocente('');
    setFiltroCampus('');
    setFiltroCurso('');
  };

  const temFiltro = filtroCampus || filtroCurso || filtroDocente;

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Visão do Coordenador</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
            {isLoading ? 'Carregando dados...' : `${todos.length} docentes carregados · ${filtrados.length} exibidos`}
          </p>
        </div>
        <button
          onClick={() => exportarCSV(rows)}
          disabled={rows.length === 0}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Campus
            </label>
            <select
              value={filtroCampus}
              onChange={e => handleCampusChange(e.target.value)}
              className="form-control"
              style={{ width: '100%' }}
            >
              <option value="">Todos os campus</option>
              {campuses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ flex: '2 1 280px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Curso
            </label>
            <select
              value={filtroCurso}
              onChange={e => setFiltroCurso(e.target.value)}
              className="form-control"
              style={{ width: '100%' }}
            >
              <option value="">
                {filtroCampus ? `Cursos de ${filtroCampus}` : 'Todos os cursos'}
              </option>
              {cursosFiltrados.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ flex: '2 1 240px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Docente
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
              <input
                type="text"
                value={filtroDocente}
                onChange={e => setFiltroDocente(e.target.value)}
                placeholder="Nome ou matrícula..."
                className="form-control"
                style={{ width: '100%', paddingLeft: 32 }}
              />
            </div>
          </div>

          {temFiltro && (
            <button onClick={limparFiltros} className="btn-secondary" style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard valor={kpis.total}      label="Total de Docentes"   cor="#4A5568"            sublabel="no filtro atual" />
        <KpiCard valor={kpis.comPend}    label="Com Pendência"       cor="#C0392B"            sublabel={kpis.total ? `${Math.round(kpis.comPend / kpis.total * 100)}% do total` : '—'} />
        <KpiCard valor={kpis.simultanea} label="Simultânea"          cor={CORES.simultanea}   sublabel="Agenda + TACH" />
        <KpiCard valor={kpis.agenda}     label="Somente Agenda"      cor={CORES.somente_agenda} />
        <KpiCard valor={kpis.tach}       label="Somente TACH"        cor={CORES.somente_tach}  />
        <KpiCard valor={kpis.semPend}    label="Sem Pendência"       cor={CORES.sem_pendencia} />
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>

        {/* Donut */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Distribuição por Tipo
          </p>
          {dataPie.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, padding: '40px 0' }}>Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={dataPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {dataPie.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, name: string) => [
                    `${v} docente${v !== 1 ? 's' : ''} (${kpis.total ? Math.round(v / kpis.total * 100) : 0}%)`,
                    name,
                  ]}
                />
                <Legend
                  iconType="circle"
                  iconSize={9}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Barras por semana */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pendências por Semana
          </p>
          {dataBar.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, padding: '40px 0' }}>Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dataBar} barCategoryGap="30%" barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #eee', fontSize: 12 }}
                  formatter={(v: number, name: string) => [`${v} docente${v !== 1 ? 's' : ''}`, name]}
                />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Agenda" fill={CORES.agenda_bar} radius={[3, 3, 0, 0]} />
                <Bar dataKey="TACH"   fill={CORES.tach_bar}   radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Docentes Encontrados
          </p>
          <span style={{ fontSize: 12, color: '#888' }}>{rows.length} resultado{rows.length !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9f9f9' }}>
                {['Matrícula', 'Nome', 'Campus', 'Curso', 'Tipo de Pendência', 'Semanas c/ Pend.', ''].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#555',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #eee',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: '#aaa', fontSize: 13 }}>
                    {isLoading ? 'Carregando...' : 'Nenhum docente encontrado para os filtros selecionados.'}
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr
                  key={r.matricula}
                  style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 120ms' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0f4f8')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa')}
                >
                  <td style={{ padding: '10px 16px', color: '#888', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {r.matricula}
                  </td>
                  <td style={{ padding: '10px 16px', fontWeight: 500, color: '#1a1a1a' }}>
                    {r.nome}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#555', whiteSpace: 'nowrap' }}>
                    {r.campus}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#555', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.curso}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <BadgeTipo tipo={r.tipo} />
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    {r.pendentes > 0
                      ? <span style={{ fontWeight: 600, color: '#C0392B' }}>{r.pendentes}</span>
                      : <span style={{ color: '#aaa' }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <button
                      onClick={() => navigate(`/revisar?matricula=${r.matricula}`)}
                      title="Ver detalhes"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'none', border: '1px solid #ddd', borderRadius: 6,
                        padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#555',
                        transition: 'all 120ms',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#8A0538';
                        (e.currentTarget as HTMLButtonElement).style.color = '#8A0538';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#ddd';
                        (e.currentTarget as HTMLButtonElement).style.color = '#555';
                      }}
                    >
                      <Eye size={12} /> Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
