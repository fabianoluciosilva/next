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
      // DEBUG: Vamos ver se o Supabase responde
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .ilike('email', email.trim())
        .eq('senha', senha.trim())
        .maybeSingle()

      if (error) {
        console.error("Erro no Supabase:", error.message)
        setErro(`Erro de conexão: ${error.message}`)
        return
      }

      if (data) {
        localStorage.setItem('usuario', JSON.stringify(data))
        const token = btoa(JSON.stringify({ id: data.id, admin: data.is_admin }))
        document.cookie = `luan_session=${token}; path=/; max-age=86400; SameSite=Lax; Secure`

        router.push(data.is_admin ? '/admin' : '/tecnico')
      } else {
        setErro('E-mail ou senha incorretos.')
      }
    } catch (err) {
      setErro('Falha crítica ao conectar.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 transition-colors">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-slate-800">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white font-black text-2xl">S</span>
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase text-white">Portal SSTI</h2>
        </div>
// Dentro do return do Login
<title>Sistema de Deslocamentos - PLL Next</title>
// ...
<div className="text-center mb-10">
  <img src="/logo-pll.png" alt="PLL Next" className="w-32 mx-auto mb-4" />
  <h2 className="text-2xl font-black uppercase dark:text-white">PLL Next</h2>
  <p className="text-slate-400 text-xs font-bold tracking-widest">SISTEMA DE DESLOCAMENTOS</p>
</div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            type="email" required 
            className="w-full bg-slate-800/50 border-none rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 text-white"
            placeholder="E-mail"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" required 
            className="w-full bg-slate-800/50 border-none rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 text-white"
            placeholder="Senha"
            value={senha} onChange={e => setSenha(e.target.value)}
          />

          {erro && <div className="bg-red-500/10 text-red-500 text-xs font-bold p-4 rounded-2xl text-center border border-red-500/20">{erro}</div>}

          <button 
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {carregando ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
