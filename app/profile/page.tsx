'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import AuthProtection from '@/lib/auth-protection';
import { 
  User, 
  Mail, 
  Calendar, 
  Edit, 
  Save, 
  X,
  Shield,
  Zap,
  Download,
  Trash2,
  Key,
  CheckCircle,
  IdCard,
  Clock
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  last_login_at?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated' && session?.user?.id) {
      fetchProfile();
    }
  }, [status, session, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setEditForm({
          name: data.user.name,
          email: data.user.email
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setEditForm({
        name: profile.name,
        email: profile.email
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setIsEditing(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
    setPasswordError(''); // Clear error when user types
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          currentPassword: passwordForm.currentPassword, 
          newPassword: passwordForm.newPassword 
        }),
      });

      if (response.ok) {
        setIsPasswordModalOpen(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        // You could add a success toast here
      } else {
        const error = await response.json();
        setPasswordError(error.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDownloadData = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/user/download-data');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-data-${profile?.id}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setIsDownloadModalOpen(false);
      } else {
        alert('Failed to download data');
      }
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('Failed to download data');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type "DELETE" to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: deleteConfirmation }),
      });

      if (response.ok) {
        setIsDeleteModalOpen(false);
        router.push('/');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated' || !session?.user?.id) {
    router.push('/login');
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <p className="text-slate-300">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while fetching profile data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <p className="text-slate-300 mb-4">Failed to load profile</p>
            <Button 
              onClick={fetchProfile} 
              className="bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-0"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthProtection>
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
        <Navbar />
        <div className="container mx-auto px-5 py-8 max-w-6xl">
          {/* Profile Header */}
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
              Profile
            </h1>
            <p className="text-slate-400 text-lg">
              Manage your account information and preferences
            </p>
          </div>

          {/* Profile Content */}
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            {/* Personal Information Card */}
            <div className="bg-slate-800/50 backdrop-blur-lg border border-indigo-500/20 rounded-3xl p-8 transition-all duration-300 hover:border-indigo-500/40 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-100">Personal Information</h2>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-slate-300">Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleSave} 
                      disabled={isSaving}
                      className="flex-1 bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-0"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-indigo-500/5 rounded-xl hover:bg-indigo-500/10 transition-all duration-300 hover:translate-x-2">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Full Name</div>
                      <div className="text-slate-100 font-medium">{profile.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-indigo-500/5 rounded-xl hover:bg-indigo-500/10 transition-all duration-300 hover:translate-x-2">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Email Address</div>
                      <div className="text-slate-100 font-medium">{profile.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-indigo-500/5 rounded-xl hover:bg-indigo-500/10 transition-all duration-300 hover:translate-x-2">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Member Since</div>
                      <div className="text-slate-100 font-medium">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleEdit}
                    className="w-full mt-4 bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-0 py-4 text-base font-semibold hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>

            {/* Account Information Card */}
            <div className="bg-slate-800/50 backdrop-blur-lg border border-indigo-500/20 rounded-3xl p-8 transition-all duration-300 hover:border-indigo-500/40 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-100">Account Information</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-indigo-500/5 rounded-xl hover:bg-indigo-500/10 transition-all duration-300 hover:translate-x-2">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Account Status</div>
                    <div className="inline-block px-4 py-1 bg-linear-to-r from-emerald-500 to-emerald-600 rounded-full text-xs font-semibold text-white uppercase tracking-wider">
                      Active
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-indigo-500/5 rounded-xl hover:bg-indigo-500/10 transition-all duration-300 hover:translate-x-2">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                    <IdCard className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">User ID</div>
                    <div className="text-slate-100 font-mono font-medium">{profile.id}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-indigo-500/5 rounded-xl hover:bg-indigo-500/10 transition-all duration-300 hover:translate-x-2">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Last Login</div>
                    <div className="text-slate-100 font-medium">
                      {profile.last_login_at 
                        ? new Date(profile.last_login_at).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/50 backdrop-blur-lg border border-indigo-500/20 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-100">Quick Actions</h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogTrigger asChild>
                  <Button className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 text-center h-auto">
                    <div className="flex flex-col items-center gap-2">
                      <Key className="h-6 w-6 text-indigo-400" />
                      <span className="font-medium">Change Password</span>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-100">
                      <Shield className="h-5 w-5 text-indigo-400" />
                      Change Password
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword" className="text-slate-300">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                        className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500"
                        placeholder="Enter your current password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword" className="text-slate-300">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                        className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500"
                        placeholder="Enter your new password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-slate-300">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                        className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500"
                        placeholder="Confirm your new password"
                      />
                    </div>
                    {passwordError && (
                      <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                        {passwordError}
                      </div>
                    )}
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        className="flex-1 bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-0"
                      >
                        {isChangingPassword ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsPasswordModalOpen(false)}
                        disabled={isChangingPassword}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen}>
                <DialogTrigger asChild>
                  <Button className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 text-center h-auto">
                    <div className="flex flex-col items-center gap-2">
                      <Download className="h-6 w-6 text-indigo-400" />
                      <span className="font-medium">Download Data</span>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-100">
                      <Download className="h-5 w-5 text-indigo-400" />
                      Download Your Data
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                      This will download all your personal data in JSON format. 
                      The file will contain your profile information and account details.
                    </p>
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleDownloadData}
                        disabled={isDownloading}
                        className="flex-1 bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-0"
                      >
                        {isDownloading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download Data
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsDownloadModalOpen(false)}
                        disabled={isDownloading}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogTrigger asChild>
                  <Button className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-300 hover:bg-red-500/10 hover:border-red-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 text-center h-auto">
                    <div className="flex flex-col items-center gap-2">
                      <Trash2 className="h-6 w-6 text-red-400" />
                      <span className="font-medium">Delete Account</span>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-400">
                      <Trash2 className="h-5 w-5" />
                      Delete Account
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-sm text-red-300 font-medium">
                        ⚠️ This action cannot be undone
                      </p>
                      <p className="text-sm text-red-400 mt-1">
                        All your data will be permanently deleted.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="deleteConfirmation" className="text-slate-300">
                        Type "DELETE" to confirm account deletion
                      </Label>
                      <Input
                        id="deleteConfirmation"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        className="mt-2 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-red-500"
                        placeholder="Type DELETE to confirm"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                        className="flex-1 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0"
                      >
                        {isDeleting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsDeleteModalOpen(false);
                          setDeleteConfirmation('');
                        }}
                        disabled={isDeleting}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </AuthProtection>
  );
}
