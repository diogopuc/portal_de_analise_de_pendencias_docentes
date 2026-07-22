import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight, FileText, RefreshCw, Download, CheckCircle, XCircle, Mail, X } from 'lucide-react';
import { docentesAPI, relatoriosAPI, emailAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { STATUS_TACH_CORES } from '../types';
import type { Docente } from '../types';

export function RevisarRelatorio() {
  const { mostrar } = useToast();
  const [searchParams] = useSearchParams();
  const matriculaParam = searchParams.get('matricula') ?? '';

  const [busca, setBusca] = useState('');
  const [buscaAtiva, setBuscaAtiva] = useState(matriculaParam);
  const [docenteAtual, setDocenteAtual] = useState<Docente | null>(null);
  const [indiceAtual, setIndiceAtual] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['docentes-revisar', buscaAtiva],
    queryFn: () => docentesAPI.listar({ busca: buscaAtiva || undefined, limite: 50 }),
  });

  // Auto-seleciona o docente quando a página é aberta via param de matrícula
  useEffect(() => {
    if (!matriculaParam) return;
    const docentes = data?.docentes ?? [];
    if (docentes.length === 0 || docenteAtual) return;
    const idx = docentes.findIndex(d => String(d.matricula) === matriculaParam);
    if (idx !== -1) {
      setDocenteAtual(docentes[idx]);
      setIndiceAtual(idx);
    }
  }, [data, matriculaParam]);

  const [modalEmail, setModalEmail] = useState(false);
  const [emailDest, setEmailDest]   = useState('');
  const [emailAssunto, setEmailAssunto] = useState('');
  const [emailCorpo, setEmailCorpo]     = useState('');

  const abrirModalEmail = (docente: NonNullable<typeof docenteAtual>) => {
    setEmailDest('');
    setEmailAssunto(`Relatório de Pendências — ${docente.nomeDocente}`);
    setEmailCorpo(`Prezado(a),\n\nSegue em anexo o relatório de pendências de ${docente.nomeDocente} (matrícula ${docente.matricula}).\n\nAtenciosamente,\nGPCA — PUCPR`);
    setModalEmail(true);
  };

  const gerarPDFMut = useMutation({
    mutationFn: (matricula: number) => relatoriosAPI.gerarPDF(matricula),
    onSuccess: (res) => mostrar('sucesso', `PDF gerado: ${res.nomeArquivo}`),
    onError: () => mostrar('erro', 'Erro ao gerar PDF'),
  });

  const enviarEmailMut = useMutation({
    mutationFn: () => emailAPI.enviar({
      matricula: docenteAtual!.matricula,
      email:     emailDest,
      assunto:   emailAssunto,
      corpo:     emailCorpo,
    }),
    onSuccess: (res) => { mostrar('sucesso', res.mensagem); setModalEmail(false); },
    onError: (err: any) => mostrar('erro', err?.response?.data?.erro ?? 'Erro ao enviar e-mail.'),
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>Revisar Relatório</h1>
      <p className="page-subtitle" style={{ marginBottom: 24 }}>Visualize e confira os dados de cada docente antes de gerar o PDF</p>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 220px)', minHeight: 500 }}>
        {/* Lista lateral */}
        <Card className="card--no-pad card--flex-col card--overflow">
          <div style={{ padding: '16px', borderBottom: '1px solid #E4E4E4' }}>
            <div className="form-control-wrapper">
              <Search size={14} className="form-icon" />
              <input
                type="text"
                placeholder="Buscar docente..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setBuscaAtiva(busca)}
                className="form-control"
                style={{ fontSize: 13 }}
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
                className={`docente-item${docenteAtual?.matricula === d.matricula ? ' docente-item--active' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p className="docente-item__name">{d.nomeDocente}</p>
                  <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                    {d.pendenciaAgenda && <span className="status-dot status-dot--err" />}
                    {d.pendenciaTach && <span className="status-dot status-dot--warn" />}
                    {!d.pendenciaAgenda && !d.pendenciaTach && <span className="status-dot status-dot--ok" />}
                  </div>
                </div>
                <p className="docente-item__meta">{d.matricula} · {d.semanas.length} sem.</p>
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
              <Card className="card--p-md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ fontWeight: 700, fontSize: 18, color: '#8A0538', margin: '0 0 4px' }}>{docenteAtual.nomeDocente}</h2>
                    <p style={{ color: '#787878', margin: 0, fontSize: 13 }}>Matrícula: {docenteAtual.matricula} · {docenteAtual.campus}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => navegar('anterior')} disabled={indiceAtual === 0} className="pagination-btn">
                      <ChevronLeft size={15} />
                    </button>
                    <span style={{ fontSize: 12, color: '#787878' }}>{indiceAtual + 1}/{docentes.length}</span>
                    <button onClick={() => navegar('proximo')} disabled={indiceAtual === docentes.length - 1} className="pagination-btn">
                      <ChevronRight size={15} />
                    </button>
                    <button onClick={() => gerarPDFMut.mutate(docenteAtual.matricula)} disabled={gerarPDFMut.isPending}
                      className="btn-primary btn-xs">
                      {gerarPDFMut.isPending ? <RefreshCw size={13} className="animate-spin" /> : <FileText size={13} />}
                      Gerar PDF
                    </button>
                    <a href={relatoriosAPI.getDownloadUrl(relatoriosAPI.getNomeArquivo(docenteAtual.nomeDocente, docenteAtual.matricula))}
                      target="_blank" rel="noreferrer" className="btn-secondary btn-xs">
                      <Download size={13} />
                    </a>
                    <button
                      onClick={() => abrirModalEmail(docenteAtual)}
                      className="btn-secondary btn-xs"
                      title="Enviar PDF por e-mail"
                    >
                      <Mail size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <span className={`badge${docenteAtual.pendenciaAgenda ? ' badge--pendencia' : ' badge--ok'}`}>
                    {docenteAtual.pendenciaAgenda ? <XCircle size={13} /> : <CheckCircle size={13} />}
                    Agenda: {docenteAtual.pendenciaAgenda ? 'PENDENTE' : 'OK'}
                  </span>
                  <span className={`badge${docenteAtual.pendenciaTach ? ' badge--pendencia' : ' badge--ok'}`}>
                    {docenteAtual.pendenciaTach ? <XCircle size={13} /> : <CheckCircle size={13} />}
                    TACH: {docenteAtual.pendenciaTach ? 'PENDENTE' : 'OK'}
                  </span>
                  {docenteAtual.pendenciaSimultanea && (
                    <span className="badge badge--simultanea">SIMULTÂNEA</span>
                  )}
                </div>
              </Card>

              {/* Semanas */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {docenteAtual.semanas.map((semana) => (
                  <Card key={semana.aba} className="card--p-md">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ fontWeight: 700, fontSize: 13, color: '#8A0538', margin: 0 }}>
                        {semana.semana} — ABA {semana.aba}
                      </h3>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span className={`badge${semana.pendenciaAgenda ? ' badge--pendencia' : ' badge--ok'}`} style={{ fontSize: 11 }}>
                          {semana.resultadoAgenda}
                        </span>
                        <span className={`badge${semana.pendenciaTach ? ' badge--pendencia' : ' badge--ok'}`} style={{ fontSize: 11 }}>
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

      {/* Modal de envio de e-mail */}
      {modalEmail && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setModalEmail(false)}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: '28px 32px', width: 480, maxWidth: '95vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={16} color="#8A0538" /> Enviar Relatório por E-mail
              </h3>
              <button onClick={() => setModalEmail(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Destinatário *
                </label>
                <input
                  type="email"
                  value={emailDest}
                  onChange={e => setEmailDest(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Assunto
                </label>
                <input
                  type="text"
                  value={emailAssunto}
                  onChange={e => setEmailAssunto(e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Mensagem
                </label>
                <textarea
                  value={emailCorpo}
                  onChange={e => setEmailCorpo(e.target.value)}
                  rows={5}
                  className="form-control"
                  style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setModalEmail(false)} className="btn-secondary">Cancelar</button>
              <button
                onClick={() => enviarEmailMut.mutate()}
                disabled={!emailDest || enviarEmailMut.isPending}
                style={{
                  background: '#8A0538', color: '#fff', border: 'none', borderRadius: 8,
                  padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  opacity: !emailDest ? 0.5 : 1,
                }}
              >
                <Mail size={14} />
                {enviarEmailMut.isPending ? 'Enviando...' : 'Enviar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
