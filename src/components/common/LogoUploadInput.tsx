'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, CheckCircle2, AlertCircle, Loader2, Link as LinkIcon } from 'lucide-react';
import { uploadAcademyLogoAction } from '@/lib/academies/actions';

interface LogoUploadInputProps {
  currentLogoUrl?: string | null;
  onLogoChange?: (url: string | null) => void;
  inputName?: string;
  label?: string;
  description?: string;
}

export function LogoUploadInput({
  currentLogoUrl = null,
  onLogoChange,
  inputName = 'logoUrl',
  label = 'Academy Brand Logo',
  description = 'Upload a high-resolution logo (PNG, JPG, SVG, WebP) or enter an image URL.',
}: LogoUploadInputProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpdate(newUrl: string | null) {
    setLogoUrl(newUrl);
    setImgError(false);
    setErrorMsg(null);
    onLogoChange?.(newUrl);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 3MB.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.set('file', file);

      const result = await uploadAcademyLogoAction(formData);
      if (result.success && result.url) {
        handleUpdate(result.url);
      } else {
        setErrorMsg(result.message || 'Failed to upload logo.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred during logo upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleApplyUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      handleUpdate(null);
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setErrorMsg('Please enter a valid image URL (http:// or https://)');
      return;
    }
    handleUpdate(trimmed);
  }

  function handleRemove() {
    handleUpdate(null);
    setUrlInput('');
  }

  return (
    <div className="space-y-3">
      {/* Hidden input for standard form submission */}
      <input type="hidden" name={inputName} value={logoUrl || ''} />

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
          {description && (
            <p className="text-2xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>

        {/* Input Mode Toggle */}
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-2xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              mode === 'upload' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              mode === 'url' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Upload / Input Card */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-colors">
        {/* Visual Preview Box */}
        <div className="relative w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs group">
          {logoUrl && !imgError ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Academy Logo Preview"
                onError={() => setImgError(true)}
                className="w-full h-full object-contain p-1"
              />
              <button
                type="button"
                onClick={handleRemove}
                title="Remove logo"
                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <ImageIcon className="w-6 h-6" />
              <span className="text-3xs font-medium uppercase mt-0.5">No Logo</span>
            </div>
          )}
        </div>

        {/* Input Controls */}
        <div className="flex-1 w-full space-y-2">
          {mode === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
                id={`logo-file-${inputName}`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor={`logo-file-${inputName}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs ${
                    uploading
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      Uploading Logo...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5 text-blue-700" />
                      {logoUrl ? 'Change Logo Image' : 'Select Logo Image'}
                    </>
                  )}
                </label>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-2xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-2xs text-slate-500 mt-1">
                PNG, JPG, WebP or SVG up to 3MB. Displayed across student portals and receipts.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs"
                >
                  Apply
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-2xs text-slate-500">
                Direct image link hosted on your website or CDN.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
