'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TelaTecnico() {
  const [usuario, setUsuario] = useState<any>(null)
  const [local, setLocal] = useState('')
  const [valor, setValor] = useState('')
  const [transporte, setTransporte] = useState('Uber')
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [status, setStatus] = useState({ tipo: '', msg: '' })

  useEffect(() => {
    const user = localStorage.getItem('usuario')
    if (user) setUsuario(JSON.parse(user))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!local || !valor) return
    setCarregando(true)
    setStatus({ tipo: '', msg: '' })

    try {
      let comprovanteUrl = ''

      // 1. Upload do Comprovante (se houver)
      if (comprovante) {
        const fileExt = comprovante.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `tecnicos/${usuario.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('comprovantes')
          .upload(filePath, comprovante)

        if (uploadError) throw uploadError
        comprovanteUrl = filePath
      }

      // 2. Salvar no Banco
      const valorCentavos = Math.round(parseFloat(valor.replace(',', '.')) * 100)
      
      const { error } = await supabase.from('deslocamentos').insert({
        funcionario_id: usuario.id,
        local_destino: local.trim(),
        valor_centavos: valorCentavos,
        tipo_transporte: transporte,
        comprovante_url: comprovanteUrl,
        data: new Date().toISOString().slice(0, 10)
      })

      if (error) throw error

      setStatus({ tipo: 'sucesso', msg: 'Deslocamento enviado com sucesso!' })
      setLocal(''); setValor(''); setComprovante(null)
    } catch (err: any) {
      setStatus({ tipo: 'erro', msg: 'Erro ao salvar: ' + err.message })
    } finally {
      setCarregando(false)
    }
  }

  if (!usuario) return null

  return (
    <div className="min-h-screen bg-slate-950 p-4 flex items-center justify-center transition-all">
      <title>PLL Next - Lançamento</title>
      
      <div className="w-full max-w-lg glass p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
        <div className="text-center mb-8">
          <img src="/logo-pll.png" alt="PLL Next" className="w-20 mx-auto mb-4" />
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Olá, {usuario.nome}</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Novo Lançamento de Deslocamento</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Destino */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Local de Destino (Cliente)</label>
            <input 
              required className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-600 text-white"
              placeholder="Ex: Shopping Nova América"
              value={local} onChange={e => setLocal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Valor */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Valor do Dia</label>
              <input 
                type="number" step="0.01" required 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-600 text-white"
                placeholder="0,00"
                value={valor} onChange={e => setValor(e.target.value)}
              />
            </div>

            {/* Tipo de Transporte */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Transporte</label>
              <select 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-600 text-white appearance-none"
                value={transporte} onChange={e => setTransporte(e.target.value)}
              >
                <option value="Uber">Uber / 99</option>
                <option value="Carro Próprio">Carro Próprio</option>
                <option value="Ônibus/Metrô">Transporte Público</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          {/* Upload Comprovante */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Anexar Comprovante (Foto/PDF)</label>
            <div className="relative group">
              <input 
                type="file" accept="image/*,application/pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={e => setComprovante(e.target.files?.[0] || null)}
              />
              <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center group-hover:border-blue-600 transition-colors">
                <span className="text-xs font-bold text-slate-500">
                  {comprovante ? comprovante.name : 'Toque para selecionar ou tirar foto'}
                </span>
              </div>
            </div>
          </div>

          {status.msg && (
            <div className={`p-4 rounded-2xl text-center text-xs font-black uppercase tracking-widest ${status.tipo === 'sucesso' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {status.msg}
            </div>
          )}

          <button 
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {carregando ? 'Processando...' : 'Confirmar Lançamento'}
          </button>
        </form>

        <button 
          onClick={() => { document.cookie = 'luan_session=; Max-Age=0; path=/;'; window.location.href='/' }}
          className="w-full mt-6 text-[10px] font-black uppercase text-slate-600 hover:text-white transition-colors"
        >
          Sair do Sistema
        </button>
      </div>
    </div>
  )
}
