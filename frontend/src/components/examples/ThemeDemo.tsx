'use client';

import React from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/context/ThemeProvider';

export const ThemeDemo: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Tema Sistemi Demo
          </h1>
          <p className="text-secondary mt-2">
            Mevcut tema: <span className="font-semibold capitalize">{theme}</span>
          </p>
        </div>
        <ThemeToggle size="lg" showLabel />
      </div>

      {/* Color Palette */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Background Colors */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Arka Plan Renkleri</h2>
          <div className="space-y-2">
            <div className="bg-primary p-4 rounded-lg border border-primary">
              <span className="text-primary font-medium">Primary Background</span>
            </div>
            <div className="bg-secondary p-4 rounded-lg border border-primary">
              <span className="text-primary font-medium">Secondary Background</span>
            </div>
            <div className="bg-tertiary p-4 rounded-lg border border-primary">
              <span className="text-primary font-medium">Tertiary Background</span>
            </div>
            <div className="bg-elevated p-4 rounded-lg shadow-md">
              <span className="text-primary font-medium">Elevated Background</span>
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Marka Renkleri</h2>
          <div className="space-y-2">
            <button className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white p-4 rounded-lg font-medium transition-colors">
              Primary Button
            </button>
            <button className="w-full bg-brand-secondary hover:bg-brand-secondary-hover text-white p-4 rounded-lg font-medium transition-colors">
              Secondary Button
            </button>
            <button className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white p-4 rounded-lg font-medium transition-colors">
              Accent Button
            </button>
          </div>
        </div>

        {/* State Colors */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Durum Renkleri</h2>
          <div className="space-y-2">
            <div className="bg-state-success-bg border border-state-success-border p-4 rounded-lg">
              <span className="text-state-success font-medium">✓ Başarılı</span>
            </div>
            <div className="bg-state-warning-bg border border-state-warning-border p-4 rounded-lg">
              <span className="text-state-warning font-medium">⚠ Uyarı</span>
            </div>
            <div className="bg-state-error-bg border border-state-error-border p-4 rounded-lg">
              <span className="text-state-error font-medium">✗ Hata</span>
            </div>
            <div className="bg-state-info-bg border border-state-info-border p-4 rounded-lg">
              <span className="text-state-info font-medium">ℹ Bilgi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Tipografi</h2>
        <div className="space-y-3">
          <h1 className="text-5xl font-bold text-primary">H1 Başlık</h1>
          <h2 className="text-4xl font-semibold text-primary">H2 Başlık</h2>
          <h3 className="text-3xl font-semibold text-primary">H3 Başlık</h3>
          <h4 className="text-2xl font-semibold text-primary">H4 Başlık</h4>
          <h5 className="text-xl font-semibold text-primary">H5 Başlık</h5>
          <h6 className="text-lg font-semibold text-primary">H6 Başlık</h6>
          <p className="text-lg text-primary">Büyük gövde metni</p>
          <p className="text-base text-secondary">Normal gövde metni</p>
          <p className="text-sm text-tertiary">Küçük gövde metni</p>
          <p className="text-xs text-disabled">Devre dışı metin</p>
        </div>
      </div>

      {/* Interactive Elements */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Etkileşimli Öğeler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Buttons */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-primary">Butonlar</h3>
            <div className="space-y-2">
              <button className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white px-4 py-2 rounded-md font-medium transition-colors">
                Primary Button
              </button>
              <button className="w-full border border-primary text-primary hover:bg-interactive-hover px-4 py-2 rounded-md font-medium transition-colors">
                Outline Button
              </button>
              <button className="w-full text-brand-primary hover:bg-interactive-hover px-4 py-2 rounded-md font-medium transition-colors">
                Ghost Button
              </button>
            </div>
          </div>

          {/* Form Elements */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-primary">Form Öğeleri</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Text input"
                className="w-full px-3 py-2 border border-primary rounded-md bg-primary text-primary placeholder-tertiary focus:border-focus focus:ring-1 focus:ring-brand-primary"
              />
              <select className="w-full px-3 py-2 border border-primary rounded-md bg-primary text-primary focus:border-focus focus:ring-1 focus:ring-brand-primary">
                <option>Select option</option>
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
              <textarea
                placeholder="Textarea"
                rows={3}
                className="w-full px-3 py-2 border border-primary rounded-md bg-primary text-primary placeholder-tertiary focus:border-focus focus:ring-1 focus:ring-brand-primary resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shadows */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Gölgeler</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-elevated p-4 rounded-lg shadow-xs">
            <span className="text-sm text-secondary">XS</span>
          </div>
          <div className="bg-elevated p-4 rounded-lg shadow-sm">
            <span className="text-sm text-secondary">SM</span>
          </div>
          <div className="bg-elevated p-4 rounded-lg shadow-md">
            <span className="text-sm text-secondary">MD</span>
          </div>
          <div className="bg-elevated p-4 rounded-lg shadow-lg">
            <span className="text-sm text-secondary">LG</span>
          </div>
          <div className="bg-elevated p-4 rounded-lg shadow-xl">
            <span className="text-sm text-secondary">XL</span>
          </div>
          <div className="bg-elevated p-4 rounded-lg shadow-2xl">
            <span className="text-sm text-secondary">2XL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
