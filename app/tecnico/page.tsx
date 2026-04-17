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
  
  const VERSAO_SISTEMA = "v2.1.0" // Controle de versão

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
  }, [dataFiltro])

  function logout() {
    localStorage.removeItem('usuario')
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

      const totalCentavos = (
        Number(form.onibus) + Number(form.carro) + Number(form.aviao) + 
        Number(form.taxi) + Number(form.hospedagem) + Number(form.outros)
      ) * 100

      const { error } = await supabase.from('deslocamentos').insert({
        funcionario_id: usuario.id,
        data: form.data,
        local_destino: form.local,
        gasto_onibus: Number(form.onibus) * 100,
        gasto_carro: Number(form.carro) * 100,
        gasto_aviao: Number(form.aviao) * 100,
        gasto_taxi: Number(form.taxi) * 100,
        gasto_hospedagem: Number(form.hospedagem) * 100,
        gasto_outros: Number(form.outros) * 100,
        valor_centavos: totalCentcents,
        comprovante_urls: urls,
        versao_app: VERSAO_SISTEMA
      })

      if (error) throw error
      alert('Lançamento realizado!')
      setForm({ ...form, local: '', onibus: '', carro: '', aviao: '', taxi: '', hospedagem: '', outros: '' })
      setComprovantes([])
      buscarLancamentos(usuario.id, form.data)
    } catch (err) {
      alert('Erro ao salvar.')
    } finally {
      setCarregando(false)
    }
  }

  if (!usuario) return null

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col">
      <div className="max-w-2xl mx-auto w-full space-y-6 flex-grow">
        
        {/* HEADER */}
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <img src="/logo-pll.png" alt="PLL" className="h-8" />
          <button onClick={logout} className="text-[10px] font-black uppercase bg-red-50 text-red-600 px-4 py-2 rounded-xl">
            Sair
          </button>
        </div>

        {/* FORMULÁRIO */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-xl font-black uppercase text-slate-800 tracking-tighter">Olá, {usuario.nome}</h2>
            <p className="text-blue-600 text-[10px] font-bold uppercase tracking-widest">Novo Lançamento</p>
          </div>

          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2 -mb-3">Data do Gasto</label>
              <input type="date" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold" value={form.data} onChange={e => setForm({...form, data: e.target.value})} />
            </div>

            <input required placeholder="Local / Cliente" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm" value={form.local} onChange={e => setForm({...form, local: e.target.value})} />

            {/* GRID DE GASTOS */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  <input type="number" step="0.01" placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-center font-bold" 
                    value={form[item.field as keyof typeof form]} 
                    onChange={e => setForm({...form, [item.field]: e.target.value})} />
                </div>
              ))}
            </div>

            {/* COMPROVANTES */}
            <div className="flex flex-col items-center p-6 border-2 border-dashed border-slate-200 rounded-3xl hover:border-blue-400 transition-colors bg-slate-50 relative">
              <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={e => setComprovantes(Array.from(e.target.files || []))} />
              <p className="text-[10px] font-black uppercase text-slate-500 text-center">
                {comprovantes.length > 0 ? `${comprovantes.length} anexos selecionados` : 'Toque para anexar comprovantes'}
              </p>
            </div>

            <button disabled={carregando} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all">
              {carregando ? 'Gravando...' : 'Confirmar Lançamento'}
            </button>
          </form>
        </div>

        {/* LISTAGEM SIMPLIFICADA ABAIXO */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden mb-8">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xs font-black uppercase text-slate-500">Lançamentos</h3>
            <input type="date" className="text-xs font-bold text-blue-600 bg-transparent" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} />
          </div>
          {/* ... Lista de itens aqui ... */}
        </div>
      </div>

      {/* RODAPÉ COM VERSÃO */}
      <div className="text-center p-6">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
          PLL NEXT SYSTEM — {VERSAO_SISTEMA}
        </p>
      </div>
    </div>
  )
}
