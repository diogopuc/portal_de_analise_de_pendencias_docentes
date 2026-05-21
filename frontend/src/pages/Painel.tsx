import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { Users, AlertTriangle, Clock, CheckCircle, RefreshCw, Calendar } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { StatCard, Card } from '../components/ui/Card';
import { SkeletonCard } from '../components/ui/Skeleton';

const CORES_TACH: Record<string, string> = {
  'NÃO CRIADO': '#E5000C',
  'AGUARDANDO APROVAÇÃO': '#FAAD14',
  'NECESSÁRIO AJUSTAR': '#8C0E28',
  'RASCUNHO': '#863BFF',
  'FINALIZADO': '#4BB218',
};

function formatarData(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}

export function Painel() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardAPI.getDados,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 24, color: '#8A0538', margin: 0 }}>Painel</h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!data || data.totalDocentes === 0) {
    return (
      <div>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 24, color: '#8A0538', margin: '0 0 24px' }}>Painel</h1>
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <AlertTriangle size={48} color="#FAAD14" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: 'Poppins, sans-serif', color: '#1E1E1E', margin: '0 0 8px' }}>Nenhum dado processado</h2>
          <p style={{ color: '#787878', marginBottom: 24 }}>Acesse a página de Relatórios para processar a planilha.</p>
          <a href="/relatorios" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Ir para Relatórios</a>
        </Card>
      </div>
    );
  }

  const percRevisado = data.totalDocentes > 0
    ? Math.round(((data.totalPendenciaAgenda + data.totalPendenciaTach) / (data.totalDocentes * 2)) * 100)
    : 0;

  return (
    <div className="animate-fadeIn">
      {/* Título */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 24, color: '#8A0538', margin: 0 }}>Painel</h1>
          <p style={{ color: '#787878', margin: '4px 0 0', fontSize: 13 }}>
            Última atualização: {formatarData(data.ultimaAtualizacao)} · {data.arquivoProcessado}
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary" disabled={isFetching} style={{ height: 40, padding: '0 16px', fontSize: 13 }}>
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          {isFetching ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* Badge revisado */}
      <div style={{ position: 'fixed', top: 16, right: 80, zIndex: 100 }}>
        <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.4)' }}>
          {percRevisado}% revisado
        </span>
      </div>

      {/* Cards de estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard titulo="Total de Docentes" valor={data.totalDocentes} subtitulo="docentes na planilha" icon={<Users size={20} />} cor="#8A0538" />
        <StatCard titulo="Pendência de Agenda" valor={data.totalPendenciaAgenda} subtitulo="aguardando regularização" icon={<AlertTriangle size={20} />} cor="#E5000C" />
        <StatCard titulo="Pendência de TACH" valor={data.totalPendenciaTach} subtitulo="status em aberto" icon={<Clock size={20} />} cor="#FAAD14" />
        <StatCard titulo="Pendência Simultânea" valor={data.totalSimultaneo} subtitulo="agenda + TACH" icon={<AlertTriangle size={20} />} cor="#8C0E28" destaque />
        <StatCard titulo="Sem Pendências" valor={data.semPendencia} subtitulo="em conformidade" icon={<CheckCircle size={20} />} cor="#4BB218" />
      </div>

      {/* Gráficos linha 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Progresso por semana */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14, color: '#8A0538', margin: '0 0 16px', borderLeft: '3px solid #8A0538', paddingLeft: 10 }}>
            PROGRESSO POR SEMANA
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.porSemana} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E4" vertical={false} />
              <XAxis dataKey="semana" tick={{ fontSize: 11, fill: '#787878' }} />
              <YAxis tick={{ fontSize: 11, fill: '#787878' }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="pendenciaAgenda" name="Agenda" fill="#E5000C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pendenciaTach" name="TACH" fill="#FAAD14" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribuição de tipos */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14, color: '#8A0538', margin: '0 0 16px', borderLeft: '3px solid #8A0538', paddingLeft: 10 }}>
            TIPOS DE PENDÊNCIA
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Somente Agenda', value: data.totalPendenciaAgenda - data.totalSimultaneo },
                  { name: 'Somente TACH', value: data.totalPendenciaTach - data.totalSimultaneo },
                  { name: 'Simultânea', value: data.totalSimultaneo },
                  { name: 'Sem Pendência', value: data.semPendencia },
                ].filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                <Cell fill="#E5000C" />
                <Cell fill="#FAAD14" />
                <Cell fill="#8A0538" />
                <Cell fill="#4BB218" />
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Gráficos linha 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Por campus */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14, color: '#8A0538', margin: '0 0 16px', borderLeft: '3px solid #8A0538', paddingLeft: 10 }}>
            PENDENTES POR CAMPUS
          </h3>
          {data.porCampus.slice(0, 5).map((item, i) => {
            const max = data.porCampus[0]?.total || 1;
            const pct = Math.round((item.total / max) * 100);
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#404040', fontWeight: 500 }}>{item.campus}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#8A0538' }}>{item.total}</span>
                </div>
                <div style={{ backgroundColor: '#E4E4E4', borderRadius: 4, height: 6 }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#8A0538', borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
        </Card>

        {/* Status TACH */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14, color: '#8A0538', margin: '0 0 16px', borderLeft: '3px solid #8A0538', paddingLeft: 10 }}>
            DISTRIBUIÇÃO STATUS TACH
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.statusTachDistribuicao.slice(0, 6).map((item, i) => {
              const max = data.statusTachDistribuicao[0]?.total || 1;
              const pct = Math.round((item.total / max) * 100);
              const cor = CORES_TACH[item.status] || '#787878';
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: '#404040' }}>{item.status}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: cor }}>{item.total}</span>
                  </div>
                  <div style={{ backgroundColor: '#E4E4E4', borderRadius: 4, height: 5 }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: cor, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
