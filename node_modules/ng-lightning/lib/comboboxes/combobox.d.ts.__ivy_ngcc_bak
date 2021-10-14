import { EventEmitter, OnChanges, TemplateRef, OnDestroy, QueryList, SimpleChanges, NgZone, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { ConnectionPositionPair, CdkOverlayOrigin, CdkConnectedOverlay } from '@angular/cdk/overlay';
import { NglComboboxOption } from './combobox-option';
import { NglComboboxInput } from './combobox-input';
import { NglComboboxService } from './combobox.service';
import { NglComboboxConfig } from './config';
export interface NglComboboxOptionItem {
    value: number | string;
    label?: string;
    disabled?: boolean;
}
export declare class NglCombobox implements OnChanges, OnDestroy {
    private ngZone;
    private cd;
    private service;
    readonly variant: 'base' | 'lookup';
    readonly label: string | TemplateRef<any>;
    readonly uid: string;
    readonly open = false;
    openChange: EventEmitter<boolean>;
    readonly selection: any;
    selectionChange: EventEmitter<any>;
    readonly multiple = false;
    readonly visibleLength: 5 | 7 | 10;
    inputEl: NglComboboxInput;
    readonly loading: boolean;
    readonly loadingMore: boolean;
    readonly closeOnSelection = true;
    /**
     * Text added to loading spinner.
     */
    loadingLabel: string;
    /**
     * Text message that renders when no matches found.
     */
    noOptionsFound: string;
    /**
     * Text for removing single selected option.
     */
    removeSelectedLabel: string;
    readonly options: QueryList<NglComboboxOption>;
    set data(data: any[]);
    get data(): any[];
    overlayOrigin: CdkOverlayOrigin;
    cdkOverlay: CdkConnectedOverlay;
    dropdownElementRef: ElementRef;
    overlayWidth: number;
    overlayPositions: ConnectionPositionPair[];
    /** Manages active item in option list based on key events. */
    keyManager: ActiveDescendantKeyManager<NglComboboxOption>;
    private optionChangesSubscription;
    private _data;
    private keyboardSubscription;
    selectionValueFn: (selection: string[]) => string;
    get activeOption(): NglComboboxOption | null;
    get selectedOptions(): NglComboboxOptionItem[];
    get isLookup(): boolean;
    get hasLookupSingleSelection(): boolean;
    constructor(defaultConfig: NglComboboxConfig, ngZone: NgZone, cd: ChangeDetectorRef, service: NglComboboxService);
    ngOnChanges(changes: SimpleChanges): void;
    onAttach(): void;
    onDetach(): void;
    trackByOption(index: any, option: NglComboboxOption): any;
    dropdownClass(): {
        [x: string]: boolean;
    };
    inputIconRight(): "utility:search" | "utility:down";
    hasNoMatches(): boolean;
    onOptionSelection(option?: NglComboboxOption): void;
    onClearSelection(): void;
    /**
     * Check whether value is currently selected.
     *
     * @param value The value in test, whether is (part of) selection or not
     */
    isSelected(value: any): boolean;
    ngOnDestroy(): void;
    close(): void;
    private detach;
    private calculateDisplayValue;
    private keyboardSubscribe;
    private updateMenuHeight;
}
