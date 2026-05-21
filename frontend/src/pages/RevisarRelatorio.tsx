import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight, FileText, RefreshCw, Download, CheckCircle, XCircle } from 'lucide-react';
import { docentesAPI, relatoriosAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { STATUS_TACH_CORES } from '../types';
import type { Docente } from '../types';

export function RevisarRelatorio() {
  const { mostrar } = useToast();
  const [busca, setBusca] = useState('');
  const [buscaAtiva, setBuscaAtiva] = useState('');
  const [docenteAtual, setDocenteAtual] = useState<Docente | null>(null);
  const [indiceAtual, setIndiceAtual] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['docentes-revisar', buscaAtiva],
    queryFn: () => docentesAPI.listar({ busca: buscaAtiva || undefined, limite: 50 }),
  });

  const gerarPDFMut = useMutation({
    mutationFn: (matricula: number) => relatoriosAPI.gerarPDF(matricula),
    onSuccess: (res) => mostrar('sucesso', `PDF gerado: ${res.nomeArquivo}`),
    onError: () => mostrar('erro', 'Erro ao gerar PDF'),
  });

  const docentes = data?.docentes || [];

  const selecionarDocente = (docente: Docente, idx: number) => {
    setDocenteAtual(docente);
    setIndiceAtual(idx);
  };

  const navegar = (direcao: 'anterior' | 'proximo') => {
    const novoIdx = direcao === 'anterior' ? indiceAtual - 1 : indiceAtual + 1;
    if (novoIdx >= 0 && novoIdx < docentes.length) {
      setDocenteAtual(docentes[novoIdx]);
      setIndiceAtual(novoIdx);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 24, color: '#8A0538', margin: '0 0 6px' }}>Revisar Relatório</h1>
      <p style={{ color: '#787878', margin: '0 0 24px', fontSize: 13 }}>Visualize e confira os dados de cada docente antes de gerar o PDF</p>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 220px)', minHeight: 500 }}>
        {/* Lista lateral */}
        <Card style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #E4E4E4' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#787878" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Buscar docente..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setBuscaAtiva(busca)}
                style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #E4E4E4', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {buscaAtiva && (
              <p style={{ fontSize: 11, color: '#787878', margin: '6px 0 0' }}>{docentes.length} resultado(s)</p>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#787878' }}>Carregando...</div>
            ) : docentes.map((d, idx) => (
              <button
                key={d.matricula}
                onClick={() => selecionarDocente(d, idx)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none',
                  backgroundColor: docenteAtual?.matricula === d.matricula ? '#E5C3D0' : 'transparent',
                  borderLeft: docenteAtual?.matricula === d.matricula ? '3px solid #8A0538' : '3px solid transparent',
                  cursor: 'pointer', display: 'block', transition: 'all 0.15s',
                  borderBottom: '1px solid #F0F2F2',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1E1E', lineHeight: 1.3, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.nomeDocente}
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {d.pendenciaAgenda && <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#E5000C', display: 'block', marginTop: 2 }} />}
                    {d.pendenciaTach && <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#FAAD14', display: 'block', marginTop: 2 }} />}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#787878', marginTop: 2 }}>{d.matricula} · {d.semanas.length} sem.</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Painel de detalhes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          {!docenteAtual ? (
            <Card style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <FileText size={48} color="#E4E4E4" />
              <p style={{ color: '#787878', fontSize: 15 }}>Selecione um docente para visualizar os dados</p>
            </Card>
          ) : (
            <>
              {/* Cabeçalho do docente */}
              <Card style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 18, color: '#8A0538', margin: '0 0 4px' }}>{docenteAtual.nomeDocente}</h2>
                    <p style={{ color: '#787878', margin: 0, fontSize: 13 }}>Matrícula: {docenteAtual.matricula} · {docenteAtual.campus}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => navegar('anterior')} disabled={indiceAtual === 0} style={{ padding: '6px 10px', border: '1px solid #E4E4E4', borderRadius: 6, cursor: 'pointer', background: 'white' }}>
                      <ChevronLeft size={15} />
                    </button>
                    <span style={{ fontSize: 12, color: '#787878' }}>{indiceAtual + 1}/{docentes.length}</span>
                    <button onClick={() => navegar('proximo')} disabled={indiceAtual === docentes.length - 1} style={{ padding: '6px 10px', border: '1px solid #E4E4E4', borderRadius: 6, cursor: 'pointer', background: 'white' }}>
                      <ChevronRight size={15} />
                    </button>
                    <button onClick={() => gerarPDFMut.mutate(docenteAtual.matricula)} disabled={gerarPDFMut.isPending}
                      className="btn-primary" style={{ height: 36, padding: '0 14px', fontSize: 13 }}>
                      {gerarPDFMut.isPending ? <RefreshCw size={13} className="animate-spin" /> : <FileText size={13} />}
                      Gerar PDF
                    </button>
                    <a href={relatoriosAPI.getDownloadUrl(`${docenteAtual.nomeDocente.toUpperCase().replace(/\s+/g, '_')}.pdf`)}
                      target="_blank" rel="noreferrer" className="btn-secondary" style={{ height: 36, padding: '0 12px', fontSize: 13, textDecoration: 'none' }}>
                      <Download size={13} />
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '4px 10px', borderRadius: 4, backgroundColor: docenteAtual.pendenciaAgenda ? '#FFE0E0' : '#EAFFD9', color: docenteAtual.pendenciaAgenda ? '#E5000C' : '#4BB218', fontWeight: 700 }}>
                    {docenteAtual.pendenciaAgenda ? <XCircle size={13} /> : <CheckCircle size={13} />}
                    Agenda: {docenteAtual.pendenciaAgenda ? 'PENDENTE' : 'OK'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '4px 10px', borderRadius: 4, backgroundColor: docenteAtual.pendenciaTach ? '#FFE0E0' : '#EAFFD9', color: docenteAtual.pendenciaTach ? '#E5000C' : '#4BB218', fontWeight: 700 }}>
                    {docenteAtual.pendenciaTach ? <XCircle size={13} /> : <CheckCircle size={13} />}
                    TACH: {docenteAtual.pendenciaTach ? 'PENDENTE' : 'OK'}
                  </span>
                  {docenteAtual.pendenciaSimultanea && (
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, backgroundColor: '#E5C3D0', color: '#8A0538', fontWeight: 700 }}>
                      SIMULTÂNEA
                    </span>
                  )}
                </div>
              </Card>

              {/* Semanas */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {docenteAtual.semanas.map((semana) => (
                  <Card key={semana.aba} style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#8A0538', margin: 0 }}>
                        {semana.semana} — ABA {semana.aba}
                      </h3>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: semana.pendenciaAgenda ? '#FFE0E0' : '#EAFFD9', color: semana.pendenciaAgenda ? '#E5000C' : '#4BB218', fontWeight: 700 }}>
                          {semana.resultadoAgenda}
                        </span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: semana.pendenciaTach ? '#FFE0E0' : '#EAFFD9', color: semana.pendenciaTach ? '#E5000C' : '#4BB218', fontWeight: 700 }}>
                          {semana.resultadoTach}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 12 }}>
                      {[
                        { label: 'CH Contrato', valor: `${semana.chContrato}h` },
                        { label: 'Horas a Alocar', valor: `${semana.horasAlocar}h` },
                        { label: 'Saldo', valor: `${(semana.chContrato - semana.horasAlocar).toFixed(1)}h`, cor: semana.pendenciaAgenda ? '#E5000C' : '#4BB218' },
                      ].map(({ label, valor, cor }) => (
                        <div key={label} style={{ backgroundColor: '#FAFAFA', borderRadius: 6, padding: '8px 12px', border: '1px solid #E4E4E4' }}>
                          <p style={{ fontSize: 10, fontWeight: 600, color: '#787878', margin: '0 0 2px', textTransform: 'uppercase' }}>{label}</p>
                          <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: cor || '#1E1E1E' }}>{valor}</p>
                        </div>
                      ))}
                    </div>

                    {semana.statusPorDia.length > 0 && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#787878', margin: '0 0 6px', textTransform: 'uppercase' }}>Status por dia</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {semana.statusPorDia.filter(s => s.status).map((sp, i) => {
                            const classe = STATUS_TACH_CORES[sp.status] || '';
                            const [textCor, bgCor] = classe.split(' ');
                            return (
                              <div key={i} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, backgroundColor: '#F0F2F2', border: '1px solid #E4E4E4' }}>
                                <span style={{ color: '#787878', marginRight: 4 }}>{sp.data}:</span>
                                <span style={{ fontWeight: 700, color: sp.status === 'APROVADO' ? '#4BB218' : sp.status === 'NÃO CRIADO' || sp.status === 'NECESSÁRIO AJUSTAR' ? '#E5000C' : sp.status === 'AGUARDANDO APROVAÇÃO' ? '#FAAD14' : sp.status === 'RASCUNHO' ? '#863BFF' : '#4BB218' }}>
                                  {sp.status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
