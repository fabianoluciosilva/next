'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuditoriaLuan() {
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))
  const [viagens, setViagens] = useState<any[]>([])
  const [metricas, setMetricas] = useState({ depositos: 0, gastos: 0 })
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true)
      const dataInicio = `${mes}-01`
      const dataFim = new Date(Number(mes.split('-')[0]), Number(mes.split('-')[1]), 0).toISOString().slice(0, 10)

      const { data: dGastos } = await supabase.from('deslocamentos').select('*').gte('data', dataInicio).lte('data', dataFim).order('data', { ascending: false })
      const { data: dCreditos } = await supabase.from('depositos').select('valor_centavos').gte('data', dataInicio).lte('data', dataFim)

      const totalGastos = (dGastos || []).reduce((acc, curr) => acc + curr.valor_centavos, 0)
      const totalCreditos = (dCreditos || []).reduce((acc, curr) => acc + curr.valor_centavos, 0)

      setMetricas({ depositos: totalCreditos, gastos: totalGastos })
      setViagens(dGastos || [])
      setCarregando(false)
    }
    carregarDados()
  }, [mes])

  const reais = (v: number) => (v / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
          <h1 className="text-xl font-black text-gray-800 uppercase">Auditoria Mobilidade</h1>
          <input type="month" className="border rounded-xl px-4 py-2 font-bold" value={mes} onChange={e => setMes(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase">Depósitos</p><p className="text-2xl font-black text-blue-600">{reais(metricas.depositos)}</p></div>
          <div className="bg-white p-6 rounded-3xl border shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase">Gastos</p><p className="text-2xl font-black text-red-600">{reais(metricas.gastos)}</p></div>
          <div className="bg-gray-900 p-6 rounded-3xl"><p className="text-[10px] font-black text-gray-400 uppercase">Saldo</p><p className="text-2xl font-black text-green-400">{reais(metricas.depositos - metricas.gastos)}</p></div>
        </div>

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
              <tr><th className="px-6 py-4">Data</th><th className="px-6 py-4">Local</th><th className="px-6 py-4 text-right">Valor</th></tr>
            </thead>
            <tbody className="divide-y">
              {viagens.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold">{new Date(v.data).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 font-black uppercase text-gray-800">{v.local_destino}</td>
                  <td className="px-6 py-4 font-black text-red-600 text-right">{reais(v.valor_centavos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
