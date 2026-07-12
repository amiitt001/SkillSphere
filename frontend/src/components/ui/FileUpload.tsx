'use client';

/**
 * FileUpload — Drag-and-drop file upload component with advanced security hardening.
 * Supports visual states: idle, hover/dragover, has-file, error.
 */

import { useState, useRef, useCallback } from 'react';

interface FileUploadProps {
    accept: string;
    onFileSelect: (file: File) => void;
    maxSizeMB?: number;
    label?: string;
    hint?: string;
}

export default function FileUpload({
    accept,
    onFileSelect,
    maxSizeMB = 5,
    label = 'Drop your file here or click to browse',
    hint = 'PDF files up to 5MB',
}: FileUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        (file: File) => {
            setError('');

            // 1. File size validation
            if (file.size > maxSizeMB * 1024 * 1024) {
                setError(`File size exceeds ${maxSizeMB}MB limit`);
                return;
            }

            // 2. Path traversal & name sanitization
            const cleanName = file.name.replace(/\\/g, '/').split('/').pop() || '';
            if (cleanName !== file.name || cleanName.includes('..')) {
                setError('Invalid characters or path traversal elements in file name');
                return;
            }

            // 3. Dangerous extensions block
            const ext = cleanName.split('.').pop()?.toLowerCase();
            const dangerousExtensions = ['exe', 'bat', 'sh', 'cmd', 'js', 'jar', 'vbs', 'scr', 'msi', 'com', 'scr', 'pif'];
            if (ext && dangerousExtensions.includes(ext)) {
                setError('Executable file extensions are strictly prohibited.');
                return;
            }

            // 4. Inspect file header signatures (Magic Numbers)
            const reader = new FileReader();
            reader.onloadend = () => {
                const arr = new Uint8Array(reader.result as ArrayBuffer).subarray(0, 4);
                let hexHeader = '';
                for (let i = 0; i < arr.length; i++) {
                    hexHeader += arr[i].toString(16).padStart(2, '0');
                }

                // MZ header = '4d5a' (Windows exe/dll)
                // ELF header = '7f454c46' (Linux executable)
                // Script #! shebang = '2321'
                const isExecutableHeader = 
                    hexHeader.startsWith('4d5a') || 
                    hexHeader.startsWith('7f454c46') || 
                    hexHeader.startsWith('2321');

                if (isExecutableHeader) {
                    setError('Security Alert: Dangerous binary/executable header detected.');
                    return;
                }

                // Validation passed
                setSelectedFile(file);
                onFileSelect(file);
            };
            
            reader.readAsArrayBuffer(file.slice(0, 4));
        },
        [maxSizeMB, onFileSelect]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div
            className={`upload-zone ${isDragOver ? 'dragover' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleChange}
                style={{ display: 'none' }}
            />

            <div className="upload-icon">
                {selectedFile ? (
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                )}
            </div>

            {selectedFile ? (
                <>
                    <p className="upload-text" style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>
                        {selectedFile.name}
                    </p>
                    <p className="upload-hint">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to replace
                    </p>
                </>
            ) : (
                <>
                    <p className="upload-text">{label}</p>
                    <p className="upload-hint">{hint}</p>
                </>
            )}

            {error && (
                <p style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginTop: '0.75rem', fontWeight: 600 }}>
                    {error}
                </p>
            )}
        </div>
    );
}
