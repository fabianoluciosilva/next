'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TelaTecnicoPll() {
  const [usuario, setUsuario] = useState<any>(null)
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [local, setLocal] = useState('')
  const [vaga, setVaga] = useState('LG')
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [carregando, setCarregando] = useState(false)
  
  // Gastos baseados na sua planilha "BD"
  const [gastos, setGastos] = useState({
    onibus: '',
    carro: '',
    outros: ''
  })

  useEffect(() => {
    const user = localStorage.getItem('usuario')
    if (user) setUsuario(JSON.parse(user))
  }, [])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)

    try {
      let comprovanteUrl = ''
      if (comprovante) {
        const fileExt = comprovante.name.split('.').pop()
        const filePath = `comprovantes/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('comprovantes').upload(filePath, comprovante)
        if (!uploadError) comprovanteUrl = filePath
      }

      const totalCentavos = Object.values(gastos).reduce((acc, val) => acc + (Math.round(parseFloat(val || '0') * 100)), 0)

      const { error } = await supabase.from('deslocamentos').insert({
        funcionario_id: usuario.id,
        data,
        local_destino: local,
        tipo_vaga: vaga,
        gasto_onibus: Math.round(parseFloat(gastos.onibus || '0') * 100),
        gasto_carro: Math.round(parseFloat(gastos.carro || '0') * 100),
        gasto_outros: Math.round(parseFloat(gastos.outros || '0') * 100),
        valor_centavos: totalCentavos,
        comprovante_url: comprovanteUrl
      })

      if (error) throw error
      alert('Lançamento realizado com sucesso!')
      setLocal(''); setGastos({ onibus: '', carro: '', outros: '' }); setComprovante(null)
    } catch (err) {
      alert('Erro ao salvar lançamento.')
    } finally {
      setCarregando(false)
    }
  }

  if (!usuario) return null

  return (
    <div className="min-h-screen bg-slate-100 p-4 flex items-center justify-center transition-all">
      <title>PLL Next - Lançamento</title>
      
      <div className="w-full max-w-xl bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
        <div className="text-center mb-8">
          {/* Logo PLL - Agora visível em fundo claro */}
          <img src="/logo-pll.png" alt="PLL Next" className="w-28 mx-auto mb-4" />
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Olá, {usuario.nome}</h2>
          <p className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em]">Registro de Deslocamento</p>
        </div>

        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Data</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Vaga (Rateio)</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" value={vaga} onChange={e => setVaga(e.target.value)}>
                <option value="LG">LG</option>
                <option value="TIM">TIM</option>
                <option value="ACER">ACER</option>
                <option value="SONY">SONY</option>
                <option value="POSITIVO">POSITIVO</option>
                <option value="OUTROS">OUTROS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Local / Cliente</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Casa & Vídeo" value={local} onChange={e => setLocal(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Ônibus</label>
              <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800" placeholder="0,00" value={gastos.onibus} onChange={e => setGastos({...gastos, onibus: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Carro/Uber</label>
              <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800" placeholder="0,00" value={gastos.carro} onChange={e => setGastos({...gastos, carro: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Outros</label>
              <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800" placeholder="0,00" value={gastos.outros} onChange={e => setGastos({...gastos, outros: e.target.value})} />
            </div>
          </div>

          {/* Campo de Comprovante Restaurado */}
          <div className="pt-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Anexar Comprovante</label>
            <input 
              type="file" 
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={e => setComprovante(e.target.files?.[0] || null)}
            />
          </div>

          <button 
            disabled={carregando}
            className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all mt-4"
          >
            {carregando ? 'Gravando...' : 'Confirmar Lançamento'}
          </button>
        </form>
      </div>
    </div>
  )
}
