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
  
  const VERSAO_SISTEMA = "v2.1.0"

  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    local: '',
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
  }, [dataFiltro, router])

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
      for (const file of comprovantes) {
        const filePath = `comprovantes/${Date.now()}_${file.name}`
        const { error: upError } = await supabase.storage.from('comprovantes').upload(filePath, file)
        if (!upError) urls.push(filePath)
      }

      const totalCentavos = Math.round((
        Number(form.onibus || 0) + 
        Number(form.carro || 0) + 
        Number(form.aviao || 0) + 
        Number(form.taxi || 0) + 
        Number(form.hospedagem || 0) + 
        Number(form.outros || 0)
      ) * 100)

      const { error } = await supabase.from('deslocamentos').insert({
        funcionario_id: usuario.id,
        data: form.data,
        local_destino: form.local,
        gasto_onibus: Math.round(Number(form.onibus || 0) * 100),
        gasto_carro: Math.round(Number(form.carro || 0) * 100),
        gasto_aviao: Math.round(Number(form.aviao || 0) * 100),
        gasto_taxi: Math.round(Number(form.taxi || 0) * 100),
        gasto_hospedagem: Math.round(Number(form.hospedagem || 0) * 100),
        gasto_outros: Math.round(Number(form.outros || 0) * 100),
        valor_centavos: totalCentavos,
        comprovante_urls: urls,
        versao_app: VERSAO_SISTEMA
      })

      if (error) throw error
      alert('Lançamento realizado!')
      setForm({ ...form, local: '', onibus: '', carro: '', aviao: '', taxi: '', hospedagem: '', outros: '' })
      setComprovantes([])
      buscarLancamentos(usuario.id, form.data)
    } catch (err: any) {
      alert('Erro: ' + err.message)
    } finally {
      setCarregando(false)
    }
  }

  if (!usuario) return null

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200">
          <img src="/logo-pll.png" alt="PLL" className="h-10" />
          <button onClick={logout} className="text-[10px] font-black uppercase bg-red-50 text-red-600 px-5 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">
            Sair
          </button>
        </div>

        {/* CARD PRINCIPAL */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">Olá, {usuario.nome}</h2>
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em]">Novo Lançamento PLL Next</p>
          </div>

          <form onSubmit={handleSalvar} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2 -mb-4">Data do Gasto</label>
              <input type="date" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" value={form.data} onChange={e => setForm({...form, data: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Local / Cliente Visitado</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Casa & Vídeo - Centro" value={form.local} onChange={e => setForm({...form, local: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Ônibus', field: 'onibus' },
                { label: 'Carro/Uber', field: 'carro' },
                { label: 'Avião', field: 'aviao' },
                { label: 'Táxi', field: 'taxi' },
                { label: 'Hospedagem', field: 'hospedagem' },
                { label: 'Outros', field: 'outros' }
              ].map((item) => (
                <div key={item.field} className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">{item.label}</label>
                  <input type="number" step="0.01" placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-center font-black" 
                    value={form[item.field as keyof typeof form]} 
                    onChange={e => setForm({...form, [item.field]: e.target.value})} />
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center p-6 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-blue-400 transition-colors bg-slate-50 relative">
              <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={e => setComprovantes(Array.from(e.target.files || []))} />
              <p className="text-[10px] font-black uppercase text-slate-500 text-center">
                {comprovantes.length > 0 ? `${comprovantes.length} arquivos selecionados` : 'Anexar Comprovantes (Vários)'}
              </p>
            </div>

            <button disabled={carregando} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black shadow-xl transition-all active:scale-95">
              {carregando ? 'Gravando...' : 'Confirmar Lançamento'}
            </button>
          </form>
        </div>

        {/* LISTAGEM */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Seus Registros</h3>
            <input type="date" className="text-xs font-black text-blue-600 bg-transparent outline-none" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} />
          </div>
          <div className="divide-y divide-slate-100">
            {lancamentos.length === 0 ? (
              <p className="p-10 text-center text-xs font-bold text-slate-400 uppercase">Sem lançamentos nesta data</p>
            ) : (
              lancamentos.map((item) => (
                <div key={item.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">{item.local_destino}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">PLL Next System</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">R$ {(item.valor_centavos / 100).toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="text-center p-10">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
          PLL NEXT — {VERSAO_SISTEMA}
        </p>
      </div>
    </div>
  )
}
