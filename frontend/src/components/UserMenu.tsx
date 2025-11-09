// frontend/src/components/UserMenu.tsx
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { authGetHistory, authDeleteHistory, authBookmarkHistory, ChatHistoryItem } from '@/lib/auth'
import { BookMarked, Bookmark, LogIn, LogOut, User, History, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

export function UserMenu() {
  const { user, isAdmin, login, signup, logout, updateProfile } = useAuth()
  const { toast } = useToast()

  const [openLogin, setOpenLogin] = useState(false)
  const [openSignup, setOpenSignup] = useState(false)
  const [openProfile, setOpenProfile] = useState(false)
  const [openHistory, setOpenHistory] = useState(false)

  // Login form
  const [loginId, setLoginId] = useState('')
  const [loginPwd, setLoginPwd] = useState('')
  const [loadingLogin, setLoadingLogin] = useState(false)

  // Signup form
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loadingSignup, setLoadingSignup] = useState(false)

  // Profile form
  const [pEmail, setPEmail] = useState(user?.email || '')
  const [pUsername, setPUsername] = useState(user?.username || '')
  const [pPassword, setPPassword] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(false)

  useEffect(() => {
    setPEmail(user?.email || '')
    setPUsername(user?.username || '')
  }, [user])

  // History
  const [history, setHistory] = useState<ChatHistoryItem[] | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const items = await authGetHistory()
      setHistory(items)
    } catch (e: any) {
      toast({ title: 'Failed to load history', description: e.message, variant: 'destructive' })
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (openHistory) loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openHistory])

  const onLogin = async () => {
    try {
      setLoadingLogin(true)
      await login(loginId, loginPwd)
      setOpenLogin(false)
      setLoginPwd('')
    } catch (e: any) {
      toast({ title: 'Login failed', description: e.message, variant: 'destructive' })
    } finally {
      setLoadingLogin(false)
    }
  }

  const onSignup = async () => {
    try {
      setLoadingSignup(true)
      await signup(email, username, password)
      setOpenSignup(false)
      setPassword('')
    } catch (e: any) {
      toast({ title: 'Signup failed', description: e.message, variant: 'destructive' })
    } finally {
      setLoadingSignup(false)
    }
  }

  const onUpdateProfile = async () => {
    try {
      setLoadingProfile(true)
      await updateProfile({
        email: pEmail !== user?.email ? pEmail : undefined,
        username: pUsername !== user?.username ? pUsername : undefined,
        password: pPassword || undefined,
      })
      setOpenProfile(false)
      setPPassword('')
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' })
    } finally {
      setLoadingProfile(false)
    }
  }

  const onToggleBookmark = async (id: number, current: boolean) => {
    try {
      await authBookmarkHistory(id, !current)
      setHistory(h => h?.map(x => (x.id === id ? { ...x, is_bookmarked: !current } : x)) || null)
    } catch (e: any) {
      toast({ title: 'Failed to update bookmark', description: e.message, variant: 'destructive' })
    }
  }

  const onDeleteHistory = async (id: number) => {
    try {
      await authDeleteHistory(id)
      setHistory(h => h?.filter(x => x.id !== id) || null)
    } catch (e: any) {
      toast({ title: 'Failed to delete item', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <>
      {user ? (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted transition">
              <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold">
                {user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium hidden md:inline">{user.username}</span>
              {isAdmin && <Shield className="h-4 w-4 text-primary" />}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content sideOffset={8} className="z-50 rounded-md border bg-background p-2 shadow-md w-56">
            <div className="px-2 py-1.5 text-sm">
              <div className="font-semibold">{user.username}</div>
              <div className="text-muted-foreground truncate">{user.email}</div>
            </div>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item asChild>
              <button className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2"
                onClick={() => setOpenProfile(true)}>
                <User className="h-4 w-4" /> Profile
              </button>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <button className="w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2"
                onClick={() => setOpenHistory(true)}>
                <History className="h-4 w-4" /> History
              </button>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item asChild>
              <button className="w-full text-left px-2 py-1.5 rounded hover:bg-muted text-red-600 flex items-center gap-2"
                onClick={logout}>
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setOpenLogin(true)}>
            <LogIn className="h-4 w-4 mr-1" /> Login
          </Button>
          <Button onClick={() => setOpenSignup(true)}>Sign up</Button>
        </div>
      )}

      {/* Login Dialog */}
      <Dialog open={openLogin} onOpenChange={setOpenLogin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email or Username</Label>
              <Input value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="you@example.com or username" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={loginPwd} onChange={e => setLoginPwd(e.target.value)} placeholder="********" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onLogin} disabled={loadingLogin || !loginId || !loginPwd}>
              {loadingLogin ? 'Logging in...' : 'Login'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={openSignup} onOpenChange={setOpenSignup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="cooluser" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="********" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onSignup} disabled={loadingSignup || !email || !username || !password}>
              {loadingSignup ? 'Creating...' : 'Sign up'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={openProfile} onOpenChange={setOpenProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={pEmail} onChange={e => setPEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={pUsername} onChange={e => setPUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>New Password (optional)</Label>
              <Input type="password" value={pPassword} onChange={e => setPPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onUpdateProfile} disabled={loadingProfile}>
              {loadingProfile ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={openHistory} onOpenChange={setOpenHistory}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Saved history</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingHistory ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : !history || history.length === 0 ? (
              <div className="text-sm text-muted-foreground">No saved conversations yet.</div>
            ) : (
              history.map(item => (
                <div key={item.id} className="p-3 rounded-lg border">
                  <div className="text-sm font-semibold mb-1">Q: {item.question}</div>
                  <div className="text-sm text-muted-foreground line-clamp-3">A: {item.answer}</div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{new Date(item.created_at).toLocaleString('en-IN')}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-muted"
                        onClick={() => onToggleBookmark(item.id, item.is_bookmarked)}
                        title={item.is_bookmarked ? 'Unbookmark' : 'Bookmark'}
                      >
                        {item.is_bookmarked ? <BookMarked className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                        {item.is_bookmarked ? 'Bookmarked' : 'Bookmark'}
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-muted text-red-600"
                        onClick={() => onDeleteHistory(item.id)}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={loadHistory}>Refresh</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}