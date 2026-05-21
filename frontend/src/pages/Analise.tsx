import { BookOpen, GitBranch, AlertCircle, CheckCircle, Info, BarChart2 } from 'lucide-react';
import { Card } from '../components/ui/Card';

interface SecaoProps {
  titulo: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Secao({ titulo, icon, children }: SecaoProps) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #8A0538' }}>
        <div style={{ color: '#8A0538' }}>{icon}</div>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, color: '#8A0538', margin: 0 }}>{titulo}</h2>
      </div>
      {children}
    </Card>
  );
}

export function Analise() {
  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 24, color: '#8A0538', margin: '0 0 6px' }}>Análise</h1>
      <p style={{ color: '#787878', margin: '0 0 24px', fontSize: 13 }}>Regras de negócio, fluxo de processamento e explicação dos dashboards</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <Secao titulo="Regras de Negócio" icon={<BookOpen size={20} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ backgroundColor: '#FAFAFA', borderRadius: 8, padding: 16, borderLeft: '4px solid #8A0538' }}>
                <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13, color: '#1E1E1E', margin: '0 0 6px' }}>Identificação do Docente</h4>
                <p style={{ fontSize: 13, color: '#404040', margin: 0 }}>A <strong>matrícula</strong> é o identificador único de cada docente. Não há duplicidade — cada matrícula representa um único profissional consolidado entre todas as semanas.</p>
              </div>

              <div style={{ backgroundColor: '#FFE0E0', borderRadius: 8, padding: 16, borderLeft: '4px solid #E5000C' }}>
                <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13, color: '#8A0538', margin: '0 0 8px' }}>Pendência de Agenda</h4>
                <div style={{ backgroundColor: '#8A0538', borderRadius: 6, padding: '8px 12px', marginBottom: 8, fontFamily: 'monospace', fontSize: 13, color: 'white', textAlign: 'center' }}>
                  Horas a Alocar &gt; 0
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#8A0538' }}>
                      <th style={{ padding: '6px 10px', color: 'white', textAlign: 'left' }}>Horas a Alocar</th>
                      <th style={{ padding: '6px 10px', color: 'white', textAlign: 'left' }}>Regra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Maior que 0', 'Pendência de Agenda', '#FFE0E0', '#E5000C'],
                      ['Igual a 0', 'Sem Pendência', '#EAFFD9', '#4BB218'],
                    ].map(([res, regra, bg, cor]) => (
                      <tr key={res} style={{ backgroundColor: bg }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: cor, fontSize: 12 }}>{res}</td>
                        <td style={{ padding: '6px 10px', color: '#1E1E1E', fontSize: 12 }}>{regra}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ backgroundColor: '#FFFDD9', borderRadius: 8, padding: 16, borderLeft: '4px solid #FAAD14' }}>
                <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13, color: '#1E1E1E', margin: '0 0 6px' }}>Pendências de TACH</h4>
                <p style={{ fontSize: 12, color: '#404040', margin: '0 0 8px' }}>São exibidos apenas os seguintes status (excluindo APROVADO):</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['AGUARDANDO APROVAÇÃO', 'NÃO CRIADO', 'NECESSÁRIO AJUSTAR', 'RASCUNHO', 'FINALIZADO'].map(s => (
                    <span key={s} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, backgroundColor: '#FAAD14', color: 'white', fontWeight: 700 }}>{s}</span>
                  ))}
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, backgroundColor: '#EAFFD9', color: '#4BB218', fontWeight: 700, textDecoration: 'line-through' }}>APROVADO (ignorado)</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#E5C3D0', borderRadius: 8, padding: 16, borderLeft: '4px solid #8A0538' }}>
                <h4 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13, color: '#8A0538', margin: '0 0 6px' }}>Classificação de Pendência</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    ['Somente Agenda', 'Apenas CH Contrato > Horas Alocadas', '#FFE0E0', '#E5000C'],
                    ['Somente TACH', 'Apenas status TACH com pendência', '#FFFDD9', '#FAAD14'],
                    ['Simultânea', 'Agenda E TACH com pendência', '#E5C3D0', '#8A0538'],
                    ['Sem Pendência', 'Nenhuma pendência identificada', '#EAFFD9', '#4BB218'],
                  ].map(([label, desc, bg, cor]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: bg, color: cor, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
                      <span style={{ fontSize: 12, color: '#404040' }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Secao>

          <Secao titulo="Estrutura das Semanas" icon={<BarChart2 size={20} />}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#8A0538' }}>
                  <th style={{ padding: '8px 12px', color: 'white', textAlign: 'left' }}>Semana</th>
                  <th style={{ padding: '8px 12px', color: 'white', textAlign: 'left' }}>Aba</th>
                  <th style={{ padding: '8px 12px', color: 'white', textAlign: 'left' }}>Período</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Semana 01', '01.04', '01/04'],
                  ['Semana 02', '06.04', '06/04 a 10/04'],
                  ['Semana 03', '13.04', '13/04 a 17/04'],
                  ['Semana 04', '20.04', '20/04 a 24/04'],
                  ['Semana 05', '27.04', '27/04 a 30/04'],
                ].map(([sem, aba, per], i) => (
                  <tr key={sem} style={{ backgroundColor: i % 2 === 0 ? '#FAFAFA' : 'white' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#8A0538' }}>{sem}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#404040' }}>{aba}</td>
                    <td style={{ padding: '8px 12px', color: '#404040' }}>{per}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 12, color: '#787878', margin: '10px 0 0' }}>* A aba "Resultado" e "Planilha2" são ignoradas no processamento.</p>
          </Secao>
        </div>

        <div>
          <Secao titulo="Fluxo de Processamento" icon={<GitBranch size={20} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { num: 1, label: 'Upload da planilha (.xlsx)', desc: 'Via interface ou arquivo padrão Atv_Pendentes_Abril.xlsx', cor: '#863BFF' },
                { num: 2, label: 'Leitura das abas', desc: 'ExcelReaderService lê e normaliza as 5 abas semanais', cor: '#8A0538' },
                { num: 3, label: 'Identificação de colunas', desc: 'Detecção automática com tolerância a variações de nomenclatura', cor: '#8A0538' },
                { num: 4, label: 'Aplicação das regras', desc: 'Cálculo de pendências Agenda (CH − Horas) e TACH (status)', cor: '#E5000C' },
                { num: 5, label: 'Consolidação por docente', desc: 'Agrupamento por matrícula em todas as semanas', cor: '#FAAD14' },
                { num: 6, label: 'Classificação do tipo', desc: 'somente_agenda / somente_tach / simultanea / sem_pendencia', cor: '#4BB218' },
                { num: 7, label: 'Geração dos PDFs', desc: 'PDFGenerationService gera arquivo individual ou em lote', cor: '#8A0538' },
                { num: 8, label: 'Download', desc: 'Download individual ou ZIP com todos os relatórios', cor: '#4BB218' },
              ].map((etapa) => (
                <div key={etapa.num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: etapa.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{etapa.num}</span>
                  </div>
                  <div style={{ flex: 1, paddingTop: 4 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: '#1E1E1E', margin: '0 0 2px' }}>{etapa.label}</p>
                    <p style={{ fontSize: 12, color: '#787878', margin: 0 }}>{etapa.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Secao>

          <Secao titulo="Status do TACH" icon={<AlertCircle size={20} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { status: 'APROVADO', cor: '#4BB218', bg: '#EAFFD9', desc: 'Sem pendência — não exibido no relatório' },
                { status: 'FINALIZADO', cor: '#4BB218', bg: '#EAFFD9', desc: 'Finalizado por importação — docente precisa refazer o TACH' },
                { status: 'AGUARDANDO APROVAÇÃO', cor: '#FAAD14', bg: '#FFFDD9', desc: 'Submetido, aguardando análise' },
                { status: 'RASCUNHO', cor: '#863BFF', bg: '#EFE4FF', desc: 'Em elaboração, não submetido' },
                { status: 'NÃO CRIADO', cor: '#E5000C', bg: '#FFE0E0', desc: 'TACH não foi criado no sistema' },
                { status: 'NECESSÁRIO AJUSTAR', cor: '#E5000C', bg: '#FFE0E0', desc: 'Devolvido para correção' },
              ].map(s => (
                <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', backgroundColor: s.bg, borderRadius: 6 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: s.cor, color: 'white', fontWeight: 700, whiteSpace: 'nowrap', minWidth: 160, textAlign: 'center' }}>{s.status}</span>
                  <span style={{ fontSize: 12, color: '#404040' }}>{s.desc}</span>
                </div>
              ))}
            </div>
          </Secao>

          <Secao titulo="Estrutura dos Relatórios PDF" icon={<CheckCircle size={20} />}>
            <div style={{ fontSize: 13, color: '#404040', lineHeight: 1.8 }}>
              <p style={{ margin: '0 0 8px' }}>Cada PDF contém:</p>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li><strong>Cabeçalho institucional</strong> com logo da PUCPR e cor primária (#8A0538)</li>
                <li><strong>Saudação personalizada</strong>: "Olá, Prof(a). [Nome]. Segue o detalhamento das pendências..."</li>
                <li><strong>Resumo visual</strong> de pendência de Agenda e TACH</li>
                <li><strong>Detalhamento por semana</strong> (Semana 01 a 05)</li>
                <li>Em cada semana: matrícula, CH, horas, saldo, status por dia</li>
                <li><strong>Nomenclatura:</strong> NOME_COMPLETO_DO_DOCENTE.pdf</li>
                <li><strong>Rodapé</strong> institucional com data de geração</li>
              </ul>
              <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: '#E5C3D0', borderRadius: 6, fontSize: 12 }}>
                <strong>Nota:</strong> O status APROVADO nunca é exibido no relatório PDF.
              </div>
            </div>
          </Secao>
        </div>
      </div>
    </div>
  );
}
