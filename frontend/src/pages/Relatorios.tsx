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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 24, color: '#8A0538', margin: 0 }}>Relatórios</h1>
          <p style={{ color: '#787878', margin: '4px 0 0', fontSize: 13 }}>Processamento e geração de PDFs para docentes com pendências</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept=".xlsx" onChange={handleFileUpload} style={{ display: 'none' }} />
          <button className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={processarMut.isPending} style={{ height: 42, padding: '0 16px', fontSize: 13 }}>
            <Upload size={15} />
            {processarMut.isPending ? 'Processando...' : 'Upload Planilha'}
          </button>
          <button className="btn-primary" onClick={() => processarMut.mutate(undefined)} disabled={processarMut.isPending} style={{ height: 42, padding: '0 16px', fontSize: 13 }}>
            <RefreshCw size={15} className={processarMut.isPending ? 'animate-spin' : ''} />
            Reprocessar
          </button>
        </div>
      </div>

      {processarMut.isPending && (
        <Card style={{ marginBottom: 16, backgroundColor: '#E5C3D0', border: '1px solid #8A0538' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Loader2 size={20} color="#8A0538" className="animate-spin" />
            <span style={{ color: '#8A0538', fontWeight: 600 }}>Processando planilha...</span>
          </div>
        </Card>
      )}

      {/* Ações em lote */}
      <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14, color: '#1E1E1E', margin: '0 0 12px' }}>Ações Rápidas</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={handleGerarTodos} disabled={gerandoTodos || !data?.total} style={{ fontSize: 13 }}>
            {gerandoTodos ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            {gerandoTodos ? 'Gerando PDFs...' : `Gerar Todos os PDFs (${data?.total || 0})`}
          </button>
          <a href={relatoriosAPI.getZipUrl()} className="btn-secondary" style={{ textDecoration: 'none', fontSize: 13, height: 48 }}>
            <Archive size={15} />
            Baixar ZIP Completo
          </a>
          <a href={relatoriosAPI.getZipSimultaneasUrl()} className="btn-secondary" style={{ textDecoration: 'none', fontSize: 13, height: 48, borderColor: '#8C0E28', color: '#8C0E28' }}>
            <Archive size={15} />
            ZIP Simultâneas
          </a>
          <a href={relatoriosAPI.getZipSomenteAgendaUrl()} className="btn-secondary" style={{ textDecoration: 'none', fontSize: 13, height: 48, borderColor: '#E5000C', color: '#E5000C' }}>
            <Archive size={15} />
            ZIP Somente Agenda
          </a>
          <a href={relatoriosAPI.getZipSomenteTachUrl()} className="btn-secondary" style={{ textDecoration: 'none', fontSize: 13, height: 48, borderColor: '#FAAD14', color: '#FAAD14' }}>
            <Archive size={15} />
            ZIP Somente TACH
          </a>
        </div>
      </Card>

      {/* Filtros */}
      <Card style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#787878', marginBottom: 6 }}>BUSCAR</label>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#787878" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Nome ou matrícula..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarComFiltro()}
                style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #E4E4E4', borderRadius: 6, fontSize: 14, outline: 'none', color: '#1E1E1E' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#787878', marginBottom: 6 }}>CAMPUS</label>
            <select
              value={campus}
              onChange={e => { setCampus(e.target.value); setPagina(1); }}
              style={{ padding: '8px 32px 8px 12px', border: '1px solid #E4E4E4', borderRadius: 6, fontSize: 14, color: '#1E1E1E', backgroundColor: 'white', cursor: 'pointer' }}
            >
              <option value="">Todos</option>
              {campusList?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#787878', marginBottom: 6 }}>TIPO DE PENDÊNCIA</label>
            <select
              value={tipoPendencia}
              onChange={e => { setTipoPendencia(e.target.value); setPagina(1); }}
              style={{ padding: '8px 32px 8px 12px', border: '1px solid #E4E4E4', borderRadius: 6, fontSize: 14, color: '#1E1E1E', backgroundColor: 'white', cursor: 'pointer' }}
            >
              <option value="">Todos</option>
              {Object.entries(TIPO_PENDENCIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={buscarComFiltro} style={{ height: 38, padding: '0 16px', fontSize: 13 }}>
            <Filter size={14} /> Filtrar
          </button>
        </div>
      </Card>

      {/* Tabela */}
      {isLoading || isFetching ? (
        <SkeletonTable rows={10} />
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: '#8A0538' }}>
                  {['Matrícula', 'Nome Docente', 'Campus', 'Tipo de Pendência', 'Semanas', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', color: 'white', textAlign: 'left', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.docentes?.map((d, i) => {
                  const cor = TIPO_COR[d.tipoPendencia] || TIPO_COR.sem_pendencia;
                  return (
                    <tr key={d.matricula} style={{ backgroundColor: i % 2 === 0 ? '#FAFAFA' : 'white', borderBottom: '1px solid #E4E4E4', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0F2F2')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#FAFAFA' : 'white')}
                    >
                      <td style={{ padding: '12px 16px', color: '#787878', fontWeight: 600 }}>{d.matricula}</td>
                      <td style={{ padding: '12px 16px', color: '#1E1E1E', fontWeight: 500, maxWidth: 240 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nomeDocente}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#404040', fontSize: 13 }}>{d.campus}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ backgroundColor: cor.bg, color: cor.color, borderRadius: 4, padding: '3px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {TIPO_PENDENCIA_LABELS[d.tipoPendencia]}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#787878', fontSize: 13 }}>{d.semanas.length} semana(s)</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => gerarPDFMut.mutate(d.matricula)}
                            disabled={gerarPDFMut.isPending}
                            title="Gerar PDF"
                            style={{ background: '#8A0538', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'white', fontSize: 12, fontWeight: 600 }}
                          >
                            <FileText size={13} /> PDF
                          </button>
                          <a
                            href={`/api/relatorios/download/${d.nomeDocente.toUpperCase().replace(/\s+/g, '_').normalize('NFD').replace(/[̀-͠]/g, '').replace(/[^A-Z0-9_]/g, '')}.pdf`}
                            target="_blank"
                            rel="noreferrer"
                            title="Download PDF"
                            style={{ background: '#E5C3D0', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#8A0538', textDecoration: 'none' }}
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
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#787878' }}>
                      Nenhum docente encontrado com os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {data && data.totalPaginas > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #E4E4E4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#787878' }}>
                {data.total} docentes · Página {data.pagina} de {data.totalPaginas}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                  style={{ padding: '6px 12px', border: '1px solid #E4E4E4', borderRadius: 6, cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => setPagina(p => Math.min(data.totalPaginas, p + 1))} disabled={pagina === data.totalPaginas}
                  style={{ padding: '6px 12px', border: '1px solid #E4E4E4', borderRadius: 6, cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center' }}>
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
