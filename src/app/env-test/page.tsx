'use client';

export default function EnvTest() {
  return (
    <div>
      <p>Cloud: {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'undefined'}</p>
      <p>Preset: {process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'undefined'}</p>
    </div>
  );
}

