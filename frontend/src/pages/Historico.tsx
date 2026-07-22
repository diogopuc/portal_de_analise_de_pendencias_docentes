import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GitCompare, Clock, FileText, TrendingDown, TrendingUp } from 'lucide-react';
import { historicoAPI } from '../services/api';

const TIPO_LABEL: Record<string, string> = {
  somente_agenda: 'Somente Agenda',
  somente_tach:   'Somente TACH',
  simultanea:     'Simultânea',
  sem_pendencia:  'Sem Pendência',
};

const TIPO_COR: Record<string, string> = {
  somente_agenda: '#E67E22',
  somente_tach:   '#8A0538',
  simultanea:     '#C0392B',
  sem_pendencia:  '#27AE60',
};

function formatTs(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function Historico() {
  const [selecA, setSelecA] = useState('');
  const [selecB, setSelecB] = useState('');
  const [comparando, setComparando] = useState(false);

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['historico-lista'],
    queryFn: historicoAPI.listar,
    staleTime: 30_000,
  });

  const { data: comparacao, isFetching: isFetchingComp } = useQuery({
    queryKey: ['historico-comp', selecA, selecB],
    queryFn: () => historicoAPI.comparar(selecA, selecB),
    enabled: comparando && !!selecA && !!selecB && selecA !== selecB,
  });

  const iniciarComparacao = () => {
    if (selecA && selecB && selecA !== selecB) setComparando(true);
  };

  if (isLoading) {
    return <div style={{ padding: 32, color: '#888' }}>Carregando histórico...</div>;
  }

  const lista = snapshots ?? [];

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Histórico de Evolução</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
          {lista.length} snapshot{lista.length !== 1 ? 's' : ''} disponível{lista.length !== 1 ? 'is' : ''}
        </p>
      </div>

      {lista.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <FileText size={40} color="#ddd" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: '#aaa', margin: 0, fontSize: 14 }}>Nenhum snapshot encontrado. Reprocesse a planilha para criar o primeiro.</p>
        </div>
      ) : (
        <>
          {/* Comparação */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GitCompare size={15} /> Comparar Processamentos
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  De (snapshot anterior)
                </label>
                <select
                  value={selecA}
                  onChange={e => { setSelecA(e.target.value); setComparando(false); }}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="">Selecione...</option>
                  {lista.map(s => (
                    <option key={s.file} value={s.file}>{formatTs(s.timestamp)} — {s.totalDocentes} doc.</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Para (snapshot atual)
                </label>
                <select
                  value={selecB}
                  onChange={e => { setSelecB(e.target.value); setComparando(false); }}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="">Selecione...</option>
                  {lista.map(s => (
                    <option key={s.file} value={s.file}>{formatTs(s.timestamp)} — {s.totalDocentes} doc.</option>
                  ))}
                </select>
              </div>
              <button
                onClick={iniciarComparacao}
                disabled={!selecA || !selecB || selecA === selecB || isFetchingComp}
                style={{
                  background: '#8A0538', color: '#fff', border: 'none', borderRadius: 8,
                  padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  opacity: (!selecA || !selecB || selecA === selecB) ? 0.5 : 1,
                }}
              >
                <GitCompare size={14} />
                {isFetchingComp ? 'Comparando...' : 'Comparar'}
              </button>
            </div>
          </div>

          {/* Resultado comparação */}
          {comparacao && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Delta KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {Object.entries(comparacao.delta).map(([tipo, delta]) => (
                  <div key={tipo} className="card" style={{ padding: '14px 18px', borderTop: `3px solid ${TIPO_COR[tipo] ?? '#888'}` }}>
                    <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {TIPO_LABEL[tipo] ?? tipo}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: delta < 0 ? '#27AE60' : delta > 0 ? '#C0392B' : '#888' }}>
                        {delta > 0 ? `+${delta}` : delta}
                      </p>
                      {delta !== 0 && (delta < 0
                        ? <TrendingDown size={18} color="#27AE60" />
                        : <TrendingUp size={18} color="#C0392B" />
                      )}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888' }}>
                      {comparacao.antes.porTipo[tipo] ?? 0} → {comparacao.depois.porTipo[tipo] ?? 0}
                    </p>
                  </div>
                ))}
              </div>

              {/* Regularizados */}
              {comparacao.regularizados.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', background: '#f0fdf4', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingDown size={15} color="#27AE60" />
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#166534' }}>
                      Regularizados ({comparacao.regularizados.length})
                    </p>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      {comparacao.regularizados.map(d => (
                        <tr key={d.matricula} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '9px 20px', color: '#888', width: 100 }}>{d.matricula}</td>
                          <td style={{ padding: '9px 20px', fontWeight: 500 }}>{d.nomeDocente}</td>
                          <td style={{ padding: '9px 20px', color: '#555' }}>{d.campus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Novas pendências */}
              {comparacao.novasPendencias.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', background: '#fff5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={15} color="#C0392B" />
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#7f1d1d' }}>
                      Novas Pendências ({comparacao.novasPendencias.length})
                    </p>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      {comparacao.novasPendencias.map(d => (
                        <tr key={d.matricula} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '9px 20px', color: '#888', width: 100 }}>{d.matricula}</td>
                          <td style={{ padding: '9px 20px', fontWeight: 500 }}>{d.nomeDocente}</td>
                          <td style={{ padding: '9px 20px', color: '#555' }}>{d.campus}</td>
                          <td style={{ padding: '9px 20px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: TIPO_COR[d.tipoPendencia] ?? '#888' }}>
                              {TIPO_LABEL[d.tipoPendencia] ?? d.tipoPendencia}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {comparacao.regularizados.length === 0 && comparacao.novasPendencias.length === 0 && (
                <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ color: '#888', margin: 0, fontSize: 14 }}>Nenhuma alteração entre os dois processamentos.</p>
                </div>
              )}
            </div>
          )}

          {/* Lista de snapshots */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Todos os Processamentos
              </p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9f9f9' }}>
                  {['Data/Hora', 'Arquivo', 'Total Docentes', 'Agenda', 'TACH', 'Simultânea', 'Sem Pend.'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map((s, i) => (
                  <tr key={s.file} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, color: '#555' }}>
                      <Clock size={12} color="#aaa" />
                      {formatTs(s.timestamp)}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#888', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.arquivo}>
                      {s.arquivo.split(/[/\\]/).pop()}
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: '#333' }}>{s.totalDocentes}</td>
                    <td style={{ padding: '10px 16px', color: TIPO_COR.somente_agenda }}>{s.porTipo.somente_agenda ?? 0}</td>
                    <td style={{ padding: '10px 16px', color: TIPO_COR.somente_tach }}>{s.porTipo.somente_tach ?? 0}</td>
                    <td style={{ padding: '10px 16px', color: TIPO_COR.simultanea }}>{s.porTipo.simultanea ?? 0}</td>
                    <td style={{ padding: '10px 16px', color: TIPO_COR.sem_pendencia }}>{s.porTipo.sem_pendencia ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
