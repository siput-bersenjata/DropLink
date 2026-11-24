import { describe, it, expect } from 'vitest';
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import ValueProps from '@/components/home/ValueProps';

describe('UI Mockup Layout Components', () => {
  it('should export all required layout components', () => {
    expect(Navbar).toBeDefined();
    expect(Footer).toBeDefined();
    expect(Hero).toBeDefined();
    expect(ValueProps).toBeDefined();
  });
});
