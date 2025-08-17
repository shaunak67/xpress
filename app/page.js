'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Camera, Users, BarChart3, PlusCircle, Upload, LogOut } from 'lucide-react'

export default function FieldManagementApp() {
  const [user, setUser] = useState(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [photos, setPhotos] = useState([])
  const [leads, setLeads] = useState([])
  const [users, setUsers] = useState([])
  const [gpsTracking, setGpsTracking] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Auth state
  const [showLogin, setShowLogin] = useState(true)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ email: '', password: '', fullName: '', role: 'agent' })

  // Photo upload state
  const [photoData, setPhotoData] = useState({ description: '' })
  const [selectedFile, setSelectedFile] = useState(null)

  // Lead form state
  const [leadData, setLeadData] = useState({
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    business_name: '',
    notes: ''
  })

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }

    // Check if user is logged in (simplified check)
    const savedUser = localStorage.getItem('fieldapp_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      loadDashboardData()
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load photos
      const photosRes = await fetch('/api/photos')
      if (photosRes.ok) {
        const photosData = await photosRes.json()
        setPhotos(photosData)
      }

      // Load leads
      const leadsRes = await fetch('/api/leads')
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json()
        setLeads(leadsData)
      }

      // Load users (for admin)
      if (user?.profile?.role === 'admin') {
        const usersRes = await fetch('/api/users')
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData)
        }

        // Load GPS tracking
        const gpsRes = await fetch('/api/gps-tracking')
        if (gpsRes.ok) {
          const gpsData = await gpsRes.json()
          setGpsTracking(gpsData)
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data)
        localStorage.setItem('fieldapp_user', JSON.stringify(data))
        loadDashboardData()
      } else {
        alert(data.error || 'Login failed')
      }
    } catch (error) {
      alert('Login failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Registration successful! Please login.')
        setShowLogin(true)
        setRegisterData({ email: '', password: '', fullName: '', role: 'agent' })
      } else {
        alert(data.error || 'Registration failed')
      }
    } catch (error) {
      alert('Registration failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile || !currentLocation) {
      alert('Please select a photo and enable location services')
      return
    }

    setIsLoading(true)

    try {
      // Convert file to base64 for simple storage (in production, use proper file upload)
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Image = reader.result

        const response = await fetch('/api/photos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.user.id,
            image_url: base64Image,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            description: photoData.description,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          setPhotos([data, ...photos])
          setPhotoData({ description: '' })
          setSelectedFile(null)
          alert('Photo uploaded successfully!')
        } else {
          alert(data.error || 'Photo upload failed')
        }
      }

      reader.readAsDataURL(selectedFile)
    } catch (error) {
      alert('Photo upload failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeadSubmit = async (e) => {
    e.preventDefault()
    if (!currentLocation) {
      alert('Please enable location services')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user.id,
          ...leadData,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setLeads([data, ...leads])
        setLeadData({
          contact_name: '',
          contact_phone: '',
          contact_email: '',
          business_name: '',
          notes: ''
        })
        alert('Lead captured successfully!')
      } else {
        alert(data.error || 'Lead capture failed')
      }
    } catch (error) {
      alert('Lead capture failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const startGPSTracking = async () => {
    if (!currentLocation) {
      alert('Please enable location services')
      return
    }

    try {
      await fetch('/api/gps-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user.id,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          activity_type: 'active'
        }),
      })
    } catch (error) {
      console.error('GPS tracking error:', error)
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('fieldapp_user')
    setPhotos([])
    setLeads([])
    setUsers([])
    setGpsTracking([])
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        loadDashboardData()
        alert('User role updated successfully!')
      } else {
        alert('Failed to update user role')
      }
    } catch (error) {
      alert('Failed to update user role: ' + error.message)
    }
  }

  // Start GPS tracking interval when logged in
  useEffect(() => {
    if (user && currentLocation) {
      const interval = setInterval(startGPSTracking, 30000) // Track every 30 seconds
      return () => clearInterval(interval)
    }
  }, [user, currentLocation])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Field Management</CardTitle>
            <CardDescription>
              {showLogin ? 'Sign in to your account' : 'Create your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowLogin(false)}
                >
                  Don't have an account? Register
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={registerData.fullName}
                    onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={registerData.role} onValueChange={(value) => setRegisterData({ ...registerData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Field Agent</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowLogin(true)}
                >
                  Already have an account? Sign In
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <MapPin className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Field Management</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user.profile?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={user.profile?.role === 'admin' ? 'default' : 'secondary'}>
              {user.profile?.role === 'admin' ? 'Administrator' : 'Field Agent'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue={user.profile?.role === 'admin' ? 'dashboard' : 'photos'} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="photos">Photo Upload</TabsTrigger>
            <TabsTrigger value="leads">Lead Capture</TabsTrigger>
            {user.profile?.role === 'admin' && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
            {user.profile?.role === 'admin' && <TabsTrigger value="users">User Management</TabsTrigger>}
          </TabsList>

          {/* Photo Upload Tab */}
          <TabsContent value="photos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Upload Photo with Location
                </CardTitle>
                <CardDescription>
                  Capture and upload photos with automatic location tagging
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePhotoUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="photo">Select Photo</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the photo..."
                      value={photoData.description}
                      onChange={(e) => setPhotoData({ ...photoData, description: e.target.value })}
                    />
                  </div>
                  {currentLocation && (
                    <div className="text-sm text-muted-foreground">
                      Current Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </div>
                  )}
                  <Button type="submit" disabled={isLoading}>
                    <Upload className="h-4 w-4 mr-2" />
                    {isLoading ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Photos Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted">
                    {photo.image_url && (
                      <img
                        src={photo.image_url}
                        alt={photo.description}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">{photo.description}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {photo.latitude?.toFixed(4)}, {photo.longitude?.toFixed(4)}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      By: {photo.users?.full_name} • {new Date(photo.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Lead Capture Tab */}
          <TabsContent value="leads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Capture New Lead
                </CardTitle>
                <CardDescription>
                  Record potential customer information with location data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_name">Contact Name *</Label>
                      <Input
                        id="contact_name"
                        value={leadData.contact_name}
                        onChange={(e) => setLeadData({ ...leadData, contact_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone">Phone Number</Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        value={leadData.contact_phone}
                        onChange={(e) => setLeadData({ ...leadData, contact_phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_email">Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={leadData.contact_email}
                        onChange={(e) => setLeadData({ ...leadData, contact_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="business_name">Business Name</Label>
                      <Input
                        id="business_name"
                        value={leadData.business_name}
                        onChange={(e) => setLeadData({ ...leadData, business_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional information about the lead..."
                      value={leadData.notes}
                      onChange={(e) => setLeadData({ ...leadData, notes: e.target.value })}
                    />
                  </div>
                  {currentLocation && (
                    <div className="text-sm text-muted-foreground">
                      Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </div>
                  )}
                  <Button type="submit" disabled={isLoading}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Capture Lead'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Leads List */}
            <div className="space-y-4">
              {leads.map((lead) => (
                <Card key={lead.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{lead.contact_name}</h3>
                      <Badge variant="outline">{lead.business_name}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                      <p>Phone: {lead.contact_phone}</p>
                      <p>Email: {lead.contact_email}</p>
                    </div>
                    {lead.notes && <p className="text-sm mb-2">{lead.notes}</p>}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {lead.latitude?.toFixed(4)}, {lead.longitude?.toFixed(4)}
                      </div>
                      <div>
                        By: {lead.users?.full_name} • {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Admin Dashboard */}
          {user.profile?.role === 'admin' && (
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
                    <Camera className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{photos.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users.length}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest photos and leads captured by your team</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...photos.slice(0, 3), ...leads.slice(0, 3)]
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .slice(0, 5)
                      .map((item, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <div className="flex-1">
                            <p className="text-sm">
                              {item.description || item.contact_name} 
                              {item.image_url ? ' uploaded a photo' : ' captured a lead'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              By {item.users?.full_name} • {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* User Management */}
          {user.profile?.role === 'admin' && (
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user roles and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((userItem) => (
                      <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{userItem.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{userItem.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={userItem.role}
                            onValueChange={(newRole) => updateUserRole(userItem.id, newRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}