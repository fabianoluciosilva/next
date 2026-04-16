'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setCarregando(true)

    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .ilike('email', email.trim())
        .eq('senha', senha.trim())
        .maybeSingle()

      if (data) {
        localStorage.setItem('usuario', JSON.stringify(data))
        const token = btoa(JSON.stringify({ id: data.id, admin: data.is_admin }))
        document.cookie = `luan_session=${token}; path=/; max-age=86400; SameSite=Lax; Secure`

        router.push(data.is_admin ? '/admin' : '/tecnico')
      } else {
        setErro('Credenciais inválidas ou acesso negado.')
      }
    } catch (err) {
      setErro('Falha na conexão com o servidor.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-white dark:border-slate-800">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white font-black text-2xl">S</span>
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase dark:text-white">Portal SSTI</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Controle de Mobilidade e Deslocamento</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">E-mail Corporativo</label>
            <input 
              type="email" required 
              className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
              placeholder="exemplo@simplessolucao.com.br"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Senha de Acesso</label>
            <input 
              type="password" required 
              className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
              placeholder="••••••••"
              value={senha} onChange={e => setSenha(e.target.value)}
            />
          </div>

          {erro && <div className="bg-red-500/10 text-red-500 text-xs font-bold p-4 rounded-2xl text-center border border-red-500/20">{erro}</div>}

          <button 
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {carregando ? 'Autenticando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}
