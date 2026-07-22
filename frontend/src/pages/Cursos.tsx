import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ResponsiveContainer,
} from 'recharts';
import { docentesAPI } from '../services/api';

const CORES_TIPO: Record<string, string> = {
  simultanea:     '#C0392B',
  somente_agenda: '#E67E22',
  somente_tach:   '#8A0538',
  sem_pendencia:  '#27AE60',
};

const TIPO_LABEL: Record<string, string> = {
  somente_agenda: 'Somente Agenda',
  somente_tach:   'Somente TACH',
  simultanea:     'Simultânea',
  sem_pendencia:  'Sem Pendência',
};

interface CursoRow {
  curso: string;
  total: number;
  comPendencia: number;
  semPendencia: number;
  pct: number;
  porTipo: Record<string, number>;
}

export function Cursos() {
  const { data, isLoading } = useQuery({
    queryKey: ['cursos-view'],
    queryFn: () => docentesAPI.listar({ limite: 1000 }),
    staleTime: 60_000,
  });

  const todos = data?.docentes ?? [];

  const rows: CursoRow[] = useMemo(() => {
    const map = new Map<string, CursoRow>();

    todos.forEach(d => {
      const curso = d.semanas[0]?.curso ?? '(sem curso)';
      if (!map.has(curso)) {
        map.set(curso, { curso, total: 0, comPendencia: 0, semPendencia: 0, pct: 0, porTipo: {} });
      }
      const row = map.get(curso)!;
      row.total++;
      if (d.tipoPendencia === 'sem_pendencia') {
        row.semPendencia++;
      } else {
        row.comPendencia++;
      }
      row.porTipo[d.tipoPendencia] = (row.porTipo[d.tipoPendencia] ?? 0) + 1;
    });

    return [...map.values()]
      .map(r => ({ ...r, pct: r.total > 0 ? Math.round(r.comPendencia / r.total * 100) : 0 }))
      .sort((a, b) => b.comPendencia - a.comPendencia);
  }, [todos]);

  const barData = rows.slice(0, 15).map(r => ({ name: r.curso.split(' - ')[0], pendentes: r.comPendencia, total: r.total }));

  if (isLoading) {
    return <div style={{ padding: 32, color: '#888' }}>Carregando...</div>;
  }

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Visão por Curso</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
          {rows.length} cursos · {todos.length} docentes carregados
        </p>
      </div>

      {/* Gráfico top 15 */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Top 15 Cursos com Mais Pendências
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #eee', fontSize: 12 }}
              formatter={(v: number, name: string) => [v, name === 'pendentes' ? 'Com Pendência' : 'Total']}
            />
            <Bar dataKey="total"     fill="#E5E5E5" radius={[0, 3, 3, 0]} name="total"     />
            <Bar dataKey="pendentes" fill="#8A0538" radius={[0, 3, 3, 0]} name="pendentes" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Todos os Cursos
          </p>
          <span style={{ fontSize: 12, color: '#888' }}>{rows.length} cursos</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9f9f9' }}>
                {['Curso', 'Total', 'Com Pendência', '% Pendência', 'Simultânea', 'Só Agenda', 'Só TACH', 'Sem Pend.'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Curso' ? 'left' : 'center', fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.curso} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.curso}>
                    {r.curso}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: '#555' }}>{r.total}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: r.comPendencia > 0 ? '#C0392B' : '#555' }}>
                    {r.comPendencia}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                      <div style={{ flex: 1, maxWidth: 80, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${r.pct}%`, height: '100%', background: '#8A0538', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: r.pct > 50 ? '#C0392B' : '#555', minWidth: 30 }}>{r.pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: CORES_TIPO.simultanea }}>{r.porTipo.simultanea ?? 0}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: CORES_TIPO.somente_agenda }}>{r.porTipo.somente_agenda ?? 0}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: CORES_TIPO.somente_tach }}>{r.porTipo.somente_tach ?? 0}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: CORES_TIPO.sem_pendencia }}>{r.porTipo.sem_pendencia ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
