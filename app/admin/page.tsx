'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminPll() {
  const router = useRouter()
  
  // Estados de Filtro
  const [mesFiltro, setMesFiltro] = useState(() => new Date().toISOString().slice(0, 7))
  const [funcionarioId, setFuncionarioId] = useState('todos')
  
  // Estados de Dados
  const [viagens, setViagens] = useState<any[]>([])
  const [listaFuncionarios, setListaFuncionarios] = useState<any[]>([])
  const [metricas, setMetricas] = useState({ depositos: 0, gastos: 0 })
  const [carregando, setCarregando] = useState(false)

  const VERSAO_SISTEMA = "v2.1.2"

  // Função para carregar os dados (Memoizada para evitar loops)
  const carregarDados = useCallback(async () => {
    setCarregando(true)
    
    // 1. Definir intervalo de datas para o mês selecionado
    const dataInicio = `${mesFiltro}-01`
    const dataFim = new Date(Number(mesFiltro.split('-')[0]), Number(mesFiltro.split('-')[1]), 0).toISOString().slice(0, 10)

    // 2. Query de Gastos (Deslocamentos)
    let queryGastos = supabase
      .from('deslocamentos')
      .select('*, funcionarios(nome, email)')
      .gte('data', dataInicio)
      .lte('data', dataFim)

    if (funcionarioId !== 'todos') {
      queryGastos = queryGastos.eq('funcionario_id', funcionarioId)
    }

    const { data: dGastos, error: errG } = await queryGastos.order('data', { ascending: false })

    // 3. Query de Depósitos
    let queryCreditos = supabase
      .from('depositos')
      .select('valor_centavos')
      .gte('data', dataInicio)
      .lte('data', dataFim)

    if (funcionarioId !== 'todos') {
      queryCreditos = queryCreditos.eq('funcionario_id', funcionarioId)
    }

    const { data: dCreditos, error: errC } = await queryCreditos

    if (!errG && !errC) {
      const totalGastos = (dGastos || []).reduce((acc, curr) => acc + curr.valor_centavos, 0)
      const totalCreditos = (dCreditos || []).reduce((acc, curr) => acc + curr.valor_centavos, 0)

      setViagens(dGastos || [])
      setMetricas({ depositos: totalCreditos, gastos: totalGastos })
    }
    
    setCarregando(false)
  }, [mesFiltro, funcionarioId])

  // Carregar lista de funcionários para o Select
  useEffect(() => {
    async function init() {
      const { data } = await supabase.from('funcionarios').select('id, nome').order('nome')
      setListaFuncionarios(data || [])
    }
    init()
  }, [])

  // Disparar busca sempre que um filtro mudar
  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const formatarMoeda = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100)

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER COM FILTROS */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <img src="/logo-pll.png" alt="PLL" className="h-8" />
              <h1 className="text-sm font-black uppercase tracking-tighter text-slate-800 hidden sm:block">Filtros de Auditoria</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Filtro de Funcionário */}
              <select 
                className="flex-1 md:flex-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                value={funcionarioId}
                onChange={e => setFuncionarioId(e.target.value)}
              >
                <option value="todos">Todos os Técnicos</option>
                {listaFuncionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>

              {/* Filtro de Mês */}
              <input 
                type="month" 
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase text-blue-600 outline-none"
                value={mesFiltro}
                onChange={e => setMesFiltro(e.target.value)}
              />

              <button onClick={() => carregarDados()} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                🔄
              </button>
            </div>
          </div>
        </div>

        {/* DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Depósitos no Período</p>
            <p className="text-3xl font-black text-slate-900">{carregando ? '...' : formatarMoeda(metricas.depositos)}</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gastos no Período</p>
            <p className="text-3xl font-black text-red-600">{carregando ? '...' : formatarMoeda(metricas.gastos)}</p>
          </div>
          <div className={`p-8 rounded-[2.5rem] shadow-xl transition-colors ${metricas.depositos - metricas.gastos >= 0 ? 'bg-slate-900' : 'bg-red-900'}`}>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Saldo Remanescente</p>
            <p className="text-3xl font-black text-white">{carregando ? '...' : formatarMoeda(metricas.depositos - metricas.gastos)}</p>
          </div>
        </div>

        {/* TABELA DE RESULTADOS */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5">Data</th>
                  <th className="px-6 py-5">Colaborador</th>
                  <th className="px-6 py-5">Destino</th>
                  <th className="px-6 py-5 text-right">Valor</th>
                  <th className="px-6 py-5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viagens.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-[11px] font-bold text-slate-500">
                      {new Date(v.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-black text-slate-900 uppercase">{v.funcionarios?.nome}</p>
                      <p className="text-[9px] text-slate-400">{v.funcionarios?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase italic">
                      {v.local_destino}
                    </td>
                    <td className="px-6 py-4 text-[12px] font-black text-slate-900 text-right">
                      {formatarMoeda(v.valor_centavos)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {v.comprovante_urls && (
                        <a 
                          href={v.comprovante_urls[0]} 
                          target="_blank" 
                          className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest"
                        >
                          Recibo
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {viagens.length === 0 && !carregando && (
              <div className="p-20 text-center">
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">Nenhum registro para este filtro</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center py-4">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">PLL NEXT ADMIN — {VERSAO_SISTEMA}</p>
        </div>
      </div>
    </div>
  )
}
