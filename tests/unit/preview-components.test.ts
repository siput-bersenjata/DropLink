import { describe, it, expect } from 'vitest';
import MediaViewer from '@/components/preview/MediaViewer';
import FileDetailsCard from '@/components/preview/FileDetailsCard';
import DeleteConfirmationModal from '@/components/preview/DeleteConfirmationModal';

describe('Preview Page Components', () => {
  it('should export all preview components', () => {
    expect(MediaViewer).toBeDefined();
    expect(FileDetailsCard).toBeDefined();
    expect(DeleteConfirmationModal).toBeDefined();
  });
});
