'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LancamentoTecnico() {
  const [local, setLocal] = useState('')
  const [valor, setValor] = useState('')
  const [status, setStatus] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!local || !valor) return

    setCarregando(true)
    setStatus('')

    // Converte R$ 58,80 para 5880 centavos para evitar erros matemáticos do JavaScript
    const valorCentavos = Math.round(parseFloat(valor.replace(',', '.')) * 100)
    
    const { error } = await supabase.from('deslocamentos').insert({
      local_destino: local.trim(),
      valor_centavos: valorCentavos,
      data: new Date().toISOString().slice(0, 10)
    })

    if (!error) { 
      setStatus('Sucesso! Lançamento registrado.')
      setLocal(''); setValor('')
      setTimeout(() => setStatus(''), 3000)
    } else {
      setStatus('Erro ao salvar. Verifique a tabela no Supabase.')
    }
    setCarregando(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h1 className="text-xl font-black text-gray-800 uppercase mb-6">Novo Deslocamento</h1>
        <form onSubmit={salvar} className="space-y-4">
          <input required className="w-full border rounded-xl px-4 py-3 bg-gray-50" placeholder="Local (Ex: Lojas Americanas)" value={local} onChange={e => setLocal(e.target.value)} />
          <input required type="number" step="0.01" className="w-full border rounded-xl px-4 py-3 bg-gray-50" placeholder="Valor do Dia (R$)" value={valor} onChange={e => setValor(e.target.value)} />
          <button disabled={carregando} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase hover:bg-blue-700 disabled:opacity-50 transition">
            {carregando ? 'Gravando...' : 'Salvar'}
          </button>
          {status && <div className="p-3 rounded-xl text-xs font-bold text-center bg-blue-50 text-blue-600">{status}</div>}
        </form>
      </div>
    </div>
  )
}
