import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PasswordResetForm } from '@/components/settings/password-reset-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="text-sm text-gray-900 mt-1">{session.user.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-sm text-gray-900 mt-1">{session.user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <p className="text-sm text-gray-900 mt-1">
                {session.user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Author'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Password Reset - Only for SuperAdmin */}
        {session.user.role === 'SUPER_ADMIN' && (
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordResetForm userId={session.user.id} />
            </CardContent>
          </Card>
        )}

        {/* Authors cannot change password - must contact admin */}
        {session.user.role === 'AUTHOR' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                To change your password, please contact your administrator.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
