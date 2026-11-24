export type FileCategory = 'image' | 'video' | 'document';

export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 20 * 1024 * 1024,      // 20 MB
  VIDEO_MAX_SIZE: 50 * 1024 * 1024,      // 50 MB
  DOCUMENT_MAX_SIZE: 50 * 1024 * 1024,   // 50 MB
  ABSOLUTE_MAX_SIZE: 50 * 1024 * 1024,   // 50 MB
};

export const ALLOWED_RETENTION_MONTHS = [1, 3, 6] as const;
export type RetentionMonths = typeof ALLOWED_RETENTION_MONTHS[number];

const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'php', 'js', 'mjs', 'cjs', 'vbs', 'msi', 'scr', 'jar', 'com', 'pif'
]);

const EXTENSION_CATEGORIES: Record<string, FileCategory> = {
  // Images
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  webp: 'image',
  gif: 'image',
  svg: 'image',
  bmp: 'image',
  ico: 'image',

  // Videos
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  mkv: 'video',
  avi: 'video',

  // Documents & Archives
  pdf: 'document',
  doc: 'document',
  docx: 'document',
  xls: 'document',
  xlsx: 'document',
  ppt: 'document',
  pptx: 'document',
  txt: 'document',
  csv: 'document',
  zip: 'document',
  rar: 'document',
  '7z': 'document',
  tar: 'document',
  gz: 'document',
};

export interface ValidateFileInput {
  filename: string;
  size: number;
  mimeType?: string;
}

export interface ValidationResult {
  valid: boolean;
  category?: FileCategory;
  error?: string;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts[parts.length - 1].toLowerCase().trim();
}

export function detectCategory(filename: string, mimeType?: string): FileCategory | null {
  const ext = getFileExtension(filename);
  if (EXTENSION_CATEGORIES[ext]) {
    return EXTENSION_CATEGORIES[ext];
  }

  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (
      mimeType.startsWith('text/') ||
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('sheet') ||
      mimeType.includes('presentation') ||
      mimeType.includes('zip') ||
      mimeType.includes('archive')
    ) {
      return 'document';
    }
  }

  return 'document';
}

export function validateFile(input: ValidateFileInput): ValidationResult {
  const { filename, size, mimeType } = input;
  const ext = getFileExtension(filename);

  if (!filename || filename.trim() === '') {
    return { valid: false, error: 'Nama file tidak boleh kosong.' };
  }

  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Format file (.${ext}) berpotensi berbahaya dan tidak didukung.`,
    };
  }

  if (size <= 0) {
    return { valid: false, error: 'File kosong atau ukuran tidak valid.' };
  }

  if (size > FILE_LIMITS.ABSOLUTE_MAX_SIZE) {
    return {
      valid: false,
      error: 'Ukuran file melebihi batas maksimal 50MB.',
    };
  }

  const category = detectCategory(filename, mimeType);
  if (!category) {
    return {
      valid: false,
      error: 'Format file tidak didukung.',
    };
  }

  if (category === 'image' && size > FILE_LIMITS.IMAGE_MAX_SIZE) {
    return {
      valid: false,
      category,
      error: 'Ukuran gambar melebihi batas maksimal 20MB.',
    };
  }

  if (category === 'video' && size > FILE_LIMITS.VIDEO_MAX_SIZE) {
    return {
      valid: false,
      category,
      error: 'Ukuran video melebihi batas maksimal 50MB.',
    };
  }

  if (category === 'document' && size > FILE_LIMITS.DOCUMENT_MAX_SIZE) {
    return {
      valid: false,
      category,
      error: 'Ukuran dokumen melebihi batas maksimal 50MB.',
    };
  }

  return {
    valid: true,
    category,
  };
}

export interface BatchItemValidation {
  filename: string;
  size: number;
  mimeType: string;
  category: FileCategory;
}

export interface ValidateBatchResult {
  valid: boolean;
  totalSize: number;
  fileCount: number;
  items: BatchItemValidation[];
  error?: string;
}

export function validateBatch(
  files: Array<{ filename: string; size: number; mimeType?: string }>
): ValidateBatchResult {
  if (!files || files.length === 0) {
    return {
      valid: false,
      totalSize: 0,
      fileCount: 0,
      items: [],
      error: 'Pilih minimal satu file untuk diunggah.',
    };
  }

  if (files.length > 20) {
    return {
      valid: false,
      totalSize: 0,
      fileCount: files.length,
      items: [],
      error: 'Maksimal 20 file dalam satu tautan (batch upload).',
    };
  }

  let totalSize = 0;
  const items: BatchItemValidation[] = [];

  for (const f of files) {
    const singleValidation = validateFile(f);
    if (!singleValidation.valid || !singleValidation.category) {
      return {
        valid: false,
        totalSize: 0,
        fileCount: files.length,
        items: [],
        error: `File "${f.filename}": ${singleValidation.error || 'Format tidak didukung.'}`,
      };
    }

    totalSize += f.size;
    items.push({
      filename: f.filename,
      size: f.size,
      mimeType: f.mimeType || 'application/octet-stream',
      category: singleValidation.category,
    });
  }

  if (totalSize > FILE_LIMITS.ABSOLUTE_MAX_SIZE) {
    return {
      valid: false,
      totalSize,
      fileCount: files.length,
      items: [],
      error: `Total ukuran file (${formatBytes(totalSize)}) melebihi batas maksimal 50MB. Kurangi file atau ukuran.`,
    };
  }

  return {
    valid: true,
    totalSize,
    fileCount: files.length,
    items,
  };
}

export function calculateExpiryDate(retentionMonths: number): Date {
  if (!ALLOWED_RETENTION_MONTHS.includes(retentionMonths as RetentionMonths)) {
    throw new Error(
      `Pilihan masa aktif tidak valid. Harus salah satu dari: ${ALLOWED_RETENTION_MONTHS.join(', ')} bulan.`
    );
  }

  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + retentionMonths);
  return expiry;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
