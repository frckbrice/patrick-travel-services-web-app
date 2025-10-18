'use client';

// Enhanced profile view with edit mode

import { useState, useEffect, useRef, memo } from 'react';
import { useAuthStore } from '@/features/auth/store';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X,
  Camera,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SimpleSkeleton, SkeletonText } from '@/components/ui/simple-skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUpdateProfile, useUploadAvatar } from '../api/mutations';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z
    .string()
    .transform((val) => {
      // Handle empty values
      if (!val || val.trim() === '') return '';

      // Strip formatting characters (spaces, hyphens, parentheses) while preserving leading '+'
      const trimmed = val.trim();
      const hasLeadingPlus = trimmed.startsWith('+');
      const digitsOnly = trimmed.replace(/[\s\-()]/g, '');

      // Ensure '+' is preserved if it was present
      return hasLeadingPlus && !digitsOnly.startsWith('+') ? '+' + digitsOnly : digitsOnly;
    })
    .refine((val) => val === '' || /^(\+\d{7,15}|0\d{6,14})$/.test(val), {
      message: 'Phone must be international (+1234567890) or national (0123456789) format',
    }),
});

type ProfileInput = z.infer<typeof profileSchema>;

export function ProfileView() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  // Re-sync form fields when user prop changes
  useEffect(() => {
    form.reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    });
  }, [user, form]);

  const onSubmit = async (data: ProfileInput) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      setIsEditing(false);
    } catch (error) {
      // Error is already handled in the mutation's onError callback
    }
  };

  const getInitials = () => {
    if (!user) return '??';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleBadgeColor = () => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      AGENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      CLIENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
    return colors[user?.role || ''] || '';
  };

  const getRoleDisplayName = () => {
    const names: Record<string, string> = {
      ADMIN: 'Administrator',
      AGENT: 'Agent',
      CLIENT: 'Client',
    };
    return names[user?.role || ''] || user?.role || 'Unknown';
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please select an image file (JPEG, PNG, GIF, etc.)',
      });
      return;
    }

    // Validate file size (4MB max)
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      toast.error('File too large', {
        description: 'Image size must be less than 4MB',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    try {
      await uploadAvatarMutation.mutateAsync(file);
      setAvatarPreview(null); // Clear preview after successful upload
    } catch (error) {
      // Error is handled in the mutation
      setAvatarPreview(null); // Clear preview on error
    }

    // Reset input so the same file can be selected again
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your personal information</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4 relative">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={avatarPreview || user?.profilePicture || undefined}
                  alt={`${user?.firstName} ${user?.lastName}`}
                />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                    onClick={handleAvatarClick}
                    type="button"
                    disabled={uploadAvatarMutation.isPending}
                  >
                    {uploadAvatarMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  {/* Hidden file input for avatar upload */}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    aria-label="Upload avatar"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>
            <CardTitle>
              {user?.firstName} {user?.lastName}
            </CardTitle>
            <CardDescription className="flex items-center justify-center mt-2">
              <Mail className="h-3 w-3 mr-1" />
              {user?.email}
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex justify-center">
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1',
                    getRoleBadgeColor()
                  )}
                >
                  <Shield className="h-3 w-3" />
                  {getRoleDisplayName()}
                </span>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <ProfileStatusBadge
                  label="Status"
                  value={user?.isActive ? 'Active' : 'Inactive'}
                  isActive={user?.isActive}
                />
                <ProfileStatusBadge
                  label="Verified"
                  value={user?.isVerified ? 'Yes' : 'No'}
                  isActive={user?.isVerified}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              {isEditing ? 'Edit your account details' : 'Your account details and information'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting || updateProfileMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.reset();
                        setIsEditing(false);
                      }}
                      disabled={updateProfileMutation.isPending}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <ProfileField icon={User} label="First Name" value={user?.firstName || ''} />
                <ProfileField icon={User} label="Last Name" value={user?.lastName || ''} />
                <ProfileField icon={Mail} label="Email" value={user?.email || ''} />
                <ProfileField icon={Phone} label="Phone" value={user?.phone || 'Not provided'} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileField({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function ProfileStatusBadge({
  label,
  value,
  isActive,
}: {
  label: string;
  value: string;
  isActive?: boolean;
}) {
  return (
    <div className="flex flex-col items-center space-y-1 p-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Badge variant={isActive ? 'default' : 'secondary'} className="w-fit">
        {isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
        {value}
      </Badge>
    </div>
  );
}

/**
 * PERFORMANCE OPTIMIZED: Reduced from ~40 DOM elements to ~12
 * - Memoized → Better TBT
 * - Simplified card structure → Better FCP
 * - Reduced from 2 cards to simple blocks → Better Speed Index & CLS
 */
export const ProfileViewSkeleton = memo(function ProfileViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <SkeletonText size="xl" className="w-32" />
          <SkeletonText size="sm" className="w-64" />
        </div>
        <SimpleSkeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Profile content - Simplified 2-column layout */}
      <div className="grid gap-6 md:grid-cols-3">
        <SimpleSkeleton className="h-80 rounded-lg" />
        <SimpleSkeleton className="md:col-span-2 h-80 rounded-lg" />
      </div>
    </div>
  );
});
