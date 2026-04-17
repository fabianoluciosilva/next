'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminPllMaster() {
  const router = useRouter()
  const [abaAtiva, setAbaAtiva] = useState<'auditoria' | 'financeiro' | 'equipe'>('auditoria')
  const [mesFiltro, setMesFiltro] = useState(() => new Date().toISOString().slice(0, 7))
  const [funcionarioFiltro, setFuncionarioFiltro] = useState('todos')
  
  // Dados
  const [viagens, setViagens] = useState<any[]>([])
  const [extratoDepositos, setExtratoDepositos] = useState<any[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [metricas, setMetricas] = useState({ depositos: 0, gastos: 0 })
  const [carregando, setCarregando] = useState(false)

  // Estados de Formulário
  const [novoFunc, setNovoFunc] = useState({ nome: '', email: '', senha: '', is_admin: false })
  const [deposito, setDeposito] = useState({ funcionario_id: '', valor: '' })

  const VERSAO_SISTEMA = "v2.2.0"

  const carregarTudo = useCallback(async () => {
    setCarregando(true)
    const dataInicio = `${mesFiltro}-01`
    const dataFim = new Date(Number(mesFiltro.split('-')[0]), Number(mesFiltro.split('-')[1]), 0).toISOString().slice(0, 10)

    // 1. Buscar Funcionários
    const { data: fData } = await supabase.from('funcionarios').select('*').order('nome')
    setFuncionarios(fData || [])

    // 2. Buscar Gastos (Auditoria)
    let qG = supabase.from('deslocamentos').select('*, funcionarios(nome)').gte('data', dataInicio).lte('data', dataFim)
    if (funcionarioFiltro !== 'todos') qG = qG.eq('funcionario_id', funcionarioFiltro)
    const { data: dGastos } = await qG.order('data', { ascending: false })

    // 3. Buscar Depósitos (Extrato)
    let qD = supabase.from('depositos').select('*, funcionarios(nome)').gte('data', dataInicio).lte('data', dataFim)
    if (funcionarioFiltro !== 'todos') qD = qD.eq('funcionario_id', funcionarioFiltro)
    const { data: dCreditos } = await qD.order('data', { ascending: false })

    const totalG = (dGastos || []).reduce((acc, c) => acc + c.valor_centavos, 0)
    const totalD = (dCreditos || []).reduce((acc, c) => acc + c.valor_centavos, 0)

    setViagens(dGastos || [])
    setExtratoDepositos(dCreditos || [])
    setMetricas({ depositos: totalD, gastos: totalG })
    setCarregando(false)
  }, [mesFiltro, funcionarioFiltro])

  useEffect(() => { carregarTudo() }, [carregarTudo])

  const formatarMoeda = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100)

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER E NAVEGAÇÃO */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <img src="/logo-pll.png" alt="PLL" className="h-10" />
          
          <nav className="flex bg-slate-100 p-1.5 rounded-2xl">
            {[
              { id: 'auditoria', label: 'Auditoria' },
              { id: 'financeiro', label: 'Financeiro' },
              { id: 'equipe', label: 'Equipe' }
            ].map((aba) => (
              <button 
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id as any)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${abaAtiva === aba.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {aba.label}
              </button>
            ))}
          </nav>

          <div className="flex gap-2">
            <input type="month" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-black text-blue-600 outline-none" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} />
            <button onClick={() => { localStorage.clear(); router.push('/') }} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Sair</button>
          </div>
        </div>

        {/* DASHBOARD DE SALDO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Créditos Lançados</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{formatarMoeda(metricas.depositos)}</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gastos Reportados</p>
            <p className="text-3xl font-black text-red-600 mt-2">{formatarMoeda(metricas.gastos)}</p>
          </div>
          <div className={`p-8 rounded-[2.5rem] shadow-xl ${metricas.depositos - metricas.gastos >= 0 ? 'bg-slate-900' : 'bg-red-900'}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo em Conta</p>
            <p className="text-3xl font-black text-white mt-2">{formatarMoeda(metricas.depositos - metricas.gastos)}</p>
          </div>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        
        {abaAtiva === 'auditoria' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-500">Relatório de Viagens</h3>
              <select className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-[10px] font-black uppercase outline-none" value={funcionarioFiltro} onChange={e => setFuncionarioFiltro(e.target.value)}>
                <option value="todos">Todos os Funcionários</option>
                {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase">
                <tr><th className="px-6 py-4">Data</th><th className="px-6 py-4">Nome</th><th className="px-6 py-4">Local</th><th className="px-6 py-4 text-right">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viagens.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-[11px] font-bold">{new Date(v.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td className="px-6 py-4 text-[11px] font-black uppercase text-slate-800">{v.funcionarios?.nome}</td>
                    <td className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase italic">{v.local_destino}</td>
                    <td className="px-6 py-4 text-[11px] font-black text-right">R$ {(v.valor_centavos/100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {abaAtiva === 'financeiro' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 h-fit">
              <h3 className="text-xs font-black uppercase text-slate-800 mb-6">Informar Novo Depósito</h3>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const { error } = await supabase.from('depositos').insert({
                  funcionario_id: deposito.funcionario_id,
                  valor_centavos: Math.round(Number(deposito.valor) * 100),
                  data: new Date().toISOString().slice(0, 10)
                })
                if (!error) { alert('Depósito ok!'); setDeposito({ funcionario_id: '', valor: '' }); carregarTudo(); }
              }} className="space-y-4">
                <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold" value={deposito.funcionario_id} onChange={e => setDeposito({...deposito, funcionario_id: e.target.value})}>
                  <option value="">Selecione o Técnico</option>
                  {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
                <input type="number" step="0.01" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black" placeholder="Valor R$" value={deposito.valor} onChange={e => setDeposito({...deposito, valor: e.target.value})} />
                <button className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Confirmar Crédito</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
              <div className="p-6 bg-slate-50/50 border-b border-slate-100"><h3 className="text-xs font-black uppercase text-slate-500">Extrato de Depósitos Efetuados</h3></div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase">
                  <tr><th className="px-6 py-4">Data</th><th className="px-6 py-4">Destinatário</th><th className="px-6 py-4 text-right">Valor</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {extratoDepositos.map(d => (
                    <tr key={d.id} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-6 py-4 text-[11px] font-bold">{new Date(d.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                      <td className="px-6 py-4 text-[11px] font-black uppercase">{d.funcionarios?.nome}</td>
                      <td className="px-6 py-4 text-[11px] font-black text-right text-green-600">{formatarMoeda(d.valor_centavos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {abaAtiva === 'equipe' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
              <h3 className="text-xs font-black uppercase text-slate-800 mb-6">Cadastrar Colaborador</h3>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const { error } = await supabase.from('funcionarios').insert([novoFunc])
                if (!error) { alert('Cadastrado!'); setNovoFunc({ nome: '', email: '', senha: '', is_admin: false }); carregarTudo(); }
              }} className="space-y-4">
                <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" placeholder="Nome" value={novoFunc.nome} onChange={e => setNovoFunc({...novoFunc, nome: e.target.value})} />
                <input required type="email" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" placeholder="E-mail" value={novoFunc.email} onChange={e => setNovoFunc({...novoFunc, email: e.target.value})} />
                <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" placeholder="Senha" value={novoFunc.senha} onChange={e => setNovoFunc({...novoFunc, senha: e.target.value})} />
                <div className="flex items-center gap-2"><input type="checkbox" checked={novoFunc.is_admin} onChange={e => setNovoFunc({...novoFunc, is_admin: e.target.checked})} /><label className="text-[10px] font-black uppercase text-slate-400">Administrador</label></div>
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Salvar Cadastro</button>
              </form>
            </div>
            
            <div className="space-y-4">
              {funcionarios.map(f => (
                <div key={f.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex justify-between items-center hover:border-blue-300 transition-all">
                  <div><p className="text-xs font-black uppercase text-slate-800">{f.nome}</p><p className="text-[10px] font-bold text-slate-400">{f.email}</p></div>
                  <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${f.is_admin ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{f.is_admin ? 'Admin' : 'Técnico'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="text-center py-6">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">PLL NEXT — {VERSAO_SISTEMA}</p>
        </div>
      </div>
    </div>
  )
}
