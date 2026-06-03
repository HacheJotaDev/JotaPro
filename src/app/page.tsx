'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  Shield,
  Mail,
  Key,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Eye,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Fingerprint,
  Globe,
  Smartphone,
} from 'lucide-react';

/* ─── Types ─── */
interface NetflixEmail {
  id: string;
  messageId: string;
  from: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  code: string | null;
  link: string | null;
  emailType: 'verification' | 'geo_confirmation' | 'login_alert' | 'other';
  receivedAt: string;
  fetchedAt: string;
  isRead: boolean;
}

/* ─── PIN Login Screen ─── */
function PinLogin({ onAuth }: { onAuth: () => void }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('jotacode_token', data.token);
        onAuth();
      } else {
        setError('PIN incorrecto');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin('');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className={`relative w-full max-w-md bg-gray-900/80 backdrop-blur-xl border-gray-800 shadow-2xl shadow-red-500/5 transition-transform ${shake ? 'animate-bounce' : ''}`}>
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Netflix-style logo */}
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-500/30">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight">
              JotaCode
            </CardTitle>
            <CardDescription className="text-gray-400 mt-1">
              Netflix Code Monitor
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" />
                Ingresa tu PIN de acceso
              </label>
              <Input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="• • • •"
                className="h-14 text-center text-2xl tracking-[0.5em] bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold text-base shadow-lg shadow-red-500/25 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Fingerprint className="w-5 h-5 mr-2" />
                  Acceder
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-6">
            Sistema protegido · Solo acceso autorizado
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Email Card Component ─── */
function EmailCard({ email, onMarkRead }: { email: NetflixEmail; onMarkRead: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const typeConfig = {
    verification: {
      icon: Key,
      label: 'Código de Verificación',
      color: 'from-red-500 to-red-700',
      badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
    },
    geo_confirmation: {
      icon: Globe,
      label: 'Confirmación de Ubicación',
      color: 'from-amber-500 to-orange-600',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
    },
    login_alert: {
      icon: Smartphone,
      label: 'Alerta de Inicio de Sesión',
      color: 'from-blue-500 to-cyan-600',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
    },
    other: {
      icon: Mail,
      label: 'Notificación',
      color: 'from-gray-500 to-gray-600',
      badgeColor: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      iconBg: 'bg-gray-500/10',
      iconColor: 'text-gray-400',
    },
  };

  const config = typeConfig[email.emailType] || typeConfig.other;
  const Icon = config.icon;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyCode = async () => {
    if (!email.code) return;
    try {
      await navigator.clipboard.writeText(email.code);
      setCopied(true);
      toast({ title: 'Código copiado', description: email.code });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = email.code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const markRead = () => {
    if (!email.isRead) {
      onMarkRead(email.id);
    }
  };

  return (
    <Card
      className={`bg-gray-900/60 backdrop-blur border transition-all duration-300 hover:shadow-lg ${
        email.isRead
          ? 'border-gray-800 hover:border-gray-700'
          : `border-gray-700 hover:border-gray-600 shadow-md ring-1 ring-gray-700/50`
      }`}
      onClick={markRead}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${config.iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${config.iconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Badge variant="outline" className={`${config.badgeColor} text-xs font-medium mb-1`}>
                  {config.label}
                </Badge>
                <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                  {email.subject}
                </h3>
              </div>
              <span className="text-xs text-gray-500 shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(email.receivedAt)}
              </span>
            </div>

            {/* Code Display - The star of the show */}
            {email.code && (
              <div className="mt-3 bg-gradient-to-r from-gray-800/80 to-gray-800/40 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">
                      Código de verificación
                    </p>
                    <p className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-[0.3em]">
                      {email.code}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyCode();
                    }}
                    className={`h-10 px-4 ${copied ? 'text-green-400 bg-green-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="ml-2 text-sm">{copied ? 'Copiado' : 'Copiar'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Link Display */}
            {email.link && (
              <div className="mt-3 flex items-center gap-2 bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
                <a
                  href={email.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-amber-400 hover:text-amber-300 truncate underline underline-offset-2"
                >
                  Abrir enlace de confirmación
                </a>
              </div>
            )}

            {/* Expandable body */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Ocultar detalles' : 'Ver detalles del correo'}
            </button>

            {expanded && email.bodyText && (
              <div className="mt-2 p-3 bg-gray-800/30 rounded-lg border border-gray-700/20 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                  {email.bodyText.substring(0, 2000)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Dashboard ─── */
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [emails, setEmails] = useState<NetflixEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetch, setLastFetch] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'verification' | 'geo_confirmation' | 'login_alert'>('all');
  const [hours, setHours] = useState(48);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [connected, setConnected] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'error' | 'cache'>('checking');
  const [imapWarning, setImapWarning] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCodeCount = useRef(0);

  const fetchEmails = useCallback(async (force = false) => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/emails?hours=${hours}${force ? '&refresh=true' : ''}`);
      const data = await res.json();

      if (data.success) {
        setEmails(data.emails || []);
        setLastFetch(data.lastFetch || new Date().toISOString());
        setConnected(true);

        if (data.imapError) {
          setConnectionStatus('cache');
          setImapWarning(data.warning || 'Usando datos en caché');
        } else if (data.source === 'imap') {
          setConnectionStatus('ok');
          setImapWarning('');
        } else {
          setImapWarning('');
        }

        // Check for new codes with notifications
        if (notifications && data.emails) {
          const codeEmails = data.emails.filter((e: NetflixEmail) => e.code);
          if (codeEmails.length > prevCodeCount.current && prevCodeCount.current > 0) {
            const newest = codeEmails[0];
            if (newest?.code && 'Notification' in window) {
              try {
                new Notification('Nuevo código de Netflix', {
                  body: `Código: ${newest.code}`,
                  icon: '/favicon.ico',
                });
              } catch {}
            }
          }
          prevCodeCount.current = codeEmails.length;
        }
      } else {
        setConnected(false);
        setConnectionStatus('error');
      }
    } catch {
      setConnected(false);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hours, notifications]);

  // Initial fetch
  useEffect(() => {
    fetchEmails(true);
    testConnection();
  }, [fetchEmails]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchEmails(false), 30000); // 30s
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchEmails]);

  // Request notification permission
  useEffect(() => {
    if (notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [notifications]);

  const testConnection = async () => {
    setConnectionStatus('checking');
    try {
      const res = await fetch('/api/emails', { method: 'POST' });
      const data = await res.json();
      setConnectionStatus(data.success ? 'ok' : 'error');
    } catch {
      setConnectionStatus('error');
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetch('/api/emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: true } : e));
    } catch {}
  };

  const filteredEmails = emails.filter(e => filter === 'all' || e.emailType === filter);
  const unreadCount = emails.filter(e => !e.isRead).length;
  const codesCount = emails.filter(e => e.code).length;
  const geoCount = emails.filter(e => e.emailType === 'geo_confirmation').length;

  const handleLogout = () => {
    localStorage.removeItem('jotacode_token');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-md shadow-red-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">JotaCode</h1>
                <p className="text-[10px] text-gray-500 -mt-0.5 hidden sm:block">Netflix Code Monitor</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-1.5 text-xs">
                {connectionStatus === 'checking' && (
                  <RefreshCw className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                )}
                {connectionStatus === 'ok' && (
                  <Wifi className="w-3.5 h-3.5 text-green-400" />
                )}
                {connectionStatus === 'cache' && (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                )}
                {connectionStatus === 'error' && (
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className={`hidden sm:inline ${
                  connectionStatus === 'ok' ? 'text-green-400' :
                  connectionStatus === 'cache' ? 'text-amber-400' :
                  connectionStatus === 'error' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {connectionStatus === 'ok' ? 'Conectado' :
                   connectionStatus === 'cache' ? 'Caché' :
                   connectionStatus === 'error' ? 'Desconectado' :
                   'Verificando...'}
                </span>
              </div>

              {/* Auto-refresh toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`h-8 w-8 p-0 ${autoRefresh ? 'text-green-400' : 'text-gray-500'}`}
                title={autoRefresh ? 'Auto-refresh activado' : 'Auto-refresh desactivado'}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              </Button>

              {/* Notifications toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotifications(!notifications)}
                className={`h-8 w-8 p-0 ${notifications ? 'text-green-400' : 'text-gray-500'}`}
                title={notifications ? 'Notificaciones activadas' : 'Notificaciones desactivadas'}
              >
                {notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </Button>

              {/* Manual refresh */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchEmails(true)}
                disabled={refreshing}
                className="h-8 px-3 text-gray-400 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-xs">Actualizar</span>
              </Button>

              <Separator orientation="vertical" className="h-6 bg-gray-800" />

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 px-3 text-gray-400 hover:text-red-400"
              >
                <Lock className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline text-xs">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* IMAP Warning Banner */}
        {imapWarning && (
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-200 font-medium">Conexión IMAP no disponible</p>
                <p className="text-xs text-amber-400/70 mt-1">{imapWarning}</p>
                <p className="text-xs text-amber-500/50 mt-2">
                  Para configurar: asegúrate de que la contraseña de aplicación de Gmail sea correcta y que el acceso IMAP esté habilitado en tu cuenta de Google.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchEmails(true)}
                className="shrink-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-gray-900/60 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{emails.length}</p>
                  <p className="text-xs text-gray-500">Correos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/60 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{codesCount}</p>
                  <p className="text-xs text-gray-500">Códigos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/60 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{geoCount}</p>
                  <p className="text-xs text-gray-500">Geolocaliz.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/60 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{unreadCount}</p>
                  <p className="text-xs text-gray-500">Sin leer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all' as const, label: 'Todos', count: emails.length },
              { key: 'verification' as const, label: 'Códigos', count: emails.filter(e => e.emailType === 'verification').length },
              { key: 'geo_confirmation' as const, label: 'Geolocalización', count: emails.filter(e => e.emailType === 'geo_confirmation').length },
              { key: 'login_alert' as const, label: 'Alertas', count: emails.filter(e => e.emailType === 'login_alert').length },
            ].map(f => (
              <Button
                key={f.key}
                variant={filter === f.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(f.key)}
                className={`h-8 px-3 text-xs ${
                  filter === f.key
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {f.label}
                <Badge variant="secondary" className={`ml-1.5 h-5 min-w-[20px] px-1 text-[10px] ${
                  filter === f.key ? 'bg-red-400/20 text-red-100' : 'bg-gray-700 text-gray-400'
                }`}>
                  {f.count}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Últimas</span>
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="h-8 px-2 rounded-md bg-gray-800 border border-gray-700 text-xs text-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
            >
              <option value={24}>24 horas</option>
              <option value={48}>48 horas</option>
              <option value={72}>72 horas</option>
              <option value={168}>7 días</option>
            </select>
            {lastFetch && (
              <span className="text-[10px] text-gray-600 hidden sm:inline">
                Actualizado: {new Date(lastFetch).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Email List */}
        <div className="space-y-3">
          {loading ? (
            // Skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-gray-900/60 border-gray-800 animate-pulse">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-800" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-24 rounded bg-gray-800" />
                      <div className="h-5 w-3/4 rounded bg-gray-800" />
                      <div className="h-20 w-full rounded-xl bg-gray-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredEmails.length === 0 ? (
            <Card className="bg-gray-900/40 border-gray-800/50">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-400 mb-1">Sin correos de Netflix</h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  No se encontraron correos de Netflix en el período seleccionado.
                  Los códigos aparecerán aquí automáticamente cuando lleguen.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchEmails(true)}
                  className="mt-4 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Buscar ahora
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredEmails.map(email => (
              <EmailCard key={email.id} email={email} onMarkRead={markRead} />
            ))
          )}
        </div>

        {/* Info Banner */}
        <Card className="bg-gray-900/30 border-gray-800/30">
          <CardContent className="p-4 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong className="text-gray-400">JotaCode Monitor</strong> revisa automáticamente tu correo cada 30 segundos
                buscando correos de Netflix con códigos de verificación y enlaces de confirmación de ubicación.
              </p>
              <p>
                Comparte esta página con tus familiares para que puedan ver los códigos cuando no estés disponible.
                El PIN de acceso protege el acceso no autorizado.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-600">
            JotaCode v1.0 · Netflix Code Monitor
          </p>
          <p className="text-xs text-gray-700">
            Hecho con 🔴 por HacheJotaDev
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Main App ─── */
export default function Home() {
  const isAuth = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('jotacode_token');
    if (!token) return false;
    try {
      const decoded = atob(token);
      return !!decoded;
    } catch {
      return false;
    }
  }, []);

  const [authenticated, setAuthenticated] = useState(isAuth);

  if (!authenticated) {
    return <PinLogin onAuth={() => setAuthenticated(true)} />;
  }

  return <Dashboard onLogout={() => setAuthenticated(false)} />;
}
