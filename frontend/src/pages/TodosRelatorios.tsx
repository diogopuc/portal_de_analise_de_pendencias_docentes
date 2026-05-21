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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 24, color: '#8A0538', margin: 0 }}>Todos os Relatórios</h1>
          <p style={{ color: '#787878', margin: '4px 0 0', fontSize: 13 }}>Central de gerenciamento de PDFs gerados · {data?.total || 0} arquivo(s)</p>
        </div>
        <a
          href={relatoriosAPI.getZipUrl()}
          className="btn-primary"
          style={{ textDecoration: 'none', height: 42, padding: '0 16px', fontSize: 13 }}
        >
          <Archive size={15} /> Baixar Tudo (ZIP)
        </a>
      </div>

      {/* Busca */}
      <Card style={{ marginBottom: 16, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} color="#787878" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por nome do arquivo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (setBuscaAtiva(busca), setPagina(1))}
              style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #E4E4E4', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button className="btn-primary" onClick={() => { setBuscaAtiva(busca); setPagina(1); }} style={{ height: 38, padding: '0 16px', fontSize: 13 }}>
            Buscar
          </button>
          {buscaAtiva && (
            <button onClick={() => { setBusca(''); setBuscaAtiva(''); setPagina(1); }}
              style={{ height: 38, padding: '0 12px', border: '1px solid #E4E4E4', borderRadius: 6, cursor: 'pointer', background: 'white', fontSize: 13, color: '#787878' }}>
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
          <h3 style={{ fontFamily: 'Poppins, sans-serif', color: '#787878', margin: '0 0 8px' }}>Nenhum relatório gerado</h3>
          <p style={{ color: '#787878', margin: 0 }}>Acesse Relatórios para gerar PDFs dos docentes.</p>
        </Card>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ backgroundColor: '#8A0538' }}>
                {['#', 'Nome do Arquivo', 'Tamanho', 'Gerado em', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', color: 'white', textAlign: 'left', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {relatorios.map((r, i) => (
                <tr
                  key={r.nomeArquivo}
                  style={{ backgroundColor: i % 2 === 0 ? '#FAFAFA' : 'white', borderBottom: '1px solid #E4E4E4' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0F2F2')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#FAFAFA' : 'white')}
                >
                  <td style={{ padding: '12px 16px', color: '#787878', fontWeight: 600, width: 50 }}>
                    {(pagina - 1) * 15 + i + 1}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1E1E1E' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={15} color="#8A0538" />
                      <span style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {r.nomeArquivo.replace('.pdf', '').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#787878', marginTop: 2, marginLeft: 23 }}>{r.nomeArquivo}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#787878', whiteSpace: 'nowrap' }}>{formatarBytes(r.tamanhoBytes)}</td>
                  <td style={{ padding: '12px 16px', color: '#787878', fontSize: 13, whiteSpace: 'nowrap' }}>{formatarData(r.geradoEm)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a
                        href={relatoriosAPI.getVisualizarUrl(r.nomeArquivo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir PDF"
                        style={{ padding: '6px 10px', border: '1px solid #8A0538', borderRadius: 6, cursor: 'pointer', background: '#8A0538', display: 'flex', alignItems: 'center', color: 'white', textDecoration: 'none' }}
                      >
                        <ExternalLink size={13} />
                      </a>
                      <a
                        href={relatoriosAPI.getDownloadUrl(r.nomeArquivo)}
                        download
                        title="Download"
                        style={{ padding: '6px 10px', border: '1px solid #E4E4E4', borderRadius: 6, cursor: 'pointer', background: '#F5F5F5', display: 'flex', alignItems: 'center', color: '#404040', textDecoration: 'none' }}
                      >
                        <Download size={13} />
                      </a>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir "${r.nomeArquivo}"?`)) excluirMut.mutate(r.nomeArquivo);
                        }}
                        title="Excluir"
                        style={{ padding: '6px 10px', border: '1px solid #FFE0E0', borderRadius: 6, cursor: 'pointer', background: '#FFE0E0', display: 'flex', alignItems: 'center', color: '#E5000C' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && data.totalPaginas > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #E4E4E4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#787878' }}>{data.total} arquivos · Página {data.pagina} de {data.totalPaginas}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                  style={{ padding: '6px 12px', border: '1px solid #E4E4E4', borderRadius: 6, cursor: 'pointer', background: 'white' }}>
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => setPagina(p => Math.min(data.totalPaginas, p + 1))} disabled={pagina === data.totalPaginas}
                  style={{ padding: '6px 12px', border: '1px solid #E4E4E4', borderRadius: 6, cursor: 'pointer', background: 'white' }}>
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
