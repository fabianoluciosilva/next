'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TelaTecnicoFull() {
  const [usuario, setUsuario] = useState<any>(null)
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [local, setLocal] = useState('')
  const [statusDia, setStatusDia] = useState('Trabalhado')
  const [vaga, setVaga] = useState('LG') // Rateio da planilha
  
  // Gastos detalhados como na planilha
  const [gastos, setGastos] = useState({
    onibus: '',
    carro: '',
    taxi: '',
    outros: ''
  })

  useEffect(() => {
    const user = localStorage.getItem('usuario')
    if (user) setUsuario(JSON.parse(user))
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    const totalCentavos = Object.values(gastos).reduce((acc, val) => 
      acc + (Math.round(parseFloat(val || '0') * 100)), 0
    )

    const { error } = await supabase.from('deslocamentos').insert({
      funcionario_id: usuario.id,
      data,
      local_destino: local,
      status_dia: statusDia,
      tipo_vaga: vaga,
      gasto_onibus: Math.round(parseFloat(gastos.onibus || '0') * 100),
      gasto_carro: Math.round(parseFloat(gastos.carro || '0') * 100),
      gasto_taxi_app: Math.round(parseFloat(gastos.taxi || '0') * 100),
      gasto_outros: Math.round(parseFloat(gastos.outros || '0') * 100),
      valor_centavos: totalCentavos
    })

    if (!error) alert('Lançamento realizado!');
  }

  if (!usuario) return null

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-2xl mx-auto glass rounded-[2.5rem] p-8">
        <header className="flex justify-between items-center mb-8">
          <img src="/logo-pll.png" className="h-10" alt="PLL Next" />
          <div className="text-right">
            <p className="text-xs font-black uppercase text-blue-500">{usuario.nome}</p>
            <p className="text-[10px] text-slate-500">SISTEMA DE DESLOCAMENTOS</p>
          </div>
        </header>

        <form onSubmit={salvar} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400">Data</label>
              <input type="date" className="w-full bg-slate-900 border-none rounded-2xl p-4 mt-1" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400">Status do Dia</label>
              <select className="w-full bg-slate-900 border-none rounded-2xl p-4 mt-1" value={statusDia} onChange={e => setStatusDia(e.target.value)}>
                <option>Trabalhado</option>
                <option>Falta Justificada</option>
                <option>Feriado</option>
                <option>Folga</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400">Local / Cliente</label>
            <input className="w-full bg-slate-900 border-none rounded-2xl p-4 mt-1" placeholder="Ex: Casa & Video" value={local} onChange={e => setLocal(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400">Ônibus (R$)</label>
              <input type="number" step="0.01" className="w-full bg-slate-900 border-none rounded-2xl p-4 mt-1" value={gastos.onibus} onChange={e => setGastos({...gastos, onibus: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400">Carro / Uber (R$)</label>
              <input type="number" step="0.01" className="w-full bg-slate-900 border-none rounded-2xl p-4 mt-1" value={gastos.carro} onChange={e => setGastos({...gastos, carro: e.target.value})} />
            </div>
          </div>

          <button className="w-full bg-blue-600 p-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">
            Confirmar Lançamento
          </button>
        </form>
      </div>
    </div>
  )
}
