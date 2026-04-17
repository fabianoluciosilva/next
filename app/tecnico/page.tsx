'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function TelaTecnicoPll() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().slice(0, 10))
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  
  // Estados do Formulário conforme sua planilha "BD"
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    local: '',
    vaga: 'LG',
    onibus: '',
    carro: '',
    aviao: '',
    taxi: '',
    hospedagem: '',
    outros: ''
  })
  const [comprovantes, setComprovantes] = useState<File[]>([])

  useEffect(() => {
    const user = localStorage.getItem('usuario')
    if (user) {
      const parsedUser = JSON.parse(user)
      setUsuario(parsedUser)
      buscarLancamentos(parsedUser.id, dataFiltro)
    } else {
      router.push('/')
    }
  }, [dataFiltro])

  function logout() {
    localStorage.removeItem('usuario')
    document.cookie = "luan_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    router.push('/')
  }

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
      let urls: string[] = []
      
      // Upload de Múltiplos Comprovantes
      for (const file of comprovantes) {
        const filePath = `comprovantes/${Date.now()}_${file.name}`
        const { error: upError } = await supabase.storage.from('comprovantes').upload(filePath, file)
        if (!upError) urls.push(filePath)
      }

      const totalCentavos = (
        Number(form.onibus) + Number(form.carro) + Number(form.aviao) + 
        Number(form.taxi) + Number(form.hospedagem) + Number(form.outros)
      ) * 100

      const { error } = await supabase.from('deslocamentos').insert({
        funcionario_id: usuario.id,
        data: form.data,
        local_destino: form.local,
        tipo_vaga: form.vaga,
        gasto_onibus: Number(form.onibus) * 100,
        gasto_carro: Number(form.carro) * 100,
        gasto_aviao: Number(form.aviao) * 100,
        gasto_taxi: Number(form.taxi) * 100,
        gasto_hospedagem: Number(form.hospedagem) * 100,
        gasto_outros: Number(form.outros) * 100,
        valor_centavos: totalCentavos,
        comprovante_urls: urls // Agora enviando array de URLs
      })

      if (error) throw error
      alert('Lançamento realizado com sucesso!')
      setForm({ ...form, local: '', onibus: '', carro: '', aviao: '', taxi: '', hospedagem: '', outros: '' })
      setComprovantes([])
      buscarLancamentos(usuario.id, form.data)
    } catch (err) {
      alert('Erro ao salvar lançamento.')
    } finally {
      setCarregando(false)
    }
  }

  if (!usuario) return null

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* HEADER COM BOTÃO SAIR */}
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <img src="/logo-pll.png" alt="PLL" className="h-8" />
          <button onClick={logout} className="text-[10px] font-black uppercase bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">
            Sair do Sistema
          </button>
        </div>

        {/* CARD DE CADASTRO COMPLETO */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-xl font-black uppercase text-slate-800 tracking-tighter">Olá, {usuario.nome}</h2>
            <p className="text-blue-600 text-[10px] font-bold uppercase tracking-widest">Novo Lançamento Detalhado</p>
          </div>

          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="date" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm" value={form.data} onChange={e => setForm({...form, data: e.target.value})} />
              <select className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" value={form.vaga} onChange={e => setForm({...form, vaga: e.target.value})}>
                <option>LG</option><option>TIM</option><option>ACER</option><option>SONY</option><option>POSITIVO</option><option>OUTROS</option>
              </select>
            </div>

            <input required placeholder="Local / Cliente" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm" value={form.local} onChange={e => setForm({...form, local: e.target.value})} />

            {/* GRID DE GASTOS COMPLETO */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Ônibus</label>
                <input type="number" step="0.01" placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-center" value={form.onibus} onChange={e => setForm({...form, onibus: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Carro/Uber</label>
                <input type="number" step="0.01" placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-center" value={form.carro} onChange={e => setForm({...form, carro: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Avião</label>
                <input type="number" step="0.01" placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-center" value={form.aviao} onChange={e => setForm({...form, aviao: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Táxi</label>
                <input type="number" step="0.01" placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-center" value={form.taxi} onChange={e => setForm({...form, taxi: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Hospedagem</label>
                <input type="number" step="0.01" placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-center" value={form.hospedagem} onChange={e => setForm({...form, hospedagem: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Outros</label>
                <input type="number" step="0.01" placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-center" value={form.outros} onChange={e => setForm({...form, outros: e.target.value})} />
              </div>
            </div>

            {/* SELEÇÃO DE MÚLTIPLOS COMPROVANTES */}
            <div className="flex flex-col items-center p-6 border-2 border-dashed border-slate-200 rounded-3xl hover:border-blue-400 transition-colors bg-slate-50 relative">
              <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={e => setComprovantes(Array.from(e.target.files || []))} />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-slate-500">
                  {comprovantes.length > 0 ? `${comprovantes.length} arquivos selecionados` : 'Clique para anexar comprovantes (Vários)'}
                </p>
                {comprovantes.length > 0 && (
                   <div className="mt-2 flex flex-wrap gap-1 justify-center">
                     {comprovantes.map((f, i) => <span key={i} className="text-[8px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{f.name}</span>)}
                   </div>
                )}
              </div>
            </div>

            <button disabled={carregando} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-slate-200 transition-all">
              {carregando ? 'Gravando...' : 'Confirmar Lançamento'}
            </button>
          </form>
        </div>

        {/* LISTA DE HOJE */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Seus Lançamentos</h3>
            <input type="date" className="text-xs font-bold bg-transparent border-none outline-none text-blue-600" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} />
          </div>
          {/* ... mesma lógica de listagem anterior ... */}
        </div>
      </div>
    </div>
  )
}
