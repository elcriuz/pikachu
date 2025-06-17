'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash2, Save, X, FolderOpen } from 'lucide-react'
import type { User } from '@/types'
import { PathSelector } from './PathSelector'

interface UserFormData {
  email: string
  name: string
  role: 'admin' | 'manager' | 'user'
  startPath?: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [addingUser, setAddingUser] = useState(false)
  const [showPathSelector, setShowPathSelector] = useState<boolean>(false)
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: 'user',
    startPath: ''
  })

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const response = await fetch('/api/settings/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveUser() {
    try {
      // Clean up the form data - convert empty strings to undefined
      const cleanedFormData = {
        ...formData,
        startPath: formData.startPath?.trim() || undefined
      }

      const response = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingUser ? 'update' : 'create',
          userData: cleanedFormData,
          originalEmail: editingUser?.email
        })
      })

      if (response.ok) {
        await loadUsers()
        cancelEdit()
      }
    } catch (error) {
      console.error('Failed to save user:', error)
    }
  }

  async function deleteUser(email: string) {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          email
        })
      })

      if (response.ok) {
        await loadUsers()
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  function startEdit(user: User) {
    setEditingUser(user)
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      startPath: user.startPath || ''
    })
    setAddingUser(false)
  }

  function startAdd() {
    setAddingUser(true)
    setEditingUser(null)
    setFormData({
      email: '',
      name: '',
      role: 'user',
      startPath: ''
    })
  }

  function cancelEdit() {
    setEditingUser(null)
    setAddingUser(false)
    setFormData({
      email: '',
      name: '',
      role: 'user',
      startPath: ''
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'user': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div>Loading users...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </div>
          <Button onClick={startAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {addingUser && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-4">Add New User</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'manager' | 'user' }))}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Start Path & Access Restriction</label>
              <div className="flex gap-2">
                <Input
                  value={formData.startPath}
                  onChange={(e) => setFormData(prev => ({ ...prev, startPath: e.target.value }))}
                  placeholder="Full access (no restrictions)"
                  readOnly
                  className="cursor-pointer"
                  onClick={() => setShowPathSelector(true)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPathSelector(true)}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                User starts here and cannot navigate to parent directories
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveUser} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={cancelEdit} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.email} className="flex items-center justify-between p-4 border rounded-lg">
              {editingUser?.email === user.email ? (
                <div className="flex-1 mr-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'manager' | 'user' }))}
                      className="px-3 py-2 border border-input rounded-md"
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={formData.startPath}
                      placeholder="Full access (no restrictions)"
                      readOnly
                      className="cursor-pointer"
                      onClick={() => setShowPathSelector(true)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPathSelector(true)}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <div>
                      <div className="font-medium">{user.email}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">{user.name}</div>
                    </div>
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  {user.startPath && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Restricted to:</span> {user.startPath} <span className="text-gray-400">(and subdirectories)</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {editingUser?.email === user.email ? (
                  <>
                    <Button onClick={saveUser} size="sm" variant="outline">
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button onClick={cancelEdit} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => startEdit(user)} size="sm" variant="outline">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => deleteUser(user.email)} size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found. Add your first user to get started.
          </div>
        )}
      </CardContent>

      {/* Path Selector Modal */}
      {showPathSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <PathSelector
            currentPath={formData.startPath || ''}
            onSelect={(path) => {
              setFormData(prev => ({ ...prev, startPath: path }))
              setShowPathSelector(false)
            }}
            onCancel={() => setShowPathSelector(false)}
            title="Select Start Path & Access Restriction"
          />
        </div>
      )}
    </Card>
  )
}