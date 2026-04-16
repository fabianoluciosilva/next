'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setCarregando(true)

    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .ilike('email', email.trim())
      .eq('senha', senha.trim())
      .maybeSingle()

    if (data) {
      // Salva a sessão no navegador
      localStorage.setItem('usuario', JSON.stringify(data))
      
      // Cria o cookie de segurança para o Middleware
      const token = btoa(JSON.stringify({ id: data.id, admin: data.is_admin }))
      document.cookie = `luan_session=${token}; path=/; max-age=86400; SameSite=Lax`

      // Redireciona baseado no cargo
      if (data.is_admin) router.push('/admin')
      else router.push('/tecnico')
    } else {
      setErro('E-mail ou senha incorretos.')
    }
    setCarregando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-2xl font-black text-center text-gray-800 uppercase mb-6">Portal de Deslocamento</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" required placeholder="E-mail" className="w-full border rounded-xl px-4 py-3 bg-gray-50 outline-none focus:border-blue-600" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" required placeholder="Senha" className="w-full border rounded-xl px-4 py-3 bg-gray-50 outline-none focus:border-blue-600" value={senha} onChange={e => setSenha(e.target.value)} />
          {erro && <p className="text-red-600 text-xs font-bold text-center">{erro}</p>}
          <button disabled={carregando} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase shadow-lg hover:bg-blue-700 disabled:opacity-50 transition">
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
