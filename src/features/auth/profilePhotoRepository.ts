import { supabase } from '../../lib/supabase';

export const profilePhotosBucket = 'profile-photos';

export type UploadedProfilePhoto = {
  avatarPath: string;
  avatarUrl: string;
};

export async function uploadProfilePhoto(authUserId: string, imageUri: string): Promise<UploadedProfilePhoto> {
  const response = await fetch(imageUri);
  const imageBlob = await response.blob();
  const contentType = imageBlob.type || 'image/jpeg';
  const extension = getImageExtension(contentType, imageUri);
  const avatarPath = `${authUserId}/${Date.now()}.${extension}`;
  const uploadResult = await supabase.storage
    .from(profilePhotosBucket)
    .upload(avatarPath, imageBlob, {
      contentType,
      upsert: true,
    });

  if (uploadResult.error) {
    throw uploadResult.error;
  }

  return {
    avatarPath,
    avatarUrl: getProfilePhotoPublicUrl(avatarPath) ?? '',
  };
}

export function getProfilePhotoPublicUrl(avatarPath?: string | null) {
  if (!avatarPath) {
    return null;
  }

  return supabase.storage.from(profilePhotosBucket).getPublicUrl(avatarPath).data.publicUrl;
}

function getImageExtension(contentType: string, imageUri: string) {
  if (contentType.includes('png')) {
    return 'png';
  }

  if (contentType.includes('webp')) {
    return 'webp';
  }

  const uriExtension = imageUri.split('?')[0]?.split('.').pop()?.toLowerCase();

  if (uriExtension === 'png' || uriExtension === 'webp' || uriExtension === 'jpg' || uriExtension === 'jpeg') {
    return uriExtension === 'jpeg' ? 'jpg' : uriExtension;
  }

  return 'jpg';
}
