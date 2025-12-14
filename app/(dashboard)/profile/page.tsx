"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getProfile, updateProfile, uploadAvatar } from "@/lib/profile"
import { Loader2, User, Mail, Save, Camera } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const [formData, setFormData] = React.useState({
    full_name: "",
    email: "",
    avatar_url: ""
  })
  const [showSignOutDialog, setShowSignOutDialog] = React.useState(false)

  React.useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        try {
          const data = await getProfile()
          setProfile(data)
          setFormData({
            full_name: data.full_name || "",
            email: data.email || user.email || "",
            avatar_url: data.avatar_url || ""
          })
        } catch (error) {
          // Profile doesn't exist, use user data
          setFormData({
            full_name: "",
            email: user.email || "",
            avatar_url: ""
          })
        }
      }
    } catch (error: any) {
      console.error("Error loading profile:", error)
      console.error("Error specifics:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint
      })
      toast.error("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    try {
      const avatarUrl = await uploadAvatar(file)
      setFormData({ ...formData, avatar_url: avatarUrl })
      
      // Auto-save avatar
      await updateProfile({ avatar_url: avatarUrl })
      toast.success("Avatar updated successfully!")
      loadProfile()
    } catch (error: any) {
      toast.error(`Failed to upload avatar: ${error.message}`)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await updateProfile({
        email: formData.email,
        avatar_url: formData.avatar_url
      })
      toast.success("Profile updated successfully!")
      loadProfile()
    } catch (error: any) {
      toast.error(`Failed to update profile: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6 pb-6 border-b">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {formData.avatar_url ? (
                  <Image
                    src={formData.avatar_url}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <User className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-3 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
                ) : (
                  <Camera className="h-5 w-5 text-primary-foreground" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploadingAvatar}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Click the camera icon to upload a new photo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This is your login email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full h-12 text-base sm:h-10 sm:text-sm">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your app preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start h-12 text-base"
            onClick={() => window.location.href = '/savings'}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h0"/></svg>
              </div>
              <span>Savings Goals</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-12 text-base"
            onClick={() => window.location.href = '/analytics'}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <span>Advanced Analytics</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-12 text-base"
            onClick={() => window.location.href = '/categories'}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41-1.41l6.59-6.59a1 1 0 0 0 1.41-1.41V2Z"/><path d="M7 7h.01"/></svg>
              </div>
              <span>Manage Categories</span>
            </div>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive" 
            className="w-full h-12 text-base sm:h-10 sm:text-sm"
            onClick={() => setShowSignOutDialog(true)}
          >
            Sign Out
          </Button>

          <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to sign out of your account?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={async () => {
                    await fetch('/auth/signout', { method: 'POST' })
                    window.location.href = '/login'
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sign Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
