import JSZip from 'jszip';

export async function createZip(files: { name: string; data: Blob | ArrayBuffer }[]): Promise<Blob> {
    const zip = new JSZip();

    files.forEach((file) => {
        zip.file(file.name, file.data);
    });

    return await zip.generateAsync({ type: 'blob' });
}

export async function downloadZip(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
