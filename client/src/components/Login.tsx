import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface LoginProps {
  onLogin: (userData: any) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Por favor, preencha todos os campos')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        onLogin(data.user)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Erro ao fazer login')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="financeai-login">
      <div className="financeai-login__card">
        {/* Header */}
        <div className="financeai-login__header">
          <div className="financeai-login__logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          <h2 className="financeai-login__title">FinanceAI</h2>
          <p className="financeai-login__subtitle">Análise Financeira Inteligente</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="financeai-login__form">
          {error && (
            <div style={{ 
              padding: '12px', 
              background: '#fee2e2', 
              border: '1px solid #fecaca', 
              borderRadius: '8px', 
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <div className="financeai-login__field">
            <label className="financeai-login__label">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="financeai-login__input"
              placeholder="Digite seu usuário"
              disabled={isLoading}
            />
          </div>

          <div className="financeai-login__field">
            <label className="financeai-login__label">Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="financeai-login__input"
                placeholder="Digite sua senha"
                style={{ paddingRight: '40px' }}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="financeai-login__button"
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Credentials */}
        <div className="financeai-login__credentials">
          <div className="financeai-login__credentials-title">Credenciais padrão:</div>
          <div className="financeai-login__credentials-text">
            Usuário: Admin<br />
            Senha: admin123
          </div>
        </div>
      </div>
    </div>
  )
}