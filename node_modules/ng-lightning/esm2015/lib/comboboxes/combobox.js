import { __decorate } from "tslib";
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChildren, ContentChild, ViewChild, NgZone, ChangeDetectorRef, Optional, Inject } from '@angular/core';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { take } from 'rxjs/operators';
import { DEFAULT_DROPDOWN_POSITIONS } from '../util/overlay-position';
import { uniqueId, isOptionSelected, addOptionToSelection } from '../util/util';
import { InputBoolean, InputNumber } from '../util/convert';
import { NglComboboxOption } from './combobox-option';
import { NglComboboxInput } from './combobox-input';
import { NglComboboxService } from './combobox.service';
import { NglComboboxConfig, NGL_COMBOBOX_CONFIG } from './config';
export class NglCombobox {
    constructor(defaultConfig, ngZone, cd, service) {
        this.ngZone = ngZone;
        this.cd = cd;
        this.service = service;
        this.variant = 'base';
        this.uid = uniqueId('combobox');
        this.open = false;
        this.openChange = new EventEmitter();
        this.selectionChange = new EventEmitter();
        this.multiple = false;
        this.visibleLength = 5;
        this.closeOnSelection = true;
        this.overlayWidth = 0;
        this.overlayPositions = [...DEFAULT_DROPDOWN_POSITIONS['left']];
        this.selectionValueFn = (selection) => {
            if (selection.length > 0) {
                if (this.multiple && this.isLookup) {
                    return '';
                }
                return selection.length === 1 ? selection[0] : `${selection.length} options selected`;
            }
            return '';
        };
        const config = Object.assign(Object.assign({}, new NglComboboxConfig()), defaultConfig);
        this.loadingLabel = config.loadingLabel;
        this.noOptionsFound = config.noOptionsFound;
        this.removeSelectedLabel = config.removeSelectedLabel;
        this.service.combobox = this;
        // this.service.openChange = this.openChange;
    }
    set data(data) {
        this._data = (data || []).map((d) => {
            if (typeof d === 'string') {
                // Support array of strings as options, by mapping to NglComboboxOptionItem
                return { value: d, label: d };
            }
            else if (!d.label) {
                // Use `value` if missing `label`
                return Object.assign(Object.assign({}, d), { label: d.value });
            }
            return d;
        });
    }
    get data() {
        return this._data;
    }
    get activeOption() {
        return this.keyManager ? this.keyManager.activeItem : null;
    }
    get selectedOptions() {
        return this.data ? this.data.filter(d => this.isSelected(d.value)) : [];
    }
    get isLookup() {
        return this.variant === 'lookup';
    }
    get hasLookupSingleSelection() {
        return this.isLookup && !this.multiple && this.selectedOptions.length > 0;
    }
    ngOnChanges(changes) {
        if (changes.selection) {
            this.calculateDisplayValue();
        }
    }
    onAttach() {
        // Same width as the trigger element
        this.overlayWidth = this.overlayOrigin.elementRef.nativeElement.offsetWidth;
        this.cd.detectChanges();
        this.keyManager = new ActiveDescendantKeyManager(this.options).withWrap();
        // Activate selected item or first option
        const selectedOption = this.options.find(o => o.selected);
        if (selectedOption) {
            this.keyManager.setActiveItem(selectedOption);
        }
        else {
            this.keyManager.setFirstItemActive();
        }
        // Listen to button presses if picklist to activate matching option
        this.keyboardSubscribe(this.variant === 'base');
        // When it is open we listen for option changes in order to fix active option and handle scroll
        this.optionChangesSubscription = this.options.changes.subscribe(() => {
            if (!this.activeOption || this.options.toArray().indexOf(this.activeOption) === -1) {
                // Activate first option if active one is destroyed
                this.keyManager.setFirstItemActive();
            }
            else {
                this.activeOption.scrollIntoView();
            }
            this.updateMenuHeight();
        });
        this.updateMenuHeight();
    }
    onDetach() {
        if (this.open) {
            this.close();
            return;
        }
        // Clear aria-activedescendant when menu is closed
        this.inputEl.setAriaActiveDescendant(null);
        this.detach();
    }
    trackByOption(index, option) {
        return option.value;
    }
    dropdownClass() {
        return {
            [`slds-dropdown_length-${this.visibleLength}`]: this.visibleLength > 0,
        };
    }
    inputIconRight() {
        return this.isLookup ? 'utility:search' : 'utility:down';
    }
    hasNoMatches() {
        return this.isLookup && this.data.length === 0 && !this.loadingMore;
    }
    onOptionSelection(option = this.activeOption) {
        const selection = addOptionToSelection(option.value, this.selection, this.multiple);
        this.selectionChange.emit(selection);
        if (this.closeOnSelection) {
            this.close();
        }
    }
    // Trigger by clear button on Lookup
    onClearSelection() {
        this.selectionChange.emit(null);
        setTimeout(() => this.inputEl.focus(), 0);
    }
    /**
     * Check whether value is currently selected.
     *
     * @param value The value in test, whether is (part of) selection or not
     */
    isSelected(value) {
        return isOptionSelected(value, this.selection, this.multiple);
    }
    ngOnDestroy() {
        this.detach();
    }
    close() {
        this.openChange.emit(false);
    }
    detach() {
        this.keyboardSubscribe(false);
        this.keyManager = null;
        if (this.optionChangesSubscription) {
            this.optionChangesSubscription.unsubscribe();
            this.optionChangesSubscription = null;
        }
    }
    calculateDisplayValue() {
        const value = this.selectionValueFn(this.selectedOptions.map(option => option.label));
        this.inputEl.setValue(value);
    }
    keyboardSubscribe(listen) {
        if (this.keyboardSubscription) {
            this.keyboardSubscription.unsubscribe();
            this.keyboardSubscription = null;
        }
        if (listen) {
            this.keyboardSubscription = this.inputEl.keyboardBuffer$.subscribe((pattern) => {
                pattern = pattern.toLocaleLowerCase();
                const options = this.options.toArray();
                const activeIndex = this.activeOption ? this.keyManager.activeItemIndex + 1 : 0;
                for (let i = 0, n = options.length; i < n; i++) {
                    const index = (activeIndex + i) % n;
                    const option = options[index];
                    if (!option.disabled && option.label.toLocaleLowerCase().substr(0, pattern.length) === pattern) {
                        this.keyManager.setActiveItem(option);
                        break;
                    }
                }
            });
        }
    }
    updateMenuHeight() {
        this.ngZone.onStable.asObservable().pipe(take(1)).subscribe(() => {
            const { overlayRef } = this.cdkOverlay;
            const height = this.dropdownElementRef.nativeElement.offsetHeight;
            overlayRef.updateSize({
                minHeight: height + 4,
            });
            overlayRef.updatePosition();
        });
    }
}
NglCombobox.decorators = [
    { type: Component, args: [{
                selector: 'ngl-combobox',
                changeDetection: ChangeDetectionStrategy.OnPush,
                template: "\n<label [nglFormLabel]=\"label\" [attr.for]=\"inputEl.id\"></label>\n<div class=\"slds-form-element__control\">\n  <div class=\"slds-combobox_container\" [class.slds-has-selection]=\"hasLookupSingleSelection\">\n    <div class=\"slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click\" [attr.aria-expanded]=\"open\" aria-haspopup=\"listbox\" role=\"combobox\" [class.slds-is-open]=\"open\" [attr.aria-owns]=\"uid\">\n      <div class=\"slds-combobox__form-element slds-input-has-icon\" role=\"none\" cdkOverlayOrigin #overlayOrigin=\"cdkOverlayOrigin\" [class.slds-input-has-icon_group-right]=\"loading\" [class.slds-input-has-icon_right]=\"!loading\">\n        <ng-content select=\"input\"></ng-content>\n        <div class=\"slds-input__icon-group slds-input__icon-group_right\" *ngIf=\"loading; else iconRight\">\n          <div class=\"slds-spinner slds-spinner_brand slds-spinner_x-small slds-input__spinner\" role=\"status\"><span class=\"slds-assistive-text\">{{ loadingLabel }}</span>\n            <div class=\"slds-spinner__dot-a\"></div>\n            <div class=\"slds-spinner__dot-b\"></div>\n          </div>\n          <ng-template [ngTemplateOutlet]=\"iconRight\"></ng-template>\n        </div>\n        <ng-template #iconRight>\n          <button class=\"slds-button slds-button_icon slds-input__icon slds-input__icon_right\" *ngIf=\"hasLookupSingleSelection; else iconTpl\" type=\"button\" (click)=\"onClearSelection()\" [title]=\"removeSelectedLabel\">\n            <svg class=\"slds-button__icon\" nglIconName=\"utility:close\"></svg><span class=\"slds-assistive-text\">{{ removeSelectedLabel }}</span>\n          </button>\n        </ng-template>\n        <ng-template #iconTpl><span class=\"slds-icon_container slds-input__icon slds-input__icon_right\">\n            <svg class=\"slds-icon slds-icon_x-small slds-icon-text-default\" [nglIconName]=\"inputIconRight()\"></svg></span></ng-template>\n      </div>\n    </div>\n  </div>\n</div>\n<ng-template cdkConnectedOverlay #cdkOverlay=\"cdkConnectedOverlay\" [cdkConnectedOverlayPositions]=\"overlayPositions\" [cdkConnectedOverlayOrigin]=\"overlayOrigin\" [cdkConnectedOverlayMinWidth]=\"overlayWidth\" [cdkConnectedOverlayOpen]=\"open\" (nglOverlayScrolledOutsideView)=\"close()\" (attach)=\"onAttach()\" (detach)=\"onDetach()\">\n  <div class=\"slds-dropdown slds-dropdown_fluid\" #dropdown [attr.id]=\"uid\" role=\"listbox\" [ngClass]=\"dropdownClass()\" (mousedown)=\"$event.preventDefault()\">\n    <ul class=\"slds-listbox slds-listbox_vertical\" role=\"presentation\">\n      <li *ngFor=\"let d of data; trackBy: trackByOption\" nglComboboxOption [value]=\"d.value\" [label]=\"d.label\" [disabled]=\"d.disabled\" [selected]=\"isSelected(d.value)\"></li>\n      <li class=\"slds-listbox__item\" *ngIf=\"loadingMore\" role=\"presentation\">\n        <div class=\"slds-align_absolute-center slds-p-top_medium\">\n          <div class=\"slds-spinner slds-spinner_x-small slds-spinner_inline\" role=\"status\">\n            <div class=\"slds-assistive-text\">{{ loadingLabel }}</div>\n            <div class=\"slds-spinner__dot-a\"></div>\n            <div class=\"slds-spinner__dot-b\"></div>\n          </div>\n        </div>\n      </li>\n      <li class=\"slds-listbox__item\" *ngIf=\"hasNoMatches()\" role=\"presentation\" aria-live=\"polite\">\n        <div class=\"slds-align_absolute-center\"><span role=\"status\">{{ noOptionsFound }}</span></div>\n      </li>\n    </ul>\n  </div>\n</ng-template>",
                host: {
                    'class.slds-form-element': 'true',
                },
                providers: [NglComboboxService]
            },] }
];
NglCombobox.ctorParameters = () => [
    { type: NglComboboxConfig, decorators: [{ type: Optional }, { type: Inject, args: [NGL_COMBOBOX_CONFIG,] }] },
    { type: NgZone },
    { type: ChangeDetectorRef },
    { type: NglComboboxService }
];
NglCombobox.propDecorators = {
    variant: [{ type: Input }],
    label: [{ type: Input }],
    open: [{ type: Input }],
    openChange: [{ type: Output }],
    selection: [{ type: Input }],
    selectionChange: [{ type: Output }],
    multiple: [{ type: Input }],
    visibleLength: [{ type: Input }],
    inputEl: [{ type: ContentChild, args: [NglComboboxInput, { static: true },] }],
    loading: [{ type: Input }],
    loadingMore: [{ type: Input }],
    closeOnSelection: [{ type: Input }],
    loadingLabel: [{ type: Input }],
    noOptionsFound: [{ type: Input }],
    removeSelectedLabel: [{ type: Input }],
    options: [{ type: ViewChildren, args: [NglComboboxOption,] }],
    data: [{ type: Input, args: ['options',] }],
    overlayOrigin: [{ type: ViewChild, args: ['overlayOrigin', { static: true },] }],
    cdkOverlay: [{ type: ViewChild, args: ['cdkOverlay',] }],
    dropdownElementRef: [{ type: ViewChild, args: ['dropdown',] }],
    selectionValueFn: [{ type: Input }]
};
__decorate([
    InputBoolean()
], NglCombobox.prototype, "open", void 0);
__decorate([
    InputBoolean()
], NglCombobox.prototype, "multiple", void 0);
__decorate([
    InputNumber()
], NglCombobox.prototype, "visibleLength", void 0);
__decorate([
    InputBoolean()
], NglCombobox.prototype, "loading", void 0);
__decorate([
    InputBoolean()
], NglCombobox.prototype, "loadingMore", void 0);
__decorate([
    InputBoolean()
], NglCombobox.prototype, "closeOnSelection", void 0);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tYm9ib3guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9uZy1saWdodG5pbmcvc3JjL2xpYi9jb21ib2JveGVzL2NvbWJvYm94LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLHVCQUF1QixFQUMvRCxZQUFZLEVBQTRCLFlBQVksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFjLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekosT0FBTyxFQUFFLDBCQUEwQixFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFHL0QsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQ3RFLE9BQU8sRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDaEYsT0FBTyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUM1RCxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUNwRCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUN4RCxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFpQmxFLE1BQU0sT0FBTyxXQUFXO0lBMEd0QixZQUFxRCxhQUFnQyxFQUNqRSxNQUFjLEVBQ2QsRUFBcUIsRUFDckIsT0FBMkI7UUFGM0IsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUNkLE9BQUUsR0FBRixFQUFFLENBQW1CO1FBQ3JCLFlBQU8sR0FBUCxPQUFP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RUFBRTtzQkFFL0MsS0FBSzswQkFFTCxLQUFLOytCQUVMLEtBQUs7MkJBS0wsS0FBSzs2QkFLTCxLQUFLO2tDQUtMLEtBQUs7c0JBRUwsWUFBWSxTQUFDLGlCQUFpQjttQkFFOUIsS0FBSyxTQUFDLFNBQVM7NEJBZ0JmLFNBQVMsU0FBQyxlQUFlLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO3lCQUUzQyxTQUFTLFNBQUMsWUFBWTtpQ0FFdEIsU0FBUyxTQUFDLFVBQVU7K0JBZXBCLEtBQUs7O0FBeEVtQjtJQUFmLFlBQVksRUFBRTt5Q0FBdUI7QUFRdEI7SUFBZixZQUFZLEVBQUU7NkNBQTJCO0FBRTNCO0lBQWQsV0FBVyxFQUFFO2tEQUF3QztBQUl0QztJQUFmLFlBQVksRUFBRTs0Q0FBMkI7QUFFMUI7SUFBZixZQUFZLEVBQUU7Z0RBQStCO0FBRTlCO0lBQWYsWUFBWSxFQUFFO3FEQUFrQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgSW5wdXQsIE91dHB1dCwgRXZlbnRFbWl0dGVyLCBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgT25DaGFuZ2VzLCBUZW1wbGF0ZVJlZiwgT25EZXN0cm95LFxuICAgICAgICAgVmlld0NoaWxkcmVuLCBRdWVyeUxpc3QsIFNpbXBsZUNoYW5nZXMsIENvbnRlbnRDaGlsZCwgVmlld0NoaWxkLCBOZ1pvbmUsIEVsZW1lbnRSZWYsIENoYW5nZURldGVjdG9yUmVmLCBPcHRpb25hbCwgSW5qZWN0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBY3RpdmVEZXNjZW5kYW50S2V5TWFuYWdlciB9IGZyb20gJ0Bhbmd1bGFyL2Nkay9hMTF5JztcbmltcG9ydCB7IENvbm5lY3Rpb25Qb3NpdGlvblBhaXIsIENka092ZXJsYXlPcmlnaW4sIENka0Nvbm5lY3RlZE92ZXJsYXkgfSBmcm9tICdAYW5ndWxhci9jZGsvb3ZlcmxheSc7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IHRha2UgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBERUZBVUxUX0RST1BET1dOX1BPU0lUSU9OUyB9IGZyb20gJy4uL3V0aWwvb3ZlcmxheS1wb3NpdGlvbic7XG5pbXBvcnQgeyB1bmlxdWVJZCwgaXNPcHRpb25TZWxlY3RlZCwgYWRkT3B0aW9uVG9TZWxlY3Rpb24gfSBmcm9tICcuLi91dGlsL3V0aWwnO1xuaW1wb3J0IHsgSW5wdXRCb29sZWFuLCBJbnB1dE51bWJlciB9IGZyb20gJy4uL3V0aWwvY29udmVydCc7XG5pbXBvcnQgeyBOZ2xDb21ib2JveE9wdGlvbiB9IGZyb20gJy4vY29tYm9ib3gtb3B0aW9uJztcbmltcG9ydCB7IE5nbENvbWJvYm94SW5wdXQgfSBmcm9tICcuL2NvbWJvYm94LWlucHV0JztcbmltcG9ydCB7IE5nbENvbWJvYm94U2VydmljZSB9IGZyb20gJy4vY29tYm9ib3guc2VydmljZSc7XG5pbXBvcnQgeyBOZ2xDb21ib2JveENvbmZpZywgTkdMX0NPTUJPQk9YX0NPTkZJRyB9IGZyb20gJy4vY29uZmlnJztcblxuZXhwb3J0IGludGVyZmFjZSBOZ2xDb21ib2JveE9wdGlvbkl0ZW0ge1xuICB2YWx1ZTogbnVtYmVyIHwgc3RyaW5nO1xuICBsYWJlbD86IHN0cmluZztcbiAgZGlzYWJsZWQ/OiBib29sZWFuO1xufVxuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICduZ2wtY29tYm9ib3gnLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbiAgdGVtcGxhdGVVcmw6ICcuL2NvbWJvYm94Lmh0bWwnLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzLnNsZHMtZm9ybS1lbGVtZW50JzogJ3RydWUnLFxuICB9LFxuICBwcm92aWRlcnM6IFsgTmdsQ29tYm9ib3hTZXJ2aWNlIF0sXG59KVxuZXhwb3J0IGNsYXNzIE5nbENvbWJvYm94IGltcGxlbWVudHMgT25DaGFuZ2VzLCBPbkRlc3Ryb3kge1xuXG4gIEBJbnB1dCgpIHJlYWRvbmx5IHZhcmlhbnQ6ICdiYXNlJyB8ICdsb29rdXAnID0gJ2Jhc2UnO1xuXG4gIEBJbnB1dCgpIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgfCBUZW1wbGF0ZVJlZjxhbnk+O1xuXG4gIHJlYWRvbmx5IHVpZCA9IHVuaXF1ZUlkKCdjb21ib2JveCcpO1xuXG4gIEBJbnB1dCgpIEBJbnB1dEJvb2xlYW4oKSByZWFkb25seSBvcGVuID0gZmFsc2U7XG5cbiAgQE91dHB1dCgpIG9wZW5DaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPGJvb2xlYW4+KCk7XG5cbiAgQElucHV0KCkgcmVhZG9ubHkgc2VsZWN0aW9uOiBhbnk7XG5cbiAgQE91dHB1dCgpIHNlbGVjdGlvbkNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICBASW5wdXQoKSBASW5wdXRCb29sZWFuKCkgcmVhZG9ubHkgbXVsdGlwbGUgPSBmYWxzZTtcblxuICBASW5wdXQoKSBASW5wdXROdW1iZXIoKSByZWFkb25seSB2aXNpYmxlTGVuZ3RoOiA1IHwgNyB8IDEwID0gNTtcblxuICBAQ29udGVudENoaWxkKE5nbENvbWJvYm94SW5wdXQsIHsgc3RhdGljOiB0cnVlIH0pIGlucHV0RWw6IE5nbENvbWJvYm94SW5wdXQ7XG5cbiAgQElucHV0KCkgQElucHV0Qm9vbGVhbigpIHJlYWRvbmx5IGxvYWRpbmc6IGJvb2xlYW47XG5cbiAgQElucHV0KCkgQElucHV0Qm9vbGVhbigpIHJlYWRvbmx5IGxvYWRpbmdNb3JlOiBib29sZWFuO1xuXG4gIEBJbnB1dCgpIEBJbnB1dEJvb2xlYW4oKSByZWFkb25seSBjbG9zZU9uU2VsZWN0aW9uID0gdHJ1ZTtcblxuICAvKipcbiAgICogVGV4dCBhZGRlZCB0byBsb2FkaW5nIHNwaW5uZXIuXG4gICAqL1xuICBASW5wdXQoKSBsb2FkaW5nTGFiZWw6IHN0cmluZztcblxuICAvKipcbiAgICogVGV4dCBtZXNzYWdlIHRoYXQgcmVuZGVycyB3aGVuIG5vIG1hdGNoZXMgZm91bmQuXG4gICAqL1xuICBASW5wdXQoKSBub09wdGlvbnNGb3VuZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUZXh0IGZvciByZW1vdmluZyBzaW5nbGUgc2VsZWN0ZWQgb3B0aW9uLlxuICAgKi9cbiAgQElucHV0KCkgcmVtb3ZlU2VsZWN0ZWRMYWJlbDogc3RyaW5nO1xuXG4gIEBWaWV3Q2hpbGRyZW4oTmdsQ29tYm9ib3hPcHRpb24pIHJlYWRvbmx5IG9wdGlvbnM6IFF1ZXJ5TGlzdDxOZ2xDb21ib2JveE9wdGlvbj47XG5cbiAgQElucHV0KCdvcHRpb25zJykgc2V0IGRhdGEoZGF0YTogYW55W10pIHtcbiAgICB0aGlzLl9kYXRhID0gKGRhdGEgfHwgW10pLm1hcCgoZCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBkID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBTdXBwb3J0IGFycmF5IG9mIHN0cmluZ3MgYXMgb3B0aW9ucywgYnkgbWFwcGluZyB0byBOZ2xDb21ib2JveE9wdGlvbkl0ZW1cbiAgICAgICAgcmV0dXJuIHsgdmFsdWU6IGQsIGxhYmVsOiBkIH07XG4gICAgICB9IGVsc2UgaWYgKCFkLmxhYmVsKSB7XG4gICAgICAgIC8vIFVzZSBgdmFsdWVgIGlmIG1pc3NpbmcgYGxhYmVsYFxuICAgICAgICByZXR1cm4geyAuLi5kLCBsYWJlbDogZC52YWx1ZSB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGQ7XG4gICAgfSk7XG4gIH1cbiAgZ2V0IGRhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gIH1cblxuICBAVmlld0NoaWxkKCdvdmVybGF5T3JpZ2luJywgeyBzdGF0aWM6IHRydWUgfSkgb3ZlcmxheU9yaWdpbjogQ2RrT3ZlcmxheU9yaWdpbjtcblxuICBAVmlld0NoaWxkKCdjZGtPdmVybGF5JykgY2RrT3ZlcmxheTogQ2RrQ29ubmVjdGVkT3ZlcmxheTtcblxuICBAVmlld0NoaWxkKCdkcm9wZG93bicpIGRyb3Bkb3duRWxlbWVudFJlZjogRWxlbWVudFJlZjtcblxuICBvdmVybGF5V2lkdGggPSAwO1xuXG4gIG92ZXJsYXlQb3NpdGlvbnM6IENvbm5lY3Rpb25Qb3NpdGlvblBhaXJbXSA9IFsuLi5ERUZBVUxUX0RST1BET1dOX1BPU0lUSU9OU1snbGVmdCddXTtcblxuICAvKiogTWFuYWdlcyBhY3RpdmUgaXRlbSBpbiBvcHRpb24gbGlzdCBiYXNlZCBvbiBrZXkgZXZlbnRzLiAqL1xuICBrZXlNYW5hZ2VyOiBBY3RpdmVEZXNjZW5kYW50S2V5TWFuYWdlcjxOZ2xDb21ib2JveE9wdGlvbj47XG5cbiAgcHJpdmF0ZSBvcHRpb25DaGFuZ2VzU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG5cbiAgcHJpdmF0ZSBfZGF0YTogTmdsQ29tYm9ib3hPcHRpb25JdGVtW10gfCBudWxsO1xuXG4gIHByaXZhdGUga2V5Ym9hcmRTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcblxuICBASW5wdXQoKSBzZWxlY3Rpb25WYWx1ZUZuID0gKHNlbGVjdGlvbjogc3RyaW5nW10pOiBzdHJpbmcgPT4ge1xuICAgIGlmIChzZWxlY3Rpb24ubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKHRoaXMubXVsdGlwbGUgJiYgdGhpcy5pc0xvb2t1cCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2VsZWN0aW9uLmxlbmd0aCA9PT0gMSA/IHNlbGVjdGlvblswXSA6IGAke3NlbGVjdGlvbi5sZW5ndGh9IG9wdGlvbnMgc2VsZWN0ZWRgO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICBnZXQgYWN0aXZlT3B0aW9uKCk6IE5nbENvbWJvYm94T3B0aW9uIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMua2V5TWFuYWdlciA/IHRoaXMua2V5TWFuYWdlci5hY3RpdmVJdGVtIDogbnVsbDtcbiAgfVxuXG4gIGdldCBzZWxlY3RlZE9wdGlvbnMoKTogTmdsQ29tYm9ib3hPcHRpb25JdGVtW10ge1xuICAgIHJldHVybiB0aGlzLmRhdGEgPyB0aGlzLmRhdGEuZmlsdGVyKGQgPT4gdGhpcy5pc1NlbGVjdGVkKGQudmFsdWUpKSA6IFtdO1xuICB9XG5cbiAgZ2V0IGlzTG9va3VwKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnZhcmlhbnQgPT09ICdsb29rdXAnO1xuICB9XG5cbiAgZ2V0IGhhc0xvb2t1cFNpbmdsZVNlbGVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5pc0xvb2t1cCAmJiAhdGhpcy5tdWx0aXBsZSAmJiB0aGlzLnNlbGVjdGVkT3B0aW9ucy5sZW5ndGggPiAwO1xuICB9XG5cbiAgY29uc3RydWN0b3IoQE9wdGlvbmFsKCkgQEluamVjdChOR0xfQ09NQk9CT1hfQ09ORklHKSBkZWZhdWx0Q29uZmlnOiBOZ2xDb21ib2JveENvbmZpZyxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZSxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBjZDogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgICAgICAgICAgIHByaXZhdGUgc2VydmljZTogTmdsQ29tYm9ib3hTZXJ2aWNlKSB7XG4gICAgY29uc3QgY29uZmlnID0geyAuLi5uZXcgTmdsQ29tYm9ib3hDb25maWcoKSwgLi4uZGVmYXVsdENvbmZpZyB9O1xuICAgIHRoaXMubG9hZGluZ0xhYmVsID0gY29uZmlnLmxvYWRpbmdMYWJlbDtcbiAgICB0aGlzLm5vT3B0aW9uc0ZvdW5kID0gY29uZmlnLm5vT3B0aW9uc0ZvdW5kO1xuICAgIHRoaXMucmVtb3ZlU2VsZWN0ZWRMYWJlbCA9IGNvbmZpZy5yZW1vdmVTZWxlY3RlZExhYmVsO1xuXG4gICAgdGhpcy5zZXJ2aWNlLmNvbWJvYm94ID0gdGhpcztcbiAgICAvLyB0aGlzLnNlcnZpY2Uub3BlbkNoYW5nZSA9IHRoaXMub3BlbkNoYW5nZTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICBpZiAoY2hhbmdlcy5zZWxlY3Rpb24pIHtcbiAgICAgIHRoaXMuY2FsY3VsYXRlRGlzcGxheVZhbHVlKCk7XG4gICAgfVxuICB9XG5cbiAgb25BdHRhY2goKSB7XG4gICAgLy8gU2FtZSB3aWR0aCBhcyB0aGUgdHJpZ2dlciBlbGVtZW50XG4gICAgdGhpcy5vdmVybGF5V2lkdGggPSB0aGlzLm92ZXJsYXlPcmlnaW4uZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Lm9mZnNldFdpZHRoO1xuICAgIHRoaXMuY2QuZGV0ZWN0Q2hhbmdlcygpO1xuXG4gICAgdGhpcy5rZXlNYW5hZ2VyID0gbmV3IEFjdGl2ZURlc2NlbmRhbnRLZXlNYW5hZ2VyKHRoaXMub3B0aW9ucykud2l0aFdyYXAoKTtcblxuICAgIC8vIEFjdGl2YXRlIHNlbGVjdGVkIGl0ZW0gb3IgZmlyc3Qgb3B0aW9uXG4gICAgY29uc3Qgc2VsZWN0ZWRPcHRpb24gPSB0aGlzLm9wdGlvbnMuZmluZChvID0+IG8uc2VsZWN0ZWQpO1xuICAgIGlmIChzZWxlY3RlZE9wdGlvbikge1xuICAgICAgdGhpcy5rZXlNYW5hZ2VyLnNldEFjdGl2ZUl0ZW0oc2VsZWN0ZWRPcHRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmtleU1hbmFnZXIuc2V0Rmlyc3RJdGVtQWN0aXZlKCk7XG4gICAgfVxuXG4gICAgLy8gTGlzdGVuIHRvIGJ1dHRvbiBwcmVzc2VzIGlmIHBpY2tsaXN0IHRvIGFjdGl2YXRlIG1hdGNoaW5nIG9wdGlvblxuICAgIHRoaXMua2V5Ym9hcmRTdWJzY3JpYmUodGhpcy52YXJpYW50ID09PSAnYmFzZScpO1xuXG4gICAgLy8gV2hlbiBpdCBpcyBvcGVuIHdlIGxpc3RlbiBmb3Igb3B0aW9uIGNoYW5nZXMgaW4gb3JkZXIgdG8gZml4IGFjdGl2ZSBvcHRpb24gYW5kIGhhbmRsZSBzY3JvbGxcbiAgICB0aGlzLm9wdGlvbkNoYW5nZXNTdWJzY3JpcHRpb24gPSB0aGlzLm9wdGlvbnMuY2hhbmdlcy5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmFjdGl2ZU9wdGlvbiB8fCB0aGlzLm9wdGlvbnMudG9BcnJheSgpLmluZGV4T2YodGhpcy5hY3RpdmVPcHRpb24pID09PSAtMSkge1xuICAgICAgICAvLyBBY3RpdmF0ZSBmaXJzdCBvcHRpb24gaWYgYWN0aXZlIG9uZSBpcyBkZXN0cm95ZWRcbiAgICAgICAgdGhpcy5rZXlNYW5hZ2VyLnNldEZpcnN0SXRlbUFjdGl2ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hY3RpdmVPcHRpb24uc2Nyb2xsSW50b1ZpZXcoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy51cGRhdGVNZW51SGVpZ2h0KCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnVwZGF0ZU1lbnVIZWlnaHQoKTtcbiAgfVxuXG4gIG9uRGV0YWNoKCkge1xuICAgIGlmICh0aGlzLm9wZW4pIHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBDbGVhciBhcmlhLWFjdGl2ZWRlc2NlbmRhbnQgd2hlbiBtZW51IGlzIGNsb3NlZFxuICAgIHRoaXMuaW5wdXRFbC5zZXRBcmlhQWN0aXZlRGVzY2VuZGFudChudWxsKTtcblxuICAgIHRoaXMuZGV0YWNoKCk7XG4gIH1cblxuICB0cmFja0J5T3B0aW9uKGluZGV4LCBvcHRpb246IE5nbENvbWJvYm94T3B0aW9uKSB7XG4gICAgcmV0dXJuIG9wdGlvbi52YWx1ZTtcbiAgfVxuXG4gIGRyb3Bkb3duQ2xhc3MoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIFtgc2xkcy1kcm9wZG93bl9sZW5ndGgtJHt0aGlzLnZpc2libGVMZW5ndGh9YF06IHRoaXMudmlzaWJsZUxlbmd0aCA+IDAsXG4gICAgfTtcbiAgfVxuXG4gIGlucHV0SWNvblJpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmlzTG9va3VwID8gJ3V0aWxpdHk6c2VhcmNoJyA6ICd1dGlsaXR5OmRvd24nO1xuICB9XG5cbiAgaGFzTm9NYXRjaGVzKCkge1xuICAgIHJldHVybiB0aGlzLmlzTG9va3VwICYmIHRoaXMuZGF0YS5sZW5ndGggPT09IDAgJiYgIXRoaXMubG9hZGluZ01vcmU7XG4gIH1cblxuICBvbk9wdGlvblNlbGVjdGlvbihvcHRpb246IE5nbENvbWJvYm94T3B0aW9uID0gdGhpcy5hY3RpdmVPcHRpb24pIHtcbiAgICBjb25zdCBzZWxlY3Rpb24gPSBhZGRPcHRpb25Ub1NlbGVjdGlvbihvcHRpb24udmFsdWUsIHRoaXMuc2VsZWN0aW9uLCB0aGlzLm11bHRpcGxlKTtcbiAgICB0aGlzLnNlbGVjdGlvbkNoYW5nZS5lbWl0KHNlbGVjdGlvbik7XG4gICAgaWYgKHRoaXMuY2xvc2VPblNlbGVjdGlvbikge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRyaWdnZXIgYnkgY2xlYXIgYnV0dG9uIG9uIExvb2t1cFxuICBvbkNsZWFyU2VsZWN0aW9uKCkge1xuICAgIHRoaXMuc2VsZWN0aW9uQ2hhbmdlLmVtaXQobnVsbCk7XG4gICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmlucHV0RWwuZm9jdXMoKSwgMCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgd2hldGhlciB2YWx1ZSBpcyBjdXJyZW50bHkgc2VsZWN0ZWQuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgaW4gdGVzdCwgd2hldGhlciBpcyAocGFydCBvZikgc2VsZWN0aW9uIG9yIG5vdFxuICAgKi9cbiAgaXNTZWxlY3RlZCh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGlzT3B0aW9uU2VsZWN0ZWQodmFsdWUsIHRoaXMuc2VsZWN0aW9uLCB0aGlzLm11bHRpcGxlKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuZGV0YWNoKCk7XG4gIH1cblxuICBjbG9zZSgpIHtcbiAgICB0aGlzLm9wZW5DaGFuZ2UuZW1pdChmYWxzZSk7XG4gIH1cblxuICBwcml2YXRlIGRldGFjaCgpIHtcbiAgICB0aGlzLmtleWJvYXJkU3Vic2NyaWJlKGZhbHNlKTtcbiAgICB0aGlzLmtleU1hbmFnZXIgPSBudWxsO1xuICAgIGlmICh0aGlzLm9wdGlvbkNoYW5nZXNTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMub3B0aW9uQ2hhbmdlc1N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vcHRpb25DaGFuZ2VzU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZURpc3BsYXlWYWx1ZSgpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuc2VsZWN0aW9uVmFsdWVGbih0aGlzLnNlbGVjdGVkT3B0aW9ucy5tYXAob3B0aW9uID0+IG9wdGlvbi5sYWJlbCkpO1xuICAgIHRoaXMuaW5wdXRFbC5zZXRWYWx1ZSh2YWx1ZSk7XG4gIH1cblxuICBwcml2YXRlIGtleWJvYXJkU3Vic2NyaWJlKGxpc3RlbjogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLmtleWJvYXJkU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLmtleWJvYXJkU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLmtleWJvYXJkU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAobGlzdGVuKSB7XG4gICAgICB0aGlzLmtleWJvYXJkU3Vic2NyaXB0aW9uID0gdGhpcy5pbnB1dEVsLmtleWJvYXJkQnVmZmVyJC5zdWJzY3JpYmUoKHBhdHRlcm4pID0+IHtcbiAgICAgICAgcGF0dGVybiA9IHBhdHRlcm4udG9Mb2NhbGVMb3dlckNhc2UoKTtcblxuICAgICAgICBjb25zdCBvcHRpb25zID0gdGhpcy5vcHRpb25zLnRvQXJyYXkoKTtcblxuICAgICAgICBjb25zdCBhY3RpdmVJbmRleCA9IHRoaXMuYWN0aXZlT3B0aW9uID8gdGhpcy5rZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCArIDEgOiAwO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbiA9IG9wdGlvbnMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgaW5kZXggPSAoYWN0aXZlSW5kZXggKyBpKSAlIG47XG4gICAgICAgICAgY29uc3Qgb3B0aW9uID0gb3B0aW9uc1tpbmRleF07XG4gICAgICAgICAgaWYgKCFvcHRpb24uZGlzYWJsZWQgJiYgb3B0aW9uLmxhYmVsLnRvTG9jYWxlTG93ZXJDYXNlKCkuc3Vic3RyKDAsIHBhdHRlcm4ubGVuZ3RoKSA9PT0gcGF0dGVybikge1xuICAgICAgICAgICAgdGhpcy5rZXlNYW5hZ2VyLnNldEFjdGl2ZUl0ZW0ob3B0aW9uKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVNZW51SGVpZ2h0KCkge1xuICAgIHRoaXMubmdab25lLm9uU3RhYmxlLmFzT2JzZXJ2YWJsZSgpLnBpcGUodGFrZSgxKSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGNvbnN0IHsgb3ZlcmxheVJlZiB9ID0gdGhpcy5jZGtPdmVybGF5O1xuICAgICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5kcm9wZG93bkVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgICBvdmVybGF5UmVmLnVwZGF0ZVNpemUoe1xuICAgICAgICBtaW5IZWlnaHQ6IGhlaWdodCArIDQsXG4gICAgICB9KTtcbiAgICAgIG92ZXJsYXlSZWYudXBkYXRlUG9zaXRpb24oKTtcbiAgICB9KTtcbiAgfVxufVxuIl19