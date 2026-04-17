'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPll() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const VERSAO_SISTEMA = "v2.1.0"

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

      if (error) throw error

      if (data) {
        localStorage.setItem('usuario', JSON.stringify(data))
        // Criando o cookie de sessão para o Middleware
        const token = btoa(JSON.stringify({ id: data.id, admin: data.is_admin }))
        document.cookie = `luan_session=${token}; path=/; max-age=86400; SameSite=Lax`

        router.push(data.is_admin ? '/admin' : '/tecnico')
      } else {
        setErro('Credenciais incorretas ou acesso negado.')
      }
    } catch (err: any) {
      setErro('Erro de conexão com o banco.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <title>PLL Next - Login</title>
      
      <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200">
        <div className="text-center mb-10">
          {/* Logo PLL - Agora em destaque no fundo branco */}
          <img src="/logo-pll.png" alt="PLL Next" className="w-40 mx-auto mb-6" />
          <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-800">Sistema de Deslocamentos</h1>
          <p className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">PLL Next Platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">E-mail Corporativo</label>
            <input 
              type="email" required 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
              placeholder="seu.nome@pll.com.br"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Senha de Acesso</label>
            <input 
              type="password" required 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
              placeholder="••••••••"
              value={senha} onChange={e => setSenha(e.target.value)}
            />
          </div>

          {erro && (
            <div className="bg-red-50 text-red-600 text-[10px] font-black p-4 rounded-2xl text-center uppercase tracking-widest border border-red-100">
              {erro}
            </div>
          )}

          <button 
            disabled={carregando}
            className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 mt-4"
          >
            {carregando ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>

      {/* Versão do Sistema no Rodapé do Login */}
      <div className="mt-8">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
          PLL NEXT — {VERSAO_SISTEMA}
        </p>
      </div>
    </div>
  )
}
