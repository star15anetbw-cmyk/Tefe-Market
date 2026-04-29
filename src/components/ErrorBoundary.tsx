// @ts-nocheck
import React from 'react';
import { RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import Button from './ui/Button';

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary error:', error, errorInfo);
  }

  handleRetry = () => {
    window.location.reload();
  };

  handleOpenBrowser = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ url }).catch(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
      });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  render() {
    if ((this.state as any).hasError) {
      return (
        <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 text-center text-gray-900 font-sans">
          <div className="mb-8">
            <span className="text-3xl font-black tracking-tighter uppercase italic leading-none">
              Tefé<span className="text-secondary">Market</span>
            </span>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 max-w-sm w-full space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-black uppercase tracking-tight">
                Ops, algo não carregou corretamente
              </h1>
              <p className="text-sm text-gray-400 font-medium">
                Pode ser uma incompatibilidade temporária com o seu navegador.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                onClick={this.handleRetry}
                className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
              
              <Button 
                variant="outline"
                onClick={this.handleOpenBrowser}
                className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs border-2 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir no navegador
              </Button>
            </div>
          </div>
          
          <p className="mt-8 text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
             Marketplace Oficial de Tefé
          </p>
        </div>
      );
    }

    return (this.props as any).children;
  }
}

export default ErrorBoundary;
