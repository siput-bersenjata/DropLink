import { describe, it, expect } from 'vitest';
import Dropzone from '@/components/home/Dropzone';
import RetentionSelector from '@/components/home/RetentionSelector';
import SuccessCard from '@/components/home/SuccessCard';

describe('Dropzone & Upload Components', () => {
  it('should export Dropzone, RetentionSelector, and SuccessCard components', () => {
    expect(Dropzone).toBeDefined();
    expect(RetentionSelector).toBeDefined();
    expect(SuccessCard).toBeDefined();
  });
});
