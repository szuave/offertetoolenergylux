import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

type Props = {
  children: ReactNode
}

type State = {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-surface-muted">
        <div className="max-w-sm w-full">
          <div className="font-mono text-xs text-ink-mid mb-2">crash</div>
          <pre className="bg-surface border border-rule text-xs text-ink rounded-sm p-3 mb-4 overflow-x-auto scrollbar-thin whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Herladen
          </Button>
        </div>
      </div>
    )
  }
}
