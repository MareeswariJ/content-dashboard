import { Injectable, inject, NgZone } from '@angular/core';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    Timestamp,
    getDocs,
    CollectionReference,
    DocumentData
} from 'firebase/firestore';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from 'firebase/storage';
import { Observable, BehaviorSubject } from 'rxjs';
import { Video, UploadProgress } from '../models/video.model';
import { db, storage } from '../firebase.config';

@Injectable({
    providedIn: 'root'
})
export class VideoService {
    private videosCollection: CollectionReference<DocumentData>;
    private ngZone = inject(NgZone);
    private videosSubject = new BehaviorSubject<Video[]>([]);
    // Subject for syncing Sidebar and Content tabs
    public activeTabSubject = new BehaviorSubject<string>('video');

    constructor() {
        this.videosCollection = collection(db, 'videos');
        this.loadVideos();
    }

    private async loadVideos(): Promise<void> {
        try {
            const snapshot = await getDocs(this.videosCollection);
            const videos = snapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data()['title'] || 'Untitled',
                duration: doc.data()['duration'] || '00:00:00',
                category: doc.data()['category'] || 'General',
                thumbnail: doc.data()['thumbnail'] || '',
                tags: doc.data()['tags'] || [],
                tagsUsed: doc.data()['tags']?.length || doc.data()['tagsUsed'] || 0,
                size: doc.data()['size'] || '0KB',
                status: doc.data()['status'] || 'visible',
                uploadedDate: doc.data()['uploadedDate']?.toDate?.() || new Date(),
                converted: doc.data()['converted'] || false
            } as Video)).sort((a, b) =>
                new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime()
            );

            this.ngZone.run(() => this.videosSubject.next(videos));
        } catch (error) {
            console.error('Load error:', error);
            this.ngZone.run(() => this.videosSubject.next([]));
        }
    }

    getVideos(): Observable<Video[]> {
        return this.videosSubject.asObservable();
    }

    uploadVideo(file: File, metadata: Partial<Video>): Observable<UploadProgress> {
        const progress$ = new BehaviorSubject<UploadProgress>({
            progress: 0,
            state: 'running'
        });

        const filePath = `videos/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                this.ngZone.run(() => {
                    progress$.next({
                        progress: Math.round(progress),
                        state: 'running'
                    });
                });
            },
            (error) => {
                this.ngZone.run(() => {
                    progress$.next({ progress: 0, state: 'error', error: error?.message });
                    progress$.complete();
                });
            },
            async () => {
                // File uploaded! Get URL and save metadata
                try {
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

                    // IMMEDIATELY show success - don't wait for Firestore
                    this.ngZone.run(() => {
                        progress$.next({ progress: 100, state: 'success', downloadUrl });
                        progress$.complete();
                    });

                    // Save to Firestore in background (don't block UI)
                    this.saveToFirestoreBackground(file, metadata, downloadUrl);

                } catch (error: any) {
                    this.ngZone.run(() => {
                        progress$.next({ progress: 100, state: 'error', error: 'Failed to get download URL' });
                        progress$.complete();
                    });
                }
            }
        );

        return progress$.asObservable();
    }

    // Background save - doesn't block the UI
    private async saveToFirestoreBackground(file: File, metadata: Partial<Video>, downloadUrl: string): Promise<void> {
        const videoData = {
            title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
            duration: metadata.duration || '00:00:00',
            category: metadata.category || 'General',
            thumbnail: downloadUrl,
            tags: metadata.tags || [],
            tagsUsed: metadata.tags?.length || 0,
            size: this.formatFileSize(file.size),
            status: 'visible',
            uploadedDate: Timestamp.now(),
            converted: false
        };

        try {
            await addDoc(this.videosCollection, videoData);
            console.log('✅ Video saved to Firestore');
            // Refresh the list after save
            setTimeout(() => this.loadVideos(), 1000);
        } catch (error) {
            console.error('❌ Failed to save to Firestore:', error);
            // Even if Firestore fails, video is in Storage
        }
    }

    async updateVideo(id: string, data: Partial<Video>): Promise<void> {
        await updateDoc(doc(db, 'videos', id), data as any);
        await this.loadVideos();
    }

    async deleteVideo(id: string): Promise<void> {
        await deleteDoc(doc(db, 'videos', id));
        await this.loadVideos();
    }

    async deleteMultiple(ids: string[]): Promise<void> {
        for (const id of ids) {
            await deleteDoc(doc(db, 'videos', id));
        }
        await this.loadVideos();
    }

    async toggleVisibility(id: string, currentStatus: 'visible' | 'hidden'): Promise<void> {
        await this.updateVideo(id, { status: currentStatus === 'visible' ? 'hidden' : 'visible' });
    }

    async toggleConverted(id: string, currentStatus: boolean): Promise<void> {
        await this.updateVideo(id, { converted: !currentStatus });
    }

    private formatFileSize(bytes: number): string {
        if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + 'GB';
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + 'MB';
        return (bytes / 1024).toFixed(1) + 'KB';
    }
}
