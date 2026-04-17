'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TelaTecnicoPll() {
  const [usuario, setUsuario] = useState<any>(null)
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().slice(0, 10))
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  
  // Estados do Formulário
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    local: '',
    vaga: 'LG',
    onibus: '',
    carro: '',
    outros: ''
  })
  const [comprovante, setComprovante] = useState<File | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('usuario')
    if (user) {
      const parsedUser = JSON.parse(user)
      setUsuario(parsedUser)
      buscarLancamentos(parsedUser.id, dataFiltro)
    }
  }, [dataFiltro])

  async function buscarLancamentos(id: string, data: string) {
    const { data: res } = await supabase
      .from('deslocamentos')
      .select('*')
      .eq('funcionario_id', id)
      .eq('data', data)
      .order('created_at', { ascending: false })
    setLancamentos(res || [])
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)

    try {
      let comprovanteUrl = ''
      if (comprovante) {
        const filePath = `comprovantes/${Date.now()}_${comprovante.name}`
        const { error: upError } = await supabase.storage.from('comprovantes').upload(filePath, comprovante)
        if (!upError) comprovanteUrl = filePath
      }

      const totalCentavos = (Number(form.onibus) + Number(form.carro) + Number(form.outros)) * 100

      const { error } = await supabase.from('deslocamentos').insert({
        funcionario_id: usuario.id,
        data: form.data,
        local_destino: form.local,
        tipo_vaga: form.vaga,
        gasto_onibus: Number(form.onibus) * 100,
        gasto_carro: Number(form.carro) * 100,
        gasto_outros: Number(form.outros) * 100,
        valor_centavos: totalCentavos,
        comprovante_url: comprovanteUrl
      })

      if (error) throw error
      alert('Lançamento realizado!')
      setForm({ ...form, local: '', onibus: '', carro: '', outros: '' })
      setComprovante(null)
      buscarLancamentos(usuario.id, form.data)
    } catch (err) {
      alert('Erro ao salvar.')
    } finally {
      setCarregando(false)
    }
  }

  if (!usuario) return null

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* CARD DE CADASTRO */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="text-center mb-8">
            <img src="/logo-pll.png" alt="PLL Next" className="w-32 mx-auto mb-4" />
            <h2 className="text-xl font-black uppercase text-slate-800 tracking-tighter">Olá, {usuario.nome}</h2>
            <p className="text-blue-600 text-[10px] font-bold uppercase tracking-widest">Novo Lançamento</p>
          </div>

          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="date" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm" value={form.data} onChange={e => setForm({...form, data: e.target.value})} />
              <select className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" value={form.vaga} onChange={e => setForm({...form, vaga: e.target.value})}>
                <option>LG</option><option>TIM</option><option>ACER</option><option>SONY</option><option>POSITIVO</option><option>OUTROS</option>
              </select>
            </div>

            <input required placeholder="Local / Cliente" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm" value={form.local} onChange={e => setForm({...form, local: e.target.value})} />

            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="Ônibus" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-center" value={form.onibus} onChange={e => setForm({...form, onibus: e.target.value})} />
              <input type="number" placeholder="Carro" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-center" value={form.carro} onChange={e => setForm({...form, carro: e.target.value})} />
              <input type="number" placeholder="Outros" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-center" value={form.outros} onChange={e => setForm({...form, outros: e.target.value})} />
            </div>

            <div className="flex flex-col items-center p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-400 transition-colors bg-slate-50 relative">
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setComprovante(e.target.files?.[0] || null)} />
              <span className="text-[10px] font-black uppercase text-slate-400">
                {comprovante ? `Anexado: ${comprovante.name}` : 'Toque para anexar comprovante'}
              </span>
            </div>

            <button disabled={carregando} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all">
              {carregando ? 'Gravando...' : 'Confirmar Lançamento'}
            </button>
          </form>
        </div>

        {/* LISTA DE LANÇAMENTOS DO DIA */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Seus Lançamentos</h3>
            <input type="date" className="text-xs font-bold bg-transparent border-none outline-none text-blue-600" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} />
          </div>

          <div className="divide-y divide-slate-100">
            {lancamentos.length === 0 ? (
              <p className="p-10 text-center text-xs font-bold text-slate-400">Nenhum lançamento para este dia.</p>
            ) : (
              lancamentos.map((item) => (
                <div key={item.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-black text-slate-800">{item.local_destino}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">{item.tipo_vaga}</span>
                      {item.comprovante_url && <span className="text-[9px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase">Comprovante OK</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">R$ {(item.valor_centavos / 100).toFixed(2).replace('.', ',')}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total do dia</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
