import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
    value: string;
    label: string;
}

@Component({
    selector: 'app-custom-dropdown',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './custom-dropdown.component.html',
    styleUrl: './custom-dropdown.component.scss'
})
export class CustomDropdownComponent {
    @Input() options: DropdownOption[] = [];
    @Input() placeholder: string = 'Select...';
    @Input() value: string = '';
    @Output() valueChange = new EventEmitter<string>();

    isOpen = false;

    constructor(private elementRef: ElementRef) { }

    get selectedLabel(): string {
        const selected = this.options.find(opt => opt.value === this.value);
        return selected ? selected.label : this.placeholder;
    }

    toggle() {
        this.isOpen = !this.isOpen;
    }

    selectOption(option: DropdownOption) {
        this.value = option.value;
        this.valueChange.emit(option.value);
        this.isOpen = false;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }
}
