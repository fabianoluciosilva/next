'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminPll() {
  const router = useRouter()
  const [mesFiltro, setMesFiltro] = useState(() => new Date().toISOString().slice(0, 7))
  const [viagens, setViagens] = useState<any[]>([])
  const [metricas, setMetricas] = useState({ depositos: 0, gastos: 0 })
  const [carregando, setCarregando] = useState(false)
  const [valorDeposito, setValorDeposito] = useState('')

  const VERSAO_SISTEMA = "v2.1.0"

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('usuario') || '{}')
    if (!user.is_admin) router.push('/tecnico')
    carregarDados()
  }, [mesFiltro])

  async function carregarDados() {
    setCarregando(true)
    const dataInicio = `${mesFiltro}-01`
    const dataFim = new Date(Number(mesFiltro.split('-')[0]), Number(mesFiltro.split('-')[1]), 0).toISOString().slice(0, 10)

    // Buscar Gastos
    const { data: dGastos } = await supabase
      .from('deslocamentos')
      .select('*, funcionarios(nome)')
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: false })

    // Buscar Depósitos
    const { data: dCreditos } = await supabase
      .from('depositos')
      .select('valor_centavos')
      .gte('data', dataInicio)
      .lte('data', dataFim)

    const totalGastos = (dGastos || []).reduce((acc, curr) => acc + curr.valor_centavos, 0)
    const totalCreditos = (dCreditos || []).reduce((acc, curr) => acc + curr.valor_centavos, 0)

    setViagens(dGastos || [])
    setMetricas({ depositos: totalCreditos, gastos: totalGastos })
    setCarregando(false)
  }

  async function handleAdicionarCredito(e: React.FormEvent) {
    e.preventDefault()
    if (!valorDeposito) return

    const { error } = await supabase.from('depositos').insert({
      valor_centavos: Math.round(Number(valorDeposito) * 100),
      data: new Date().toISOString().slice(0, 10),
      descricao: 'Depósito via Admin'
    })

    if (!error) {
      alert('Crédito adicionado com sucesso!')
      setValorDeposito('')
      carregarDados()
    }
  }

  const formatarMoeda = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100)

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER ADMIN */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo-pll.png" alt="PLL" className="h-8" />
            <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
            <h1 className="text-sm font-black uppercase tracking-tighter text-slate-800">Painel de Auditoria</h1>
          </div>
          <div className="flex items-center gap-3">
             <input 
              type="month" 
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase text-blue-600 outline-none"
              value={mesFiltro}
              onChange={e => setMesFiltro(e.target.value)}
            />
            <button onClick={() => { localStorage.clear(); router.push('/') }} className="text-[10px] font-black uppercase bg-red-50 text-red-600 px-5 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">Sair</button>
          </div>
        </div>

        {/* DASHBOARD DE MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Depósitos</p>
            <p className="text-3xl font-black text-slate-900">{formatarMoeda(metricas.depositos)}</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Gastos</p>
            <p className="text-3xl font-black text-red-600">{formatarMoeda(metricas.gastos)}</p>
          </div>
          <div className={`p-8 rounded-[2.5rem] shadow-xl border ${metricas.depositos - metricas.gastos >= 0 ? 'bg-slate-900 border-slate-800' : 'bg-red-900 border-red-800'}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo em Caixa</p>
            <p className="text-3xl font-black text-white">{formatarMoeda(metricas.depositos - metricas.gastos)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LANÇAR CRÉDITO */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 h-fit">
            <h3 className="text-xs font-black uppercase text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Adicionar Crédito
            </h3>
            <form onSubmit={handleAdicionarCredito} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Valor do Depósito (R$)</label>
                <input 
                  type="number" step="0.01" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                  value={valorDeposito}
                  onChange={e => setValorDeposito(e.target.value)}
                />
              </div>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all">
                Confirmar Depósito
              </button>
            </form>
          </div>

          {/* TABELA DE AUDITORIA */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-500">Relatório de Deslocamentos</h3>
              <span className="text-[10px] font-bold text-slate-400">{viagens.length} registros</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Técnico</th>
                    <th className="px-6 py-4">Local</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                    <th className="px-6 py-4 text-center">Docs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viagens.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{new Date(v.data).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 text-[11px] font-black text-slate-900 uppercase">{v.funcionarios?.nome || '---'}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">{v.local_destino}</td>
                      <td className="px-6 py-4 text-[11px] font-black text-slate-900 text-right">{formatarMoeda(v.valor_centavos)}</td>
                      <td className="px-6 py-4 text-center">
                        {v.comprovante_urls?.length > 0 && (
                          <button className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-600 hover:text-white transition-all">VER</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {viagens.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-xs font-bold text-slate-400 uppercase">Nenhum dado encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="text-center py-10">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
            PLL NEXT — ADMIN — {VERSAO_SISTEMA}
          </p>
        </div>
      </div>
    </div>
  )
}
