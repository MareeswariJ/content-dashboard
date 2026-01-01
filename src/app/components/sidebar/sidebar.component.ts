import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoService } from '../../services/video.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
    private videoService = inject(VideoService);
    private sub!: Subscription;
    isContentUploadExpanded = true;
    activeSubItem = 'video';

    menuItems = [
        { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    ];

    contentUploadSubItems = [
        { id: 'video', label: 'Video' },
        { id: 'audio', label: 'Audio' },
        { id: 'image', label: 'Image' }
    ];

    bottomMenuItems = [
        { icon: 'content', label: 'General Content', hasArrow: true },
        { icon: 'eiflix', label: 'Eiflix', hasArrow: true },
        { icon: 'solar', label: 'Solar Voice', hasArrow: true },
        { icon: 'workshop', label: 'Workshop', hasArrow: true }
    ];

    ngOnInit() {
        this.sub = this.videoService.activeTabSubject.subscribe(tab => {
            this.activeSubItem = tab;
        });
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
    }

    toggleContentUpload() {
        this.isContentUploadExpanded = !this.isContentUploadExpanded;
    }

    setActiveSubItem(item: string) {
        this.activeSubItem = item;
        this.videoService.activeTabSubject.next(item);
    }
}
