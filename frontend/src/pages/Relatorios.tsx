import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, RefreshCw, FileText, Download, Search, Filter, Loader2, ChevronLeft, ChevronRight, Archive } from 'lucide-react';
import { docentesAPI, relatoriosAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { SkeletonTable } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { TIPO_PENDENCIA_LABELS } from '../types';

const TIPO_COR: Record<string, { bg: string; color: string }> = {
  simultanea: { bg: '#E5C3D0', color: '#8A0538' },
  somente_agenda: { bg: '#FFE0E0', color: '#E5000C' },
  somente_tach: { bg: '#FFFDD9', color: '#FAAD14' },
  sem_pendencia: { bg: '#EAFFD9', color: '#4BB218' },
};

export function Relatorios() {
  const qc = useQueryClient();
  const { mostrar } = useToast();
  const [busca, setBusca] = useState('');
  const [campus, setCampus] = useState('');
  const [tipoPendencia, setTipoPendencia] = useState('');
  const [pagina, setPagina] = useState(1);
  const [gerandoTodos, setGerandoTodos] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: campusList } = useQuery({ queryKey: ['campus'], queryFn: docentesAPI.listarCampus });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['docentes', busca, campus, tipoPendencia, pagina],
    queryFn: () => docentesAPI.listar({ busca: busca || undefined, campus: campus || undefined, tipoPendencia: tipoPendencia || undefined, pagina, limite: 15 }),
  });

  const processarMut = useMutation({
    mutationFn: (arquivo?: File) => relatoriosAPI.processar(arquivo),
    onSuccess: (res) => {
      mostrar('sucesso', res.mensagem);
      qc.invalidateQueries({ queryKey: ['docentes'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => mostrar('erro', err.response?.data?.erro || 'Erro ao processar'),
  });

  const gerarPDFMut = useMutation({
    mutationFn: (matricula: number) => relatoriosAPI.gerarPDF(matricula),
    onSuccess: (res) => {
      mostrar('sucesso', `PDF gerado: ${res.nomeArquivo}`);
      qc.invalidateQueries({ queryKey: ['relatorios-lista'] });
    },
    onError: () => mostrar('erro', 'Erro ao gerar PDF'),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processarMut.mutate(f);
    e.target.value = '';
  };

  const handleGerarTodos = async () => {
    setGerandoTodos(true);
    setProgresso({ atual: 0, total: 0 });
    try {
      const res = await relatoriosAPI.gerarTodos();
      mostrar('sucesso', `${res.total} PDFs gerados com sucesso!`);
      qc.invalidateQueries({ queryKey: ['relatorios-lista'] });
    } catch (err: any) {
      mostrar('erro', err.response?.data?.erro || 'Erro ao gerar PDFs');
    } finally {
      setGerandoTodos(false);
    }
  };

  const buscarComFiltro = () => setPagina(1);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Processamento e geração de PDFs para docentes com pendências</p>
        </div>
        <div className="page-header-actions">
          <input ref={fileRef} type="file" accept=".xlsx" onChange={handleFileUpload} style={{ display: 'none' }} />
          <button className="btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={processarMut.isPending}>
            <Upload size={15} />
            {processarMut.isPending ? 'Processando...' : 'Upload Planilha'}
          </button>
          <button className="btn-primary btn-sm" onClick={() => processarMut.mutate(undefined)} disabled={processarMut.isPending}>
            <RefreshCw size={15} className={processarMut.isPending ? 'animate-spin' : ''} />
            Reprocessar
          </button>
        </div>
      </div>

      {processarMut.isPending && (
        <div className="status-banner status-banner--processing">
          <span className="status-dot status-dot--running" />
          <span style={{ color: '#8A0538', fontWeight: 600 }}>Processando planilha...</span>
        </div>
      )}

      {/* Ações em lote */}
      <Card className="card--p-md" style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600, fontSize: 14, color: '#1E1E1E', margin: '0 0 12px' }}>Ações Rápidas</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={handleGerarTodos} disabled={gerandoTodos || !data?.total}>
            {gerandoTodos ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            {gerandoTodos ? 'Gerando PDFs...' : `Gerar Todos os PDFs (${data?.total || 0})`}
          </button>
          <a href={relatoriosAPI.getZipUrl()} className="btn-secondary"><Archive size={15} />Baixar ZIP Completo</a>
          <a href={relatoriosAPI.getZipSimultaneasUrl()} className="btn-secondary"><Archive size={15} />ZIP Simultâneas</a>
          <a href={relatoriosAPI.getZipSomenteAgendaUrl()} className="btn-secondary"><Archive size={15} />ZIP Somente Agenda</a>
          <a href={relatoriosAPI.getZipSomenteTachUrl()} className="btn-secondary"><Archive size={15} />ZIP Somente TACH</a>
        </div>
      </Card>

      {/* Filtros */}
      <Card className="card--p-md" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Buscar</label>
            <div className="form-control-wrapper">
              <Search size={15} className="form-icon" />
              <input
                type="text"
                placeholder="Nome ou matrícula..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarComFiltro()}
                className="form-control"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Campus</label>
            <select
              value={campus}
              onChange={e => { setCampus(e.target.value); setPagina(1); }}
              className="form-control form-control--select"
            >
              <option value="">Todos</option>
              {campusList?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Tipo de Pendência</label>
            <select
              value={tipoPendencia}
              onChange={e => { setTipoPendencia(e.target.value); setPagina(1); }}
              className="form-control form-control--select"
            >
              <option value="">Todos</option>
              {Object.entries(TIPO_PENDENCIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button className="btn-primary btn-sm" onClick={buscarComFiltro}>
            <Filter size={14} /> Filtrar
          </button>
        </div>
      </Card>

      {/* Tabela */}
      {isLoading || isFetching ? (
        <SkeletonTable rows={10} />
      ) : (
        <div className="data-table-wrapper">
          <div className="data-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {['Matrícula', 'Nome Docente', 'Campus', 'Tipo de Pendência', 'Semanas', 'Ações'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.docentes?.map((d) => {
                  const cor = TIPO_COR[d.tipoPendencia] || TIPO_COR.sem_pendencia;
                  return (
                    <tr key={d.matricula}>
                      <td style={{ color: '#787878', fontWeight: 600 }}>{d.matricula}</td>
                      <td style={{ color: '#1E1E1E', fontWeight: 500, maxWidth: 240 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nomeDocente}</div>
                      </td>
                      <td style={{ color: '#404040', fontSize: 13 }}>{d.campus}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: cor.bg, color: cor.color }}>
                          {TIPO_PENDENCIA_LABELS[d.tipoPendencia]}
                        </span>
                      </td>
                      <td style={{ color: '#787878', fontSize: 13 }}>{d.semanas.length} semana(s)</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => gerarPDFMut.mutate(d.matricula)}
                            disabled={gerarPDFMut.isPending}
                            title="Gerar PDF"
                            className="btn-icon btn-icon--primary"
                          >
                            <FileText size={13} /> PDF
                          </button>
                          <a
                            href={`/api/relatorios/download/${d.nomeDocente.toUpperCase().replace(/\s+/g, '_').normalize('NFD').replace(/[̀-͠]/g, '').replace(/[^A-Z0-9_]/g, '')}.pdf`}
                            target="_blank"
                            rel="noreferrer"
                            title="Download PDF"
                            className="btn-icon btn-icon--muted"
                          >
                            <Download size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!data?.docentes?.length && (
                  <tr>
                    <td colSpan={6} className="data-table-empty">
                      Nenhum docente encontrado com os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.totalPaginas > 1 && (
            <div className="pagination">
              <span className="pagination-info">
                {data.total} docentes · Página {data.pagina} de {data.totalPaginas}
              </span>
              <div className="pagination-controls">
                <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="pagination-btn">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => setPagina(p => Math.min(data.totalPaginas, p + 1))} disabled={pagina === data.totalPaginas} className="pagination-btn">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
