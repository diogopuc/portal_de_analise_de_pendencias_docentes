import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { configAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import type { SemanaConfig, SemanasConfigData } from '../types';

export function Configuracao() {
  const qc = useQueryClient();
  const { mostrar } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['config-semanas'],
    queryFn: configAPI.getSemanas,
    staleTime: 0,
  });

  const [semanas, setSemanas] = useState<SemanaConfig[]>([]);
  const [abonadas, setAbonadas] = useState<Record<string, string>>({});
  const [inicializado, setInicializado] = useState(false);

  if (data && !inicializado) {
    setSemanas(JSON.parse(JSON.stringify(data.semanas)));
    setAbonadas({ ...data.abonadas });
    setInicializado(true);
  }

  const salvarMut = useMutation({
    mutationFn: (cfg: SemanasConfigData) => configAPI.putSemanas(cfg),
    onSuccess: (res) => {
      mostrar('sucesso', res.mensagem);
      qc.invalidateQueries({ queryKey: ['config-semanas'] });
    },
    onError: () => mostrar('erro', 'Erro ao salvar configuração.'),
  });

  const addSemana = () => {
    setSemanas(prev => [...prev, { aba: '', semana: '', periodo: '' }]);
  };

  const removeSemana = (i: number) => {
    setSemanas(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateSemana = (i: number, field: keyof SemanaConfig, val: string) => {
    setSemanas(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const addAbonada = () => {
    setAbonadas(prev => ({ ...prev, '': '' }));
  };

  const removeAbonada = (aba: string) => {
    const next = { ...abonadas };
    delete next[aba];
    setAbonadas(next);
  };

  const updateAbonadaAba = (abaAntiga: string, novaAba: string) => {
    const next: Record<string, string> = {};
    Object.entries(abonadas).forEach(([k, v]) => {
      next[k === abaAntiga ? novaAba : k] = v;
    });
    setAbonadas(next);
  };

  const updateAbonadaMotivo = (aba: string, motivo: string) => {
    setAbonadas(prev => ({ ...prev, [aba]: motivo }));
  };

  const salvar = () => {
    salvarMut.mutate({ semanas, abonadas });
  };

  if (isLoading) {
    return <div style={{ padding: 32, color: '#888' }}>Carregando configuração...</div>;
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#555',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    border: '1px solid #ddd', borderRadius: 6, padding: '7px 10px',
    fontSize: 13, color: '#1a1a1a', background: '#fff', width: '100%',
    outline: 'none',
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Configuração de Mês</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
            Defina as semanas e semanas abonadas. Reprocesse a planilha após salvar.
          </p>
        </div>
        <button
          onClick={salvar}
          disabled={salvarMut.isPending}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#8A0538', color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Save size={14} />
          {salvarMut.isPending ? 'Salvando...' : 'Salvar Configuração'}
        </button>
      </div>

      {/* Alerta */}
      <div style={{ display: 'flex', gap: 10, background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: 8, padding: '12px 16px', alignItems: 'flex-start' }}>
        <AlertTriangle size={16} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 13, color: '#78350F' }}>
          Após salvar, as alterações só terão efeito após reprocessar a planilha na tela de Relatórios.
        </p>
      </div>

      {/* Semanas */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Semanas do Mês
          </p>
          <button
            onClick={addSemana}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: '1px solid #ddd', borderRadius: 6,
              padding: '5px 12px', fontSize: 12, color: '#555', cursor: 'pointer',
            }}
          >
            <Plus size={13} /> Adicionar Semana
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {semanas.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 10, alignItems: 'flex-end' }}>
              <div>
                <label style={labelStyle}>Aba (ex: 01.06)</label>
                <input
                  style={inputStyle}
                  value={s.aba}
                  onChange={e => updateSemana(i, 'aba', e.target.value)}
                  placeholder="01.06"
                />
              </div>
              <div>
                <label style={labelStyle}>Nome da Semana</label>
                <input
                  style={inputStyle}
                  value={s.semana}
                  onChange={e => updateSemana(i, 'semana', e.target.value)}
                  placeholder="Semana 01"
                />
              </div>
              <div>
                <label style={labelStyle}>Período</label>
                <input
                  style={inputStyle}
                  value={s.periodo}
                  onChange={e => updateSemana(i, 'periodo', e.target.value)}
                  placeholder="01/06 a 07/06"
                />
              </div>
              <button
                onClick={() => removeSemana(i)}
                style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 6, padding: '7px 9px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {semanas.length === 0 && (
            <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, padding: '20px 0' }}>Nenhuma semana configurada.</p>
          )}
        </div>
      </div>

      {/* Abonadas */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Semanas Abonadas
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>Semanas que possuem justificativa (feriados, eventos, etc.)</p>
          </div>
          <button
            onClick={addAbonada}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: '1px solid #ddd', borderRadius: 6,
              padding: '5px 12px', fontSize: 12, color: '#555', cursor: 'pointer',
            }}
          >
            <Plus size={13} /> Adicionar
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(abonadas).map(([aba, motivo]) => (
            <div key={aba} style={{ display: 'grid', gridTemplateColumns: '1fr 3fr auto', gap: 10, alignItems: 'flex-end' }}>
              <div>
                <label style={labelStyle}>Aba</label>
                <input
                  style={inputStyle}
                  value={aba}
                  onChange={e => updateAbonadaAba(aba, e.target.value)}
                  placeholder="01.06"
                />
              </div>
              <div>
                <label style={labelStyle}>Motivo</label>
                <input
                  style={inputStyle}
                  value={motivo}
                  onChange={e => updateAbonadaMotivo(aba, e.target.value)}
                  placeholder="Ex: Feriado - Corpus Christi (04/06/2026)"
                />
              </div>
              <button
                onClick={() => removeAbonada(aba)}
                style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 6, padding: '7px 9px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {Object.keys(abonadas).length === 0 && (
            <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, padding: '20px 0' }}>Nenhuma semana abonada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
