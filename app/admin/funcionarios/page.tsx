'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function GestaoFuncionarios() {
  const router = useRouter()
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  
  // Estados para Novo Funcionário
  const [novoFunc, setNovoFunc] = useState({ nome: '', email: '', senha: '', is_admin: false })
  
  // Estados para Depósito
  const [deposito, setDeposito] = useState({ funcionario_id: '', valor: '' })

  const VERSAO_SISTEMA = "v2.1.0"

  useEffect(() => {
    carregarFuncionarios()
  }, [])

  async function carregarFuncionarios() {
    const { data } = await supabase.from('funcionarios').select('*').order('nome', { ascending: true })
    setFuncionarios(data || [])
  }

  async function handleCadastrarFuncionario(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    const { error } = await supabase.from('funcionarios').insert([novoFunc])
    
    if (!error) {
      alert('Funcionário cadastrado!')
      setNovoFunc({ nome: '', email: '', senha: '', is_admin: false })
      carregarFuncionarios()
    } else {
      alert('Erro: ' + error.message)
    }
    setCarregando(false)
  }

  async function handleLancarDeposito(e: React.FormEvent) {
    e.preventDefault()
    if (!deposito.funcionario_id || !deposito.valor) return
    setCarregando(true)

    const { error } = await supabase.from('depositos').insert({
      funcionario_id: deposito.funcionario_id,
      valor_centavos: Math.round(Number(deposito.valor) * 100),
      data: new Date().toISOString().slice(0, 10),
      descricao: 'Depósito via Painel Administrativo'
    })

    if (!error) {
      alert('Depósito realizado com sucesso!')
      setDeposito({ funcionario_id: '', valor: '' })
    } else {
      alert('Erro ao lançar depósito.')
    }
    setCarregando(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <img src="/logo-pll.png" alt="PLL" className="h-8" />
            <h1 className="text-sm font-black uppercase tracking-tighter text-slate-800">Recursos Humanos & Créditos</h1>
          </div>
          <button onClick={() => router.push('/admin')} className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-5 py-2 rounded-xl hover:bg-slate-900 hover:text-white transition-all">Voltar ao Dashboard</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* FORMULÁRIO DE CADASTRO */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h3 className="text-xs font-black uppercase text-slate-800 mb-6">Novo Funcionário</h3>
            <form onSubmit={handleCadastrarFuncionario} className="space-y-4">
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" placeholder="Nome Completo" value={novoFunc.nome} onChange={e => setNovoFunc({...novoFunc, nome: e.target.value})} />
              <input required type="email" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" placeholder="E-mail Corporativo" value={novoFunc.email} onChange={e => setNovoFunc({...novoFunc, email: e.target.value})} />
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" placeholder="Senha de Acesso" value={novoFunc.senha} onChange={e => setNovoFunc({...novoFunc, senha: e.target.value})} />
              <div className="flex items-center gap-2 ml-2">
                <input type="checkbox" id="admin" checked={novoFunc.is_admin} onChange={e => setNovoFunc({...novoFunc, is_admin: e.target.checked})} />
                <label htmlFor="admin" className="text-[10px] font-black uppercase text-slate-400">Acesso Administrativo</label>
              </div>
              <button disabled={carregando} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all">Salvar Cadastro</button>
            </form>
          </div>

          {/* LANÇAMENTO DE DEPÓSITO */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h3 className="text-xs font-black uppercase text-slate-800 mb-6">Lançar Crédito (VT/Outros)</h3>
            <form onSubmit={handleLancarDeposito} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Selecionar Funcionário</label>
                <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none" value={deposito.funcionario_id} onChange={e => setDeposito({...deposito, funcionario_id: e.target.value})}>
                  <option value="">Escolha um nome...</option>
                  {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Valor do Depósito (R$)</label>
                <input type="number" step="0.01" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-lg font-black outline-none" placeholder="0,00" value={deposito.valor} onChange={e => setDeposito({...deposito, valor: e.target.value})} />
              </div>
              <button disabled={carregando} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100">Confirmar Crédito</button>
            </form>
          </div>

        </div>

        {/* LISTA DE FUNCIONÁRIOS ATIVOS */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 bg-slate-50/50 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase text-slate-500">Funcionários Cadastrados</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {funcionarios.map(f => (
              <div key={f.id} className="p-4 border border-slate-100 rounded-2xl flex flex-col justify-between hover:border-blue-200 transition-all">
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{f.nome}</p>
                  <p className="text-[10px] font-bold text-slate-400 lowercase">{f.email}</p>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${f.is_admin ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                    {f.is_admin ? 'Administrador' : 'Técnico'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center py-6">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">PLL NEXT — {VERSAO_SISTEMA}</p>
        </div>
      </div>
    </div>
  )
}
