import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2, Search, Archive, ChevronLeft, ChevronRight, FileText, ExternalLink } from 'lucide-react';
import { relatoriosAPI } from '../services/api';
import { Card } from '../components/ui/Card';
import { SkeletonTable } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

function formatarBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR');
}

export function TodosRelatorios() {
  const qc = useQueryClient();
  const { mostrar } = useToast();
  const [busca, setBusca] = useState('');
  const [buscaAtiva, setBuscaAtiva] = useState('');
  const [pagina, setPagina] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['relatorios-lista', buscaAtiva, pagina],
    queryFn: () => relatoriosAPI.listar({ busca: buscaAtiva || undefined, pagina, limite: 15 }),
  });

  const excluirMut = useMutation({
    mutationFn: (nome: string) => relatoriosAPI.excluir(nome),
    onSuccess: () => {
      mostrar('info', 'PDF excluído com sucesso');
      qc.invalidateQueries({ queryKey: ['relatorios-lista'] });
    },
    onError: () => mostrar('erro', 'Erro ao excluir PDF'),
  });

  const relatorios = data?.relatorios || [];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Todos os Relatórios</h1>
          <p className="page-subtitle">Central de gerenciamento de PDFs gerados · {data?.total || 0} arquivo(s)</p>
        </div>
        <a href={relatoriosAPI.getZipUrl()} className="btn-primary btn-sm">
          <Archive size={15} /> Baixar Tudo (ZIP)
        </a>
      </div>

      {/* Busca */}
      <Card className="card--p-sm" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="form-control-wrapper" style={{ flex: 1 }}>
            <Search size={15} className="form-icon" />
            <input
              type="text"
              placeholder="Buscar por nome do arquivo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (setBuscaAtiva(busca), setPagina(1))}
              className="form-control"
            />
          </div>
          <button className="btn-primary btn-sm" onClick={() => { setBuscaAtiva(busca); setPagina(1); }}>Buscar</button>
          {buscaAtiva && (
            <button
              onClick={() => { setBusca(''); setBuscaAtiva(''); setPagina(1); }}
              className="pagination-btn"
              style={{ fontSize: 13, color: '#787878' }}
            >
              Limpar
            </button>
          )}
        </div>
      </Card>

      {/* Tabela */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : relatorios.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <FileText size={48} color="#E4E4E4" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#787878', margin: '0 0 8px' }}>Nenhum relatório gerado</h3>
          <p style={{ color: '#787878', margin: 0 }}>Acesse Relatórios para gerar PDFs dos docentes.</p>
        </Card>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {['#', 'Nome do Arquivo', 'Tamanho', 'Gerado em', 'Ações'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {relatorios.map((r, i) => (
                <tr key={r.nomeArquivo}>
                  <td style={{ color: '#787878', fontWeight: 600, width: 50 }}>{(pagina - 1) * 15 + i + 1}</td>
                  <td style={{ fontWeight: 600, color: '#1E1E1E' }}>
                    <div className="flex items-center gap-2">
                      <FileText size={15} color="#8A0538" />
                      <span style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {r.nomeArquivo.replace('.pdf', '').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#787878', marginTop: 2, marginLeft: 23 }}>{r.nomeArquivo}</div>
                  </td>
                  <td style={{ color: '#787878', whiteSpace: 'nowrap' }}>{formatarBytes(r.tamanhoBytes)}</td>
                  <td style={{ color: '#787878', fontSize: 13, whiteSpace: 'nowrap' }}>{formatarData(r.geradoEm)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={relatoriosAPI.getVisualizarUrl(r.nomeArquivo)} target="_blank" rel="noopener noreferrer"
                        title="Abrir PDF" className="btn-icon btn-icon--outline">
                        <ExternalLink size={13} />
                      </a>
                      <a href={relatoriosAPI.getDownloadUrl(r.nomeArquivo)} download title="Download"
                        className="btn-icon btn-icon--dl">
                        <Download size={13} />
                      </a>
                      <button
                        onClick={() => { if (confirm(`Excluir "${r.nomeArquivo}"?`)) excluirMut.mutate(r.nomeArquivo); }}
                        title="Excluir" className="btn-icon btn-icon--danger">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && data.totalPaginas > 1 && (
            <div className="pagination">
              <span className="pagination-info">{data.total} arquivos · Página {data.pagina} de {data.totalPaginas}</span>
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
