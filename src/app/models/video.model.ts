export interface Video {
    id: string;
    title: string;
    duration: string;
    category: string;
    thumbnail: string;
    tags: string[];  // Actual tag names
    tagsUsed: number;
    size: string;
    status: 'visible' | 'hidden';
    uploadedDate: Date;
    converted: boolean;
}

export interface UploadProgress {
    progress: number;
    downloadUrl?: string;
    state: 'running' | 'paused' | 'success' | 'error';
    error?: string;
}
